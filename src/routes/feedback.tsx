import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Send, Bug, Lightbulb, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Share Feedback — SmartAiSQLMentor" },
      { name: "description", content: "Tell us how SmartAiSQLMentor is working for you. Rate the AI, report bugs, and suggest improvements." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeedbackPage,
});

const schema = z.object({
  subject_area: z.enum(["general", "sql", "python", "gcp", "tutorial", "chat"]),
  overall_rating: z.number().int().min(1).max(5).nullable(),
  nps_score: z.number().int().min(0).max(10).nullable(),
  ai_quality_rating: z.number().int().min(1).max(5).nullable(),
  code_correctness: z.enum(["yes", "no", "sometimes"]).nullable(),
  bug_report: z.string().trim().max(2000).optional(),
  improvement_suggestion: z.string().trim().max(2000).optional(),
  contact_email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

const AREAS = [
  { id: "general", label: "Overall app" },
  { id: "sql", label: "SQL" },
  { id: "python", label: "Python" },
  { id: "gcp", label: "GCP" },
  { id: "tutorial", label: "Tutorial" },
  { id: "chat", label: "AI Chat" },
] as const;

function FeedbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  const [subjectArea, setSubjectArea] = useState<typeof AREAS[number]["id"]>("general");
  const [overall, setOverall] = useState<number | null>(null);
  const [nps, setNps] = useState<number | null>(null);
  const [aiQuality, setAiQuality] = useState<number | null>(null);
  const [codeCorrect, setCodeCorrect] = useState<"yes" | "no" | "sometimes" | null>(null);
  const [bug, setBug] = useState("");
  const [improvement, setImprovement] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/feedback" } as any });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  async function submit() {
    if (!user) return;
    const parsed = schema.safeParse({
      subject_area: subjectArea,
      overall_rating: overall,
      nps_score: nps,
      ai_quality_rating: aiQuality,
      code_correctness: codeCorrect,
      bug_report: bug,
      improvement_suggestion: improvement,
      contact_email: email,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please review your inputs");
      return;
    }
    if (
      overall === null &&
      nps === null &&
      aiQuality === null &&
      codeCorrect === null &&
      !bug.trim() &&
      !improvement.trim()
    ) {
      toast.error("Add at least one rating or comment before submitting");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      subject_area: subjectArea,
      page_context: typeof document !== "undefined" ? document.referrer || null : null,
      overall_rating: overall,
      nps_score: nps,
      ai_quality_rating: aiQuality,
      code_correctness: codeCorrect,
      bug_report: bug.trim() || null,
      improvement_suggestion: improvement.trim() || null,
      contact_email: email.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Thanks! Your feedback was sent.");
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</main>;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => router.history.back()}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-3xl font-bold tracking-tight">Share your feedback</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Help us improve SmartAiSQLMentor — your ratings, bug reports, and ideas go straight to the team.
        </p>

        {done ? (
          <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-4 text-xl font-semibold">Feedback received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you. We read every submission.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={() => { setDone(false); setOverall(null); setNps(null); setAiQuality(null); setCodeCorrect(null); setBug(""); setImprovement(""); }}>
                Send another
              </Button>
              <Button onClick={() => navigate({ to: "/" })}>Go home</Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-8 rounded-xl border border-border bg-card p-6">
            {/* Subject area */}
            <div>
              <Label className="text-sm font-semibold">Which part is this about?</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSubjectArea(a.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      subjectArea === a.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall stars */}
            <RatingStars
              label="Overall satisfaction"
              hint="How happy are you with SmartAiSQLMentor overall?"
              value={overall}
              onChange={setOverall}
            />

            {/* NPS 0–10 */}
            <div>
              <Label className="text-sm font-semibold">
                How likely are you to recommend us to a friend or colleague?
              </Label>
              <div className="mt-3 grid grid-cols-11 gap-1.5">
                {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNps(n)}
                    className={`aspect-square rounded-md border text-xs font-semibold transition-colors ${
                      nps === n
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                <span>Not likely</span>
                <span>Extremely likely</span>
              </div>
            </div>

            {/* AI explanation quality */}
            <RatingStars
              label="AI explanation quality"
              hint="How clear and accurate were the AI's explanations?"
              value={aiQuality}
              onChange={setAiQuality}
            />

            {/* Code correctness */}
            <div>
              <Label className="text-sm font-semibold">
                Did the code or SQL the AI generated run successfully without errors?
              </Label>
              <RadioGroup
                value={codeCorrect ?? ""}
                onValueChange={(v) => setCodeCorrect(v as "yes" | "no" | "sometimes")}
                className="mt-3 flex flex-wrap gap-4"
              >
                {(["yes", "sometimes", "no"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value={v} id={`cc-${v}`} />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Bug report */}
            <div>
              <Label htmlFor="bug" className="flex items-center gap-1.5 text-sm font-semibold">
                <Bug className="h-4 w-4 text-warning" /> Found a bug?
              </Label>
              <Textarea
                id="bug"
                value={bug}
                onChange={(e) => setBug(e.target.value)}
                placeholder="Steps to reproduce, what you expected, what happened…"
                maxLength={2000}
                className="mt-2 min-h-[90px]"
              />
            </div>

            {/* Improvement */}
            <div>
              <Label htmlFor="imp" className="flex items-center gap-1.5 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-primary-glow" /> What should we improve or add?
              </Label>
              <Textarea
                id="imp"
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                placeholder="Features, topics, companies, UX changes…"
                maxLength={2000}
                className="mt-2 min-h-[90px]"
              />
            </div>

            {/* Contact */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold">Contact email (optional)</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">We'll only use this to follow up on your report.</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={submit} disabled={submitting} size="lg">
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function RatingStars({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover ?? value ?? 0) >= n;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onChange(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="p-1"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  active ? "fill-warning text-warning" : "text-muted-foreground"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  BrainCircuit,
  Gauge,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/hooks/use-theme";

function GoogleMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.9z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.2-8.8 2.2-6.3 0-11.6-3.7-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

function getAuthOrigin() {
  if (typeof window === "undefined") return "https://smartsqlaimentor.live";
  return window.location.origin;
}

function getAuthRedirect(path = "/") {
  return `${getAuthOrigin()}${path}`;
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Smart AI Code Playground" },
      {
        name: "description",
        content:
          "Sign in or create an account to access AI-mentored practice in SQL, Python, Java, C/C++, PySpark and GCP with resumable sessions.",
      },
      { property: "og:title", content: "Sign in — Smart AI Code Playground" },
      {
        property: "og:description",
        content:
          "Sign in to Smart AI Code Playground and resume your adaptive coding and interview practice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://smartsqlaimentor.live/auth" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.live/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<
    "signin" | "signup" | "google" | "resend" | null
  >(null);
  const [notice, setNotice] = useState<"verify" | null>(null);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const queryEmail = params.get("email");
    if (queryEmail) setEmail(queryEmail.trim().toLowerCase());
    if (params.has("password") || params.has("email")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setActiveAction(mode);
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: getAuthRedirect("/") },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created. You're signed in.");
          navigate({ to: "/" });
          return;
        }
        setNotice("verify");
        toast.success("Check your email to verify your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        toast.success("Signed in.");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      const message = String(err?.message ?? "Authentication failed");
      if (message.toLowerCase().includes("invalid login")) {
        toast.error("Invalid credentials or email not verified yet. Check your inbox first.");
      } else if (message.toLowerCase().includes("failed to fetch")) {
        toast.error(
          "Authentication could not connect. Open the default Lovable preview and try again.",
        );
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
      setActiveAction(null);
    }
  }

  async function resendVerification() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    setActiveAction("resend");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: { emailRedirectTo: getAuthRedirect("/") },
      });
      if (error) throw error;
      toast.success("Verification email sent.");
      setNotice("verify");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not resend verification email");
    } finally {
      setBusy(false);
      setActiveAction(null);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setActiveAction("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: getAuthOrigin(),
      });
      if (result.error) throw new Error(String((result.error as any)?.message ?? result.error));
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setBusy(false);
      setActiveAction(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Toaster position="top-right" richColors />
      {/* ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(60rem 40rem at 10% -10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), radial-gradient(50rem 35rem at 110% 110%, color-mix(in oklab, var(--primary-glow) 20%, transparent), transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(70% 60% at 50% 40%, black, transparent)",
        }}
      />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1100px] items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16">
        {/* brand panel */}
        <section className="hidden lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-lg shadow-primary/25">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Smart AI Code Playground</span>
          </div>
          <h2 className="mt-8 text-3xl font-semibold leading-tight tracking-tight">
            Practice like the interview is tomorrow.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            One workspace for SQL, Python, Java, C/C++, PySpark and GCP — with an AI mentor that
            grades your reasoning, not just your output.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: BrainCircuit, title: "AI-graded answers", body: "Semantic feedback on every query and function you write." },
              { icon: Gauge, title: "Adaptive difficulty", body: "Questions shift with your mastery, topic by topic." },
              { icon: Save, title: "Resume anywhere", body: "Your session, code buffers and progress follow you across devices." },
            ].map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-2">
                  <f.icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* auth card */}
        <div className="mx-auto w-full max-w-[26rem] space-y-5">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Smart AI Code Playground</span>
          </div>

          <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-xl shadow-primary/5 backdrop-blur space-y-5">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Sign in to Smart AI Code Playground
              </h1>
              <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                SQL · Python · Java · C/C++ · PySpark · GCP
              </p>
            </div>

            <div className="relative grid grid-cols-2 rounded-xl border border-border bg-surface-2 p-1">
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-background shadow-sm transition-transform duration-300 ${mode === "signup" ? "translate-x-[calc(100%+0.5rem)]" : "translate-x-1"}`}
              />
              <button
                type="button"
                onClick={() => setMode("signin")}
                aria-pressed={mode === "signin"}
                className={`relative z-10 rounded-lg py-2 text-xs font-medium transition-colors ${mode === "signin" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                aria-pressed={mode === "signup"}
                className={`relative z-10 rounded-lg py-2 text-xs font-medium transition-colors ${mode === "signup" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Create account
              </button>
            </div>

            <button
              onClick={handleGoogle}
              disabled={busy}
              className={`w-full rounded-xl border border-border bg-background py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all duration-200 hover:bg-accent disabled:opacity-60 active:scale-[0.98] ${busy && activeAction === "google" ? "auth-processing ring-2 ring-primary/40" : ""}`}
            >
              {busy && activeAction === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleMark />
              )}
              {busy && activeAction === "google" ? "Opening Google..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or use email
              <div className="h-px flex-1 bg-border" />
            </div>
          {notice === "verify" && (
            <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Confirm your email to continue</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    We sent a verification link to {email.trim() || "your email"}. You can sign in
                    after confirming it.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setNotice(null);
                  }}
                  className="h-11 w-full rounded-xl border border-input bg-background/60 pl-9 pr-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background/60 pl-9 pr-11 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-90"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" && password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? "bg-primary" : "bg-border"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {strength <= 1 ? "Weak" : strength === 2 ? "Fair" : strength === 3 ? "Good" : "Strong"}
                  </span>
                </div>
              )}
              {mode === "signin" && (
                <div className="mt-2 text-right">
                  <Link to="/reset-password" className="text-[11px] text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={busy}
              className={`w-full rounded-xl py-2.5 text-sm font-medium bg-gradient-to-r from-primary to-primary-glow text-primary-foreground disabled:opacity-70 inline-flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] ${busy && (activeAction === "signin" || activeAction === "signup") ? "auth-processing ring-2 ring-primary/60" : ""}`}
            >
              {busy && (activeAction === "signin" || activeAction === "signup") && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {busy && activeAction === mode
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              onClick={resendVerification}
              disabled={busy}
              className={`w-full rounded-xl py-2 text-xs border border-border hover:bg-accent disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${busy && activeAction === "resend" ? "auth-processing ring-2 ring-primary/40" : ""}`}
            >
              {busy && activeAction === "resend" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {busy && activeAction === "resend"
                ? "Sending verification..."
                : "Resend verification email"}
            </button>
          )}
          </div>

          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground hover:underline">
              Home
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/mysql" className="hover:text-foreground hover:underline">
              SQL practice
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/python" className="hover:text-foreground hover:underline">
              Code playground
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/faq" className="hover:text-foreground hover:underline">
              FAQ
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/about" className="hover:text-foreground hover:underline">
              About
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="hover:text-foreground hover:underline">
              Contact
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-foreground hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

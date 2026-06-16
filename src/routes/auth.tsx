import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { CheckCircle2, Eye, EyeOff, Loader2, Mail, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

const DEFAULT_LOVABLE_ORIGIN =
  "https://project--93a75156-6283-48bf-a62b-5aa287cea47b-dev.lovable.app";

function getAuthOrigin() {
  if (typeof window === "undefined") return DEFAULT_LOVABLE_ORIGIN;
  const { hostname, origin } = window.location;
  if (hostname.endsWith(".lovable.app")) {
    return hostname.startsWith("id-preview--") ? DEFAULT_LOVABLE_ORIGIN : origin;
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  return DEFAULT_LOVABLE_ORIGIN;
}

function getAuthRedirect(path = "/") {
  return `${getAuthOrigin()}${path}`;
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SQL Intelligence Engine" },
      {
        name: "description",
        content:
          "Sign in or create an account to access adaptive MySQL practice, AI-mentored feedback, and per-topic mastery tracking.",
      },
      { property: "og:title", content: "Sign in — SQL Intelligence Engine" },
      {
        property: "og:description",
        content: "Sign in to your adaptive SQL practice account and resume your daily curriculum.",
      },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.lovable.app/auth" }],
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
    <main className="min-h-screen bg-background grid place-items-center p-4">
      <Toaster theme="dark" position="top-right" richColors />
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Terminal className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Sign in to SQL Intelligence Engine</h1>
            <p className="text-[11px] text-muted-foreground font-mono">adaptive practice</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 text-xs py-1.5 rounded transition-all duration-200 active:scale-[0.97] ${mode === "signin" ? "bg-accent ring-1 ring-primary/30" : "text-muted-foreground hover:bg-accent/60"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 text-xs py-1.5 rounded transition-all duration-200 active:scale-[0.97] ${mode === "signup" ? "bg-accent ring-1 ring-primary/30" : "text-muted-foreground hover:bg-accent/60"}`}
            >
              Create account
            </button>
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

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="auth-email"
                className="text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setNotice(null);
                }}
                className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/60"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-90"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              className={`w-full py-2 rounded-md text-sm font-medium bg-gradient-to-r from-primary to-primary-glow text-primary-foreground disabled:opacity-70 inline-flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] ${busy && (activeAction === "signin" || activeAction === "signup") ? "auth-processing ring-2 ring-primary/60" : ""}`}
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
              className={`w-full py-2 rounded-md text-xs border border-border hover:bg-accent disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${busy && activeAction === "resend" ? "auth-processing ring-2 ring-primary/40" : ""}`}
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

          <div className="flex items-center gap-3 text-[10px] uppercase text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className={`w-full py-2 rounded-md text-sm border border-border hover:bg-accent disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${busy && activeAction === "google" ? "auth-processing ring-2 ring-primary/40" : ""}`}
          >
            {busy && activeAction === "google" && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy && activeAction === "google" ? "Opening Google..." : "Continue with Google"}
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          <Link to="/" className="hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

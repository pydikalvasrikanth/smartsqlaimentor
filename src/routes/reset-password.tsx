import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — SQL Intelligence Engine" },
      {
        name: "description",
        content: "Reset your SQL Intelligence Engine password and return to adaptive SQL practice.",
      },
      { property: "og:title", content: "Reset password — SQL Intelligence Engine" },
      { property: "og:description", content: "Securely reset your SQL practice account password." },
      { property: "og:url", content: "https://smartsqlaimentor.lovable.app/reset-password" },
    ],
    links: [{ rel: "canonical", href: "https://smartsqlaimentor.lovable.app/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const recoveryRequested = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const search = new URLSearchParams(window.location.search);
    return hash.get("type") === "recovery" || search.get("type") === "recovery";
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(Boolean(data.session));
    });
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${getAuthOrigin()}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent.");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send password reset email");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  const canUpdatePassword = recoveryRequested || hasRecoverySession;

  return (
    <main className="min-h-screen bg-background grid place-items-center p-4">
      <Toaster theme="dark" position="top-right" richColors />
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Terminal className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Reset your password</h1>
            <p className="text-[11px] text-muted-foreground font-mono">secure account access</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            <p className="text-xs leading-5 text-muted-foreground">
              {canUpdatePassword
                ? "Enter a new password for your account."
                : "Enter your account email and we'll send a secure reset link."}
            </p>
          </div>

          {canUpdatePassword ? (
            <form onSubmit={updatePassword} className="space-y-3">
              <div>
                <label
                  htmlFor="new-password"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  New password
                </label>
                <div className="relative mt-1">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Confirm password
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/60"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-90"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className={`w-full py-2 rounded-md text-sm font-medium bg-gradient-to-r from-primary to-primary-glow text-primary-foreground disabled:opacity-70 inline-flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] ${busy ? "auth-processing ring-2 ring-primary/60" : ""}`}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset} className="space-y-3">
              <div>
                <label
                  htmlFor="reset-email"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className={`w-full py-2 rounded-md text-sm font-medium bg-gradient-to-r from-primary to-primary-glow text-primary-foreground disabled:opacity-70 inline-flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] ${busy ? "auth-processing ring-2 ring-primary/60" : ""}`}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          <Link to="/auth" className="hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

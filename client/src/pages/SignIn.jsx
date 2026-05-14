import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { API_ORIGIN } from "@/api/client";
import { loginWithPassword } from "@/api/authApi";
import { useAuth } from "@/contexts/AuthContext";
import AuthShell from "./auth/AuthShell";

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startOauth = (provider) => {
    window.location.href = `${API_ORIGIN}/api/auth/${provider}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await loginWithPassword({ email, password });
      await refresh();
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't sign you in.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick your job hunt back up."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        <OauthButton onClick={() => startOauth("google")} variant="outline">
          Continue with Google
        </OauthButton>
        <OauthButton onClick={() => startOauth("github")} variant="filled">
          Continue with GitHub
        </OauthButton>
      </div>

      <Divider />

      {oauthError && (
        <ErrorBanner>Sign-in failed. Please try again.</ErrorBanner>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <button
          type="submit"
          disabled={submitting}
          className="press group inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({ label, name, ...rest }) {
  return (
    <label className="block" htmlFor={name}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        id={name}
        name={name}
        {...rest}
        className="mt-1.5 block h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-shadow duration-150 focus:border-foreground focus:ring-2 focus:ring-foreground/10"
      />
    </label>
  );
}

function OauthButton({ children, onClick, variant }) {
  const base =
    "press inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors";
  const styles =
    variant === "filled"
      ? "bg-foreground text-background hover:opacity-90"
      : "border border-border bg-background hover:bg-accent";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span>or with email</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function ErrorBanner({ children }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
    >
      {children}
    </div>
  );
}

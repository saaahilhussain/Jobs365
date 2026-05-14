import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { API_ORIGIN } from "@/api/client";
import {
  startRegistration,
  verifyRegistration,
  resendRegistrationCode,
} from "@/api/authApi";
import { useAuth } from "@/contexts/AuthContext";
import AuthShell from "./auth/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [step, setStep] = useState("details"); // details | verify
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startOauth = (provider) => {
    window.location.href = `${API_ORIGIN}/api/auth/${provider}`;
  };

  const onDetailsSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await startRegistration(form);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  const onVerified = async () => {
    await refresh();
    navigate("/app", { replace: true });
  };

  if (step === "verify") {
    return (
      <VerifyStep
        email={form.email}
        onBack={() => setStep("details")}
        onVerified={onVerified}
      />
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to use. We'll send a code to verify your email."
      footer={
        <>
          Already have one?{" "}
          <Link
            to="/signin"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
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

      <Divider label="or with email" />

      <form onSubmit={onDetailsSubmit} className="space-y-3">
        <Field
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          hint="At least 8 characters."
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
              Send verification code
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
          By creating an account you agree to our terms and acknowledge our
          privacy notice.
        </p>
      </form>
    </AuthShell>
  );
}

function VerifyStep({ email, onBack, onVerified }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = digits.join("");

  const setDigitAt = (i, v) => {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const onChange = (i, raw) => {
    const onlyDigits = raw.replace(/\D/g, "");
    if (!onlyDigits) {
      setDigitAt(i, "");
      return;
    }
    // Paste of full code
    if (onlyDigits.length > 1) {
      const chars = onlyDigits.slice(0, 6).split("");
      setDigits((prev) => {
        const next = [...prev];
        for (let k = 0; k < 6; k++) next[k] = chars[k] || "";
        return next;
      });
      const lastFilled = Math.min(5, chars.length - 1);
      inputsRef.current[lastFilled]?.focus();
      return;
    }
    setDigitAt(i, onlyDigits);
    if (i < 5) inputsRef.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (submitting || code.length !== 6) return;
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      await verifyRegistration({ email, code });
      await onVerified();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't verify the code.");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (code.length !== 6 || submitting) return;
    const id = setTimeout(() => submit(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = async () => {
    if (resending) return;
    setResending(true);
    setError("");
    setInfo("");
    try {
      await resendRegistrationCode({ email });
      setInfo("Sent a fresh code to your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </>
      }
      footer={
        <button
          type="button"
          onClick={onBack}
          className="press inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Use a different email
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div
          className="flex justify-between gap-2"
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (/\d/.test(text)) {
              e.preventDefault();
              onChange(0, text);
            }
          }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className="h-14 w-full max-w-[3rem] rounded-md border border-border bg-background text-center font-mono text-xl outline-none transition-all duration-150 focus:border-foreground focus:ring-2 focus:ring-foreground/10"
            />
          ))}
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}
        {info && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="press inline-flex h-10 w-full items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Verify and continue"
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Didn't get it?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="press font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ label, name, hint, ...rest }) {
  return (
    <label className="block" htmlFor={name}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        id={name}
        name={name}
        {...rest}
        className="mt-1.5 block h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-shadow duration-150 focus:border-foreground focus:ring-2 focus:ring-foreground/10"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
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

function Divider({ label }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
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

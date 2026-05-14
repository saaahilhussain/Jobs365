import { useSearchParams } from "react-router-dom";
import { API_ORIGIN } from "@/api/client";

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const startOauth = (provider) => {
    window.location.href = `${API_ORIGIN}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Jobs365</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your job pipeline
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Sign-in failed. Please try again.
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => startOauth("google")}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Continue with Google
          </button>
          <button
            onClick={() => startOauth("github")}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Continue with GitHub
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          You'll provide your own Apify API key once signed in.
        </p>
      </div>
    </div>
  );
}

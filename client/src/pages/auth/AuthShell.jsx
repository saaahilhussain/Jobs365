import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundDecor />
      <header className="relative z-10 mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-[11px] font-bold tracking-tight">J</span>
          </span>
          <span className="text-sm font-semibold tracking-tight">Jobs365</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-5 pb-12">
        <div
          className="rise-in"
          style={{ animationDelay: "0ms" }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className="rise-in mt-8"
          style={{ animationDelay: "80ms" }}
        >
          {children}
        </div>
        {footer && (
          <div
            className="rise-in mt-6 text-center text-sm text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            {footer}
          </div>
        )}
      </main>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0 [mask-image:radial-gradient(50%_50%_at_50%_0%,black,transparent)]"
    >
      <div className="bg-grid absolute inset-0 opacity-[0.6]" />
    </div>
  );
}

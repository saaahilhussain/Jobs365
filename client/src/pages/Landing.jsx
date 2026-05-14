import { Link } from "react-router-dom";
import {
  Briefcase,
  BarChart3,
  Send,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "Every job, one inbox",
    body: "We scrape LinkedIn, Indeed, Glassdoor, Naukri, and Internshala on your schedule. Roles land in one searchable feed — no more tab juggling.",
  },
  {
    icon: Sparkles,
    title: "Relevance, scored",
    body: "Each role is auto-scored against your stack so the right ones surface first. The noise stays out of your morning.",
  },
  {
    icon: Send,
    title: "Track applications, not spreadsheets",
    body: "One click moves a job from Discovered to Applied to Interviewing. Status changes live where the jobs live.",
  },
  {
    icon: ShieldCheck,
    title: "Scam detection built-in",
    body: "Bad-faith listings are flagged before you ever read them — no fake recruiters, no upfront fees.",
  },
  {
    icon: BarChart3,
    title: "Honest analytics",
    body: "See your response rate, time-to-interview, and where your funnel actually leaks. The dashboard tells you what to fix.",
  },
];

const trustedLogos = [
  { name: "LinkedIn", slug: "linkedin" },
  { name: "Indeed", slug: "indeed" },
  { name: "Glassdoor", slug: "glassdoor" },
  { name: "Naukri", slug: "naukridotcom" },
  { name: "Internshala", slug: "internshala" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <Hero />
      <TrustedRow />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">Jobs365</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/signin"
            className="press inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="press inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <BackgroundGrid />
      <div className="mx-auto max-w-6xl px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <h1
          className="rise-in mx-auto max-w-3xl text-center text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          style={{ animationDelay: "0ms" }}
        >
          The job search,
          <span className="block bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            without the busywork.
          </span>
        </h1>
        <p
          className="rise-in mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "60ms" }}
        >
          Jobs365 scrapes every board you care about, scores roles against your
          stack, and tracks your applications — all in one quiet, fast app.
        </p>
        <div
          className="rise-in mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "120ms" }}
        >
          <Link
            to="/register"
            className="press group inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:w-auto"
          >
            Start free
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/signin"
            className="press inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
          >
            I already have an account
          </Link>
        </div>
        <p
          className="rise-in mt-5 text-center text-xs text-muted-foreground"
          style={{ animationDelay: "180ms" }}
        >
          Free to use. Bring your own Apify key.
        </p>

        <div
          className="rise-in mt-16"
          style={{ animationDelay: "240ms" }}
        >
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-[2rem] bg-gradient-to-b from-muted/40 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_80px_-32px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-3 text-xs text-muted-foreground">
            jobs365.app / dashboard
          </span>
        </div>
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-4">
          <StatTile label="New today" value="48" />
          <StatTile label="High match" value="12" trend="+3" />
          <StatTile label="Applied" value="7" />
          <StatTile label="Replies" value="2" trend="+1" />
        </div>
        <div className="divide-y divide-border">
          {[
            { role: "Senior Frontend Engineer", co: "Linear", score: 94, when: "2m ago" },
            { role: "Full-stack Engineer (Node)", co: "Vercel", score: 88, when: "11m ago" },
            { role: "Product Engineer", co: "Raycast", score: 86, when: "31m ago" },
            { role: "React Engineer", co: "Resend", score: 81, when: "1h ago" },
          ].map((j) => (
            <div
              key={j.role}
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{j.role}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {j.co} · {j.when}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex h-6 items-center gap-1.5 rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {j.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, trend }) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600">{trend}</span>
        )}
      </div>
    </div>
  );
}

function TrustedRow() {
  const loop = [...trustedLogos, ...trustedLogos];
  return (
    <section className="border-y border-border bg-muted/30 py-6">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
          Scrapes from
        </p>
        <div className="mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="marquee-track flex w-max items-center gap-12">
            {loop.map((logo, i) => (
              <img
                key={`${logo.slug}-${i}`}
                src={`https://cdn.simpleicons.org/${logo.slug}`}
                alt={logo.name}
                loading="lazy"
                className="h-6 w-auto shrink-0 opacity-60 grayscale"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Built for the way you actually job-hunt.
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          The defaults are tuned. The animations stay out of your way. Every
          screen does one thing well.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
        <div className="hidden bg-muted/30 sm:block lg:hidden" />
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, body }) {
  return (
    <div className="group relative bg-card p-7 transition-colors duration-200 hover:bg-accent/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 text-foreground transition-transform duration-200 group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Drop in your Apify token",
      d: "We run the scrapers on your account. Your data stays yours.",
    },
    {
      n: "02",
      t: "Tell us your stack",
      d: "Frameworks, seniority, locations. We use it to score every role.",
    },
    {
      n: "03",
      t: "Wake up to a curated feed",
      d: "High-match roles surface first. The rest stays a click away.",
    },
  ];
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Three minutes to set up. Zero to maintain.
            </h2>
          </div>
          <ol className="lg:col-span-2 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="bg-card p-6">
                <span className="text-xs font-mono text-muted-foreground">
                  {s.n}
                </span>
                <h3 className="mt-2 text-base font-semibold tracking-tight">
                  {s.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground p-10 text-background sm:p-14">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop refreshing job boards.
          </h2>
          <p className="mt-4 text-base text-background/70">
            Let Jobs365 do the watching. You do the applying.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="press inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md bg-background px-5 text-sm font-medium text-foreground transition-opacity hover:opacity-95 sm:w-auto"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/signin"
              className="press inline-flex h-11 w-full items-center justify-center rounded-md border border-background/15 bg-transparent px-5 text-sm font-medium text-background transition-colors hover:bg-background/10 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-medium tracking-tight">Jobs365</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Jobs365. Built quietly.
        </p>
      </div>
    </footer>
  );
}

function Logo() {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
      <span className="text-[11px] font-bold tracking-tight">J</span>
    </span>
  );
}

function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_30%,black,transparent)]"
    >
      <div className="bg-grid absolute inset-0 opacity-[0.6]" />
    </div>
  );
}

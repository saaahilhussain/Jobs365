import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Key, ExternalLink, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  {
    number: 1,
    title: "Create or sign in to Apify",
    description:
      "Jobs365 uses Apify actors to scrape job listings. Head to console.apify.com and sign up for a free account if you don't have one.",
    link: { label: "Open Apify Console", href: "https://console.apify.com" },
  },
  {
    number: 2,
    title: "Copy your Personal API Token",
    description:
      'In the Apify Console, go to Settings → Integrations. Under "Personal API tokens", click Create token, give it a name, and copy it.',
    link: {
      label: "Go to Apify Integrations",
      href: "https://console.apify.com/account/integrations",
    },
  },
  {
    number: 3,
    title: "Paste it in Jobs365 Settings",
    description:
      'Open Settings in the left sidebar, find the "Apify API Token" field, paste your token, and click Save Settings.',
  },
];

// When open/onClose are passed the modal is controlled externally (e.g. from Settings).
// Without those props it auto-shows when the signed-in user has no Apify token.
export default function ApifyOnboardingModal({ open: controlledOpen, onClose: onControlledClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [autoDismissed, setAutoDismissed] = useState(
    () => sessionStorage.getItem(`apify_onboarding_dismissed_${user?.id}`) === "1"
  );

  const isControlled = controlledOpen !== undefined;
  const isVisible = isControlled
    ? controlledOpen
    : !autoDismissed && Boolean(user) && !user.hasApifyToken;

  if (!isVisible) return null;

  const handleClose = () => {
    if (isControlled) {
      onControlledClose?.();
    } else {
      sessionStorage.setItem(`apify_onboarding_dismissed_${user.id}`, "1");
      setAutoDismissed(true);
    }
  };

  const handleGoToSettings = () => {
    handleClose();
    navigate("/app/settings");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Key className="h-4 w-4 text-sidebar-active" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Connect your Apify account
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Required to start scraping job listings
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-4">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-sidebar-active">
                  {step.number}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sidebar-active hover:underline"
                  >
                    {step.link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — only shown in auto mode (not when triggered from Settings) */}
        {!isControlled && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <button
              onClick={handleClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Remind me later
            </button>
            <button
              onClick={handleGoToSettings}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-sidebar-active transition-colors hover:bg-accent/80"
            >
              Go to Settings
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

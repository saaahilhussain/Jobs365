import { useEffect, useState } from "react";
import { Check, AlertCircle, LogOut } from "lucide-react";
import ApifyOnboardingModal from "@/components/ApifyOnboardingModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSettings,
  updateSettings,
  testApifyToken,
} from "@/api/settingsApi";
import { getActors } from "@/api/scraperApi";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Settings() {
  const { user, logout, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [testResult, setTestResult] = useState(null);

  const [tokenInput, setTokenInput] = useState("");
  const [existingMask, setExistingMask] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [apifyUsername, setApifyUsername] = useState("");
  const [defaultActor, setDefaultActor] = useState("linkedin");
  const [actors, setActors] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, actorList] = await Promise.all([
          getSettings(),
          getActors(),
        ]);
        if (settings) {
          setExistingMask(settings.apifyToken || "");
          setHasToken(Boolean(settings.hasApifyToken));
          setApifyUsername(settings.apifyUsername || "");
          setDefaultActor(settings.defaultActorKey || "linkedin");
        }
        setActors(actorList || []);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage("");
    try {
      const payload = { defaultActorKey: defaultActor };
      if (tokenInput.trim()) payload.apifyToken = tokenInput.trim();
      const updated = await updateSettings(payload);
      setExistingMask(updated.apifyToken || "");
      setHasToken(Boolean(updated.hasApifyToken));
      setApifyUsername(updated.apifyUsername || "");
      setTokenInput("");
      setSavedMessage("Saved");
      await refresh();
      setTimeout(() => setSavedMessage(""), 2000);
    } catch (err) {
      setSavedMessage(
        err?.response?.data?.message || "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testApifyToken(tokenInput.trim() || undefined);
      setTestResult({
        ok: true,
        message: `Connected as ${result.username || "unknown"}${
          result.plan ? ` (${result.plan})` : ""
        }`,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message: err?.response?.data?.message || "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Remove your saved Apify token?")) return;
    setSaving(true);
    try {
      const updated = await updateSettings({ apifyToken: "" });
      setExistingMask("");
      setHasToken(Boolean(updated.hasApifyToken));
      setApifyUsername("");
      setTokenInput("");
      await refresh();
    } catch (err) {
      setSavedMessage(err?.response?.data?.message || "Failed to clear token");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="space-y-6 max-w-2xl">
      <ApifyOnboardingModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      {/* Account */}
      <Section title="Account">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "—"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email} · {user?.provider}
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </Section>

      {/* Apify */}
      <Section title="Apify">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Apify API Token
            </label>
            <button
              onClick={() => setGuideOpen(true)}
              className="cursor-pointer text-xs text-sidebar-active hover:underline"
            >
              How to get your API token
            </button>
          </div>
          {hasToken && !tokenInput && (
            <div className="mb-2 space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Currently saved: <span className="font-mono">{existingMask}</span>
              </p>
              {apifyUsername && (
                <p className="text-xs text-muted-foreground">
                  Connected as:{" "}
                  <span className="font-medium text-foreground">{apifyUsername}</span>
                </p>
              )}
            </div>
          )}
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder={hasToken ? "Enter a new token to replace" : "apify_api_..."}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleTest}
              disabled={testing || (!tokenInput.trim() && !hasToken)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? "Testing..." : "Test connection"}
            </button>
            {hasToken && (
              <button
                onClick={handleClear}
                disabled={saving}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Remove saved token
              </button>
            )}
          </div>
          {testResult && (
            <p
              className={`mt-2 inline-flex items-center gap-1 text-xs ${
                testResult.ok ? "text-green-600" : "text-red-600"
              }`}
            >
              {testResult.ok ? (
                <Check className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {testResult.message}
            </p>
          )}
        </div>

        <SelectField
          label="Default scraper"
          value={defaultActor}
          onChange={setDefaultActor}
          options={actors.map((a) => ({
            value: a.key,
            label: `${a.label}${a.configured ? "" : " (not configured)"}`,
            disabled: !a.configured,
          }))}
        />
      </Section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {savedMessage && (
          <span className="text-xs text-muted-foreground">{savedMessage}</span>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-4 px-5 py-4">{children}</div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

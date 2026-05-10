export default function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Apify Configuration */}
      <Section title="Apify Configuration">
        <Field label="API Token" placeholder="apify_api_xxxxxxxxxxxx" type="password" />
        <Field label="Actor ID" placeholder="actor/job-scraper" />
        <Field label="Max Results Per Run" placeholder="100" type="number" />
      </Section>

      {/* Notification Settings */}
      <Section title="Notification Settings">
        <Toggle label="Email notifications" defaultChecked />
        <Toggle label="Telegram alerts" />
        <Field label="Telegram Bot Token" placeholder="123456:ABC-DEF..." />
        <Field label="Telegram Chat ID" placeholder="-1001234567890" />
      </Section>

      {/* Scraping Schedule */}
      <Section title="Scraping Schedule">
        <SelectField
          label="Frequency"
          options={["Every 6 hours", "Every 12 hours", "Daily", "Weekly"]}
        />
        <Field label="Preferred Time (UTC)" placeholder="08:00" />
        <Toggle label="Auto-scrape on startup" defaultChecked />
      </Section>

      {/* API Configuration */}
      <Section title="API Configuration">
        <Field label="Backend API URL" placeholder="http://localhost:5000/api" />
        <Field label="Request Timeout (ms)" placeholder="10000" type="number" />
      </Section>

      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
        Save Settings
      </button>
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

function Field({ label, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function Toggle({ label, defaultChecked = false }) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border"
      />
    </label>
  );
}

function SelectField({ label, options }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

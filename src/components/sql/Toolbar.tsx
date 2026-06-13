import { Loader2 } from "lucide-react";

interface Props {
  topic: string;
  onTopic: (v: string) => void;
  difficulty: string;
  onDifficulty: (v: string) => void;
  onStart: () => void;
  onReset: () => void;
  hasSession: boolean;
  loading: boolean;
  showCompany?: boolean;
  company?: string;
  onCompany?: (v: string) => void;
  companies?: string[];
}

export const INTERVIEW_TOPIC = "🎯 Interview Preparation (FAANG)";

const TOPICS = [
  INTERVIEW_TOPIC,
  "E-commerce orders",
  "SaaS subscriptions",
  "Library catalog",
  "Hospital records",
  "Streaming platform (Netflix-like)",
  "Airline reservations",
  "Real estate listings",
  "HR & payroll",
  "University enrollment",
  "Banking & transactions",
  "Stock trading platform",
  "Ride-sharing (Uber-like)",
  "Food delivery (Swiggy-like)",
  "Hotel booking",
  "Online learning (Coursera-like)",
  "Social media (Twitter-like)",
  "Messaging app (WhatsApp-like)",
  "Music streaming (Spotify-like)",
  "Video sharing (YouTube-like)",
  "Online auctions (eBay-like)",
  "Crowdfunding platform",
  "Fitness tracker app",
  "Restaurant POS",
  "Movie theatre booking",
  "Car rental",
  "Insurance claims",
  "Loan management",
  "Cryptocurrency exchange",
  "Inventory & warehouse",
  "Supply chain & logistics",
  "Manufacturing plant",
  "Retail POS",
  "Pharmacy management",
  "Veterinary clinic",
  "Dental clinic",
  "Gym membership",
  "Sports league & matches",
  "Olympics medal tracking",
  "Election voting system",
  "Government tax records",
  "Court case management",
  "Police records",
  "Military logistics",
  "Library e-books",
  "Newspaper subscriptions",
  "Podcast platform",
  "Blogging platform",
  "Forum & comments",
  "Helpdesk ticketing",
  "CRM & sales pipeline",
  "Marketing campaigns",
  "Email newsletter platform",
  "IoT sensor data",
  "Weather observations",
  "Traffic & telematics",
  "Energy / electricity meters",
  "Solar / smart-grid data",
  "Hospital ICU monitoring",
  "Pharmacy clinical trials",
  "Genomics & sequencing",
  "Astronomy observations",
  "Chess tournament records",
  "Esports match data",
  "Video game leaderboards",
  "Recipe & nutrition database",
  "Travel itinerary planner",
  "Public transit (metro)",
  "Parking lot management",
  "Charity donations",
  "NGO project tracking",
  "School attendance",
  "Online exam proctoring",
  "Job board (LinkedIn-like)",
  "Freelance marketplace (Upwork-like)",
  "App store reviews",
];

export function Toolbar({
  topic,
  onTopic,
  difficulty,
  onDifficulty,
  onStart,
  onReset,
  hasSession,
  loading,
  showCompany,
  company,
  onCompany,
  companies,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-lg border border-border bg-card">
      <Field label="Topic" htmlFor="toolbar-topic">
        <select
          id="toolbar-topic"
          name="topic"
          value={topic}
          onChange={(e) => onTopic(e.target.value)}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-mono"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Difficulty" htmlFor="toolbar-difficulty">
        <select
          id="toolbar-difficulty"
          name="difficulty"
          value={difficulty}
          onChange={(e) => onDifficulty(e.target.value)}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-mono"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </Field>
      {showCompany && companies && onCompany && (
        <Field label="Company" htmlFor="toolbar-company">
          <select
            id="toolbar-company"
            name="company"
            value={company}
            onChange={(e) => onCompany(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-mono"
          >
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      )}
      <div className="flex gap-2 sm:ml-auto">
        <button
          onClick={onStart}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:opacity-95 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {hasSession ? "Restart" : "Start session"}
        </button>
        {hasSession && (
          <button
            onClick={onReset}
            className="px-3 py-2 rounded-md text-sm border border-border hover:bg-accent"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <label htmlFor={htmlFor} className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

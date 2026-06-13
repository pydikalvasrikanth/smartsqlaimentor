// Curated catalogue of classic SQL interview questions asked at FAANG+
// (Meta/Facebook, Google, Amazon, Apple, Netflix, Microsoft, Walmart, Uber,
// Airbnb, LinkedIn, Stripe, Bloomberg, Goldman Sachs, etc.).
// The AI engine is instructed to treat these as the canonical pool and
// rotate through them, generating matching schema + seed data on demand.
// Titles are intentionally short — the AI expands each into a full problem.

export interface InterviewProblem {
  id: number;
  title: string;
  companies: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  concept: string;
}

export const INTERVIEW_BANK: InterviewProblem[] = [
  // ---------- Classic LeetCode / FAANG SQL 50 ----------
  { id: 1, title: "Nth highest salary", companies: ["Meta", "Amazon", "Google"], difficulty: "intermediate", concept: "subquery" },
  { id: 2, title: "Second highest salary", companies: ["Meta", "Amazon"], difficulty: "beginner", concept: "subquery" },
  { id: 3, title: "Department highest salary", companies: ["Amazon", "Google"], difficulty: "intermediate", concept: "window-rank" },
  { id: 4, title: "Department top three salaries", companies: ["Amazon", "Microsoft"], difficulty: "advanced", concept: "dense-rank" },
  { id: 5, title: "Employees earning more than their manager", companies: ["Meta", "Uber"], difficulty: "beginner", concept: "self-join" },
  { id: 6, title: "Duplicate emails", companies: ["Meta"], difficulty: "beginner", concept: "group-by-having" },
  { id: 7, title: "Customers who never order", companies: ["Amazon"], difficulty: "beginner", concept: "left-join-null" },
  { id: 8, title: "Delete duplicate emails (keep min id)", companies: ["Microsoft"], difficulty: "intermediate", concept: "delete-self-join" },
  { id: 9, title: "Rising temperature (yesterday vs today)", companies: ["Google"], difficulty: "intermediate", concept: "self-join-date" },
  { id: 10, title: "Game play analysis: first login per player", companies: ["Meta"], difficulty: "intermediate", concept: "min-group-by" },
  { id: 11, title: "Game play analysis: fraction of returning players (D1 retention)", companies: ["Meta", "Netflix"], difficulty: "advanced", concept: "retention" },
  { id: 12, title: "Trips and users — cancellation rate", companies: ["Uber", "Lyft"], difficulty: "advanced", concept: "case-aggregate" },
  { id: 13, title: "Exchange seats (swap adjacent)", companies: ["Google"], difficulty: "intermediate", concept: "case-mod" },
  { id: 14, title: "Reformat department table (pivot months)", companies: ["Microsoft"], difficulty: "intermediate", concept: "pivot-with-case" },
  { id: 15, title: "Find users active on consecutive days", companies: ["Meta", "Snapchat"], difficulty: "advanced", concept: "gap-and-island" },
  { id: 16, title: "Consecutive numbers appearing 3+ times", companies: ["Meta"], difficulty: "intermediate", concept: "lag-lead" },
  { id: 17, title: "Human traffic of stadium (3+ consecutive days)", companies: ["Google"], difficulty: "advanced", concept: "gap-and-island" },
  { id: 18, title: "Median employee salary (no built-in)", companies: ["Bloomberg"], difficulty: "advanced", concept: "median-percentile" },
  { id: 19, title: "Tree node type (root/inner/leaf)", companies: ["Amazon"], difficulty: "intermediate", concept: "case-self-join" },
  { id: 20, title: "Friend requests acceptance rate", companies: ["Meta"], difficulty: "intermediate", concept: "ratio-aggregate" },
  { id: 21, title: "Active users this month vs last month", companies: ["Meta", "Netflix"], difficulty: "advanced", concept: "date-cohort" },
  { id: 22, title: "Top-N products per category", companies: ["Amazon", "Walmart"], difficulty: "intermediate", concept: "row-number" },
  { id: 23, title: "Running total of revenue by day", companies: ["Stripe", "Amazon"], difficulty: "intermediate", concept: "running-total" },
  { id: 24, title: "Month-over-month growth %", companies: ["Stripe", "Airbnb"], difficulty: "advanced", concept: "lag-window" },
  { id: 25, title: "Cumulative distinct users (DAU→MAU)", companies: ["Meta", "TikTok"], difficulty: "advanced", concept: "rolling-window" },

  // ---------- Aggregation & GROUP BY ----------
  { id: 26, title: "Average salary excluding min and max per department", companies: ["LinkedIn"], difficulty: "advanced", concept: "trimmed-mean" },
  { id: 27, title: "Departments with average salary > company average", companies: ["Microsoft"], difficulty: "intermediate", concept: "subquery-having" },
  { id: 28, title: "Customers who spent more than $1000 in any month", companies: ["Amazon"], difficulty: "beginner", concept: "group-by-having" },
  { id: 29, title: "Count orders per customer including zero orders", companies: ["Walmart"], difficulty: "beginner", concept: "left-join-count" },
  { id: 30, title: "Percentage of total revenue per category", companies: ["Shopify"], difficulty: "intermediate", concept: "ratio-to-total" },
  { id: 31, title: "Day of week with highest average sales", companies: ["Walmart"], difficulty: "intermediate", concept: "date-functions" },
  { id: 32, title: "Hourly active users histogram", companies: ["Uber"], difficulty: "intermediate", concept: "extract-hour" },
  { id: 33, title: "Number of new vs returning customers per month", companies: ["Airbnb"], difficulty: "advanced", concept: "first-purchase-cohort" },
  { id: 34, title: "Top 5 spending users in Q4", companies: ["Stripe"], difficulty: "intermediate", concept: "order-limit" },
  { id: 35, title: "Average order value per channel", companies: ["Shopify"], difficulty: "beginner", concept: "avg-group" },

  // ---------- Joins ----------
  { id: 36, title: "Find users with no logins in last 30 days", companies: ["Meta"], difficulty: "intermediate", concept: "anti-join" },
  { id: 37, title: "Self-join: employees in same city as their manager", companies: ["Google"], difficulty: "intermediate", concept: "self-join" },
  { id: 38, title: "Pairs of products bought together (basket analysis)", companies: ["Amazon"], difficulty: "advanced", concept: "self-join-pairs" },
  { id: 39, title: "Movies watched by user A but not user B", companies: ["Netflix"], difficulty: "intermediate", concept: "set-difference" },
  { id: 40, title: "Drivers who completed trips but never received a rating", companies: ["Uber"], difficulty: "intermediate", concept: "left-join-null" },
  { id: 41, title: "Cross join: every product paired with every store", companies: ["Walmart"], difficulty: "beginner", concept: "cross-join" },
  { id: 42, title: "Match orders to nearest warehouse (lateral)", companies: ["Amazon"], difficulty: "advanced", concept: "lateral-join" },
  { id: 43, title: "Find overlapping booking time ranges", companies: ["Airbnb"], difficulty: "advanced", concept: "interval-overlap" },
  { id: 44, title: "Customers who bought all products in category", companies: ["Amazon"], difficulty: "advanced", concept: "division-relational" },

  // ---------- Window functions ----------
  { id: 45, title: "Rank employees within department by hire date", companies: ["Microsoft"], difficulty: "intermediate", concept: "rank" },
  { id: 46, title: "Difference from previous row revenue (LAG)", companies: ["Stripe"], difficulty: "intermediate", concept: "lag-lead" },
  { id: 47, title: "7-day moving average of signups", companies: ["LinkedIn"], difficulty: "advanced", concept: "moving-average" },
  { id: 48, title: "First and last order per customer", companies: ["Amazon"], difficulty: "intermediate", concept: "first-value-last-value" },
  { id: 49, title: "Quartile of customers by lifetime value (NTILE)", companies: ["Stripe"], difficulty: "advanced", concept: "ntile" },
  { id: 50, title: "Streak of consecutive winning days", companies: ["Bloomberg"], difficulty: "advanced", concept: "gap-and-island" },
  { id: 51, title: "Sessionize events by 30-min inactivity gap", companies: ["Meta"], difficulty: "advanced", concept: "session-window" },
  { id: 52, title: "Cumulative sum reset on category change", companies: ["Goldman Sachs"], difficulty: "advanced", concept: "partition-running" },
  { id: 53, title: "Percent change vs same day last week", companies: ["Uber"], difficulty: "advanced", concept: "lag-by-offset" },

  // ---------- CTEs / Recursive ----------
  { id: 54, title: "Employee management hierarchy (recursive)", companies: ["Microsoft"], difficulty: "advanced", concept: "recursive-cte" },
  { id: 55, title: "Generate calendar of dates between two timestamps", companies: ["Stripe"], difficulty: "advanced", concept: "recursive-cte-dates" },
  { id: 56, title: "Find ancestors of a category", companies: ["Amazon"], difficulty: "advanced", concept: "recursive-cte" },
  { id: 57, title: "Bill of materials: total cost of assembled product", companies: ["Tesla"], difficulty: "advanced", concept: "recursive-rollup" },

  // ---------- Strings / Dates ----------
  { id: 58, title: "Extract domain from email and count users per domain", companies: ["LinkedIn"], difficulty: "beginner", concept: "string-functions" },
  { id: 59, title: "Capitalize first letter of name (initcap)", companies: ["Apple"], difficulty: "beginner", concept: "string-functions" },
  { id: 60, title: "Find palindromic product names", companies: ["Google"], difficulty: "intermediate", concept: "reverse-string" },
  { id: 61, title: "Validate phone numbers via REGEXP", companies: ["Twilio"], difficulty: "intermediate", concept: "regexp" },
  { id: 62, title: "Customers who signed up on a weekend", companies: ["Airbnb"], difficulty: "beginner", concept: "dayofweek" },
  { id: 63, title: "Average days between consecutive orders per customer", companies: ["Amazon"], difficulty: "advanced", concept: "datediff-lag" },
  { id: 64, title: "Bucket users by signup year and month", companies: ["Spotify"], difficulty: "beginner", concept: "date-format" },
  { id: 65, title: "Detect time-zone offset issues in event log", companies: ["Bloomberg"], difficulty: "advanced", concept: "convert-tz" },

  // ---------- Pivot / Conditional ----------
  { id: 66, title: "Pivot monthly revenue into 12 columns", companies: ["Microsoft"], difficulty: "intermediate", concept: "pivot-with-case" },
  { id: 67, title: "Count of each status per project (pivoted)", companies: ["Atlassian"], difficulty: "intermediate", concept: "pivot-with-case" },
  { id: 68, title: "Unpivot column-stored survey answers into rows", companies: ["Salesforce"], difficulty: "advanced", concept: "unpivot-union" },
  { id: 69, title: "Show only customers in two specific countries via CASE", companies: ["Apple"], difficulty: "beginner", concept: "case-expression" },

  // ---------- Anti / Set / Existence ----------
  { id: 70, title: "Products never sold", companies: ["Walmart"], difficulty: "beginner", concept: "not-exists" },
  { id: 71, title: "Users active on web but not mobile", companies: ["Meta"], difficulty: "intermediate", concept: "set-difference" },
  { id: 72, title: "Symmetric pairs of friends", companies: ["Meta"], difficulty: "intermediate", concept: "self-join-symmetric" },
  { id: 73, title: "Mutual friends of two users", companies: ["LinkedIn"], difficulty: "advanced", concept: "intersection" },

  // ---------- Funnel / Retention / Cohort ----------
  { id: 74, title: "Funnel: signup → activate → first purchase conversion", companies: ["Stripe"], difficulty: "advanced", concept: "funnel" },
  { id: 75, title: "D7 retention by signup cohort", companies: ["Meta"], difficulty: "advanced", concept: "cohort-retention" },
  { id: 76, title: "Churned subscribers this month (active last month, gone now)", companies: ["Netflix"], difficulty: "advanced", concept: "churn" },
  { id: 77, title: "MAU by week with rolling 28-day window", companies: ["Meta"], difficulty: "advanced", concept: "rolling-distinct" },
  { id: 78, title: "First purchase channel attribution", companies: ["Shopify"], difficulty: "advanced", concept: "first-touch-attribution" },

  // ---------- E-commerce / Marketplace ----------
  { id: 79, title: "GMV by category by month", companies: ["Amazon"], difficulty: "intermediate", concept: "group-by-date" },
  { id: 80, title: "Customers whose 2nd order was within 7 days of 1st", companies: ["Amazon"], difficulty: "advanced", concept: "lead-window-date" },
  { id: 81, title: "Refund rate per seller", companies: ["eBay"], difficulty: "intermediate", concept: "ratio-aggregate" },
  { id: 82, title: "Sellers with > 90% positive reviews and > 50 sales", companies: ["Etsy"], difficulty: "intermediate", concept: "having-multiple" },
  { id: 83, title: "Identify potential fraud: 5+ orders in 1 hour same card", companies: ["Stripe"], difficulty: "advanced", concept: "window-time-bucket" },

  // ---------- Ride-share / Delivery ----------
  { id: 84, title: "Driver utilization rate per hour", companies: ["Uber"], difficulty: "advanced", concept: "time-window-ratio" },
  { id: 85, title: "Surge pricing: rides where wait > 5 min", companies: ["Lyft"], difficulty: "intermediate", concept: "filter-aggregate" },
  { id: 86, title: "Top 3 cities by completed trips", companies: ["Uber"], difficulty: "intermediate", concept: "rank-limit" },
  { id: 87, title: "Couriers who delivered every day last week", companies: ["DoorDash"], difficulty: "advanced", concept: "count-distinct-having" },

  // ---------- Streaming / Content ----------
  { id: 88, title: "Most-watched genre per user", companies: ["Netflix"], difficulty: "advanced", concept: "argmax-window" },
  { id: 89, title: "Songs skipped within 30 seconds", companies: ["Spotify"], difficulty: "intermediate", concept: "filter-aggregate" },
  { id: 90, title: "Top trending video last 24 hours by views", companies: ["YouTube"], difficulty: "intermediate", concept: "date-filter-rank" },
  { id: 91, title: "Bingeable shows: avg episodes watched per session", companies: ["Netflix"], difficulty: "advanced", concept: "session-aggregate" },

  // ---------- Social ----------
  { id: 92, title: "Posts with above-average engagement", companies: ["Meta"], difficulty: "intermediate", concept: "subquery-avg" },
  { id: 93, title: "Influencers: followers > 100k AND posts > 100", companies: ["Instagram"], difficulty: "beginner", concept: "filter-multiple" },
  { id: 94, title: "Comment thread depth (recursive)", companies: ["Reddit"], difficulty: "advanced", concept: "recursive-cte" },
  { id: 95, title: "Daily active users with at least one comment", companies: ["Meta"], difficulty: "intermediate", concept: "count-distinct" },

  // ---------- Finance / Banking ----------
  { id: 96, title: "Account balance over time (ledger running sum)", companies: ["Goldman Sachs"], difficulty: "advanced", concept: "running-total" },
  { id: 97, title: "Detect duplicate transactions within 60 seconds", companies: ["Stripe"], difficulty: "advanced", concept: "lag-time-window" },
  { id: 98, title: "Customer's largest single withdrawal per month", companies: ["JP Morgan"], difficulty: "intermediate", concept: "max-group-by" },
  { id: 99, title: "Mortgage default rate by FICO bucket", companies: ["Capital One"], difficulty: "intermediate", concept: "case-bucket-ratio" },
  { id: 100, title: "Stock daily return % using LAG", companies: ["Bloomberg"], difficulty: "intermediate", concept: "lag-lead" },

  // ---------- Ads / Marketing ----------
  { id: 101, title: "CTR (clicks/impressions) per campaign", companies: ["Google"], difficulty: "beginner", concept: "ratio-aggregate" },
  { id: 102, title: "Best performing ad creative per audience segment", companies: ["Meta"], difficulty: "advanced", concept: "argmax-window" },
  { id: 103, title: "Attribute conversions to last touchpoint", companies: ["Google"], difficulty: "advanced", concept: "last-value-window" },
  { id: 104, title: "Spend pacing: % of budget consumed mid-month", companies: ["Meta"], difficulty: "intermediate", concept: "ratio-date" },

  // ---------- HR / People analytics ----------
  { id: 105, title: "Tenure in years for each employee", companies: ["Microsoft"], difficulty: "beginner", concept: "datediff" },
  { id: 106, title: "Attrition rate per quarter", companies: ["Google"], difficulty: "advanced", concept: "cohort-churn" },
  { id: 107, title: "Salary band per role and percentile", companies: ["LinkedIn"], difficulty: "advanced", concept: "percentile-cont" },
  { id: 108, title: "Departments with above-median average salary", companies: ["Microsoft"], difficulty: "advanced", concept: "median-subquery" },

  // ---------- Misc ----------
  { id: 109, title: "Find missing IDs in a sequence", companies: ["Bloomberg"], difficulty: "intermediate", concept: "gap-detection" },
  { id: 110, title: "Pivot rows of (key,value) into wide row", companies: ["Salesforce"], difficulty: "intermediate", concept: "pivot-with-case" },
  { id: 111, title: "Median of order amounts in single SELECT", companies: ["Bloomberg"], difficulty: "advanced", concept: "median-percentile" },
  { id: 112, title: "Latest status per ticket (deduplicate by max date)", companies: ["Atlassian"], difficulty: "intermediate", concept: "row-number-dedup" },
  { id: 113, title: "Find n-th most recent login per user", companies: ["LinkedIn"], difficulty: "intermediate", concept: "row-number" },
  { id: 114, title: "Top customer per region (handle ties)", companies: ["Walmart"], difficulty: "advanced", concept: "dense-rank" },
  { id: 115, title: "GROUP BY with ROLLUP for subtotals + grand total", companies: ["Microsoft"], difficulty: "intermediate", concept: "rollup" },
  { id: 116, title: "Build histogram of session durations into 10 buckets", companies: ["Meta"], difficulty: "advanced", concept: "ntile-bucket" },
  { id: 117, title: "Year-over-year revenue using self-join", companies: ["Walmart"], difficulty: "intermediate", concept: "self-join-date" },
  { id: 118, title: "Customers acquired through referral chain (recursive)", companies: ["Dropbox"], difficulty: "advanced", concept: "recursive-cte" },
  { id: 119, title: "Top product whose sales exceed category average by > 50%", companies: ["Amazon"], difficulty: "advanced", concept: "window-vs-aggregate" },
  { id: 120, title: "Detect orphan rows (FK pointing nowhere)", companies: ["Microsoft"], difficulty: "intermediate", concept: "left-join-null" },
];

export const COMPANIES = Array.from(
  new Set(INTERVIEW_BANK.flatMap((p) => p.companies)),
).sort();

/**
 * Pick the next interview problem, avoiding already-asked IDs and (when
 * requested) filtering by company / difficulty.
 */
export function pickNextInterviewProblem(opts: {
  askedIds: number[];
  difficulty?: string;
  company?: string | null;
}): InterviewProblem {
  const { askedIds, difficulty, company } = opts;
  let pool = INTERVIEW_BANK.filter((p) => !askedIds.includes(p.id));
  if (difficulty) pool = pool.filter((p) => p.difficulty === difficulty);
  if (company) pool = pool.filter((p) => p.companies.includes(company));
  if (pool.length === 0) {
    pool = INTERVIEW_BANK.filter(
      (p) =>
        (!difficulty || p.difficulty === difficulty) &&
        (!company || p.companies.includes(company)),
    );
  }
  if (pool.length === 0) pool = INTERVIEW_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}

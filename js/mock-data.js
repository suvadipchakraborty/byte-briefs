/**
 * ByteBriefs — fallback dataset.
 * Used only when the published Google Sheet CSV cannot be fetched, or while
 * the endpoint is being configured. Shape matches the live sheet exactly:
 * Date Fetched, Category, Headline, Image URL, Preview, Article Link.
 */
window.BYTEBRIEFS_MOCK_DATA = [
  {
    date: "2026-09-22",
    category: "Core Data Science & ML",
    headline: "Retrieval-augmented models close the gap on long-tail queries",
    image: "https://picsum.photos/seed/bb-ml1/900/700",
    preview: "New benchmarks show retrieval-augmented systems answering rare, specific questions almost as reliably as common ones, narrowing a gap that has persisted since the first generation of large language models reached production.",
    link: "https://example.com/rag-long-tail"
  },
  {
    date: "2026-09-22",
    category: "Core Data Science & ML",
    headline: "Feature stores quietly become the default for mid-size ML teams",
    image: "https://picsum.photos/seed/bb-ml2/900/700",
    preview: "Teams that once hand-rolled feature pipelines are standardizing on shared feature stores, citing fewer training-serving mismatches and faster onboarding for new model builds across the org.",
    link: "https://example.com/feature-stores-default"
  },
  {
    date: "2026-09-22",
    category: "Data Governance & Architecture",
    headline: "Data contracts move from proposal to production at scale",
    image: "https://picsum.photos/seed/bb-gov1/900/700",
    preview: "Engineering orgs are enforcing schema contracts between producers and consumers at the pipeline level, catching breaking changes before they reach dashboards rather than after an executive asks why a number moved.",
    link: "https://example.com/data-contracts-production"
  },
  {
    date: "2026-09-21",
    category: "Data Governance & Architecture",
    headline: "Lakehouse consolidation projects are running longer than budgeted",
    image: "No Image Available",
    preview: "Survey data from mid-market enterprises shows lakehouse migrations averaging nine months beyond initial timelines, with legacy access-control mapping cited as the single largest source of delay.",
    link: "https://example.com/lakehouse-timelines"
  },
  {
    date: "2026-09-21",
    category: "Enterprise & Agentic AI",
    headline: "Agentic workflows start replacing multi-step approval chains",
    image: "https://picsum.photos/seed/bb-agent1/900/700",
    preview: "Finance and procurement teams are piloting agent chains that route, validate, and escalate approvals, with humans reviewing only the exceptions the system flags rather than every step in the chain.",
    link: "https://example.com/agentic-approvals"
  },
  {
    date: "2026-09-21",
    category: "Enterprise & Agentic AI",
    headline: "Small language models find a home in on-device compliance checks",
    image: "https://picsum.photos/seed/bb-agent2/900/700",
    preview: "Regulated firms are deploying compact models directly on employee devices for first-pass compliance screening, avoiding the latency and data-residency concerns that come with routing every check to a central API.",
    link: "https://example.com/slm-compliance"
  },
  {
    date: "2026-09-20",
    category: "Data Leadership & Strategy",
    headline: "More CDOs now report directly to the CEO, survey finds",
    image: "https://picsum.photos/seed/bb-lead1/900/700",
    preview: "A widening share of chief data officers have moved off the CIO's org chart entirely, a shift researchers link to data strategy being treated as a growth lever rather than a cost center.",
    link: "https://example.com/cdo-reporting-lines"
  },
  {
    date: "2026-09-20",
    category: "Data Leadership & Strategy",
    headline: "Analytics roadmaps are shrinking from annual to quarterly",
    image: "https://picsum.photos/seed/bb-lead2/900/700",
    preview: "Data leaders describe abandoning twelve-month roadmaps in favor of rolling quarterly plans, arguing that fast-moving tooling makes a year-out commitment obsolete before it ships.",
    link: "https://example.com/quarterly-roadmaps"
  },
  {
    date: "2026-09-20",
    category: "Data Engineering & Pipelines",
    headline: "Streaming-first pipelines overtake nightly batch for core metrics",
    image: "https://picsum.photos/seed/bb-eng1/900/700",
    preview: "Companies reporting revenue and fraud metrics are shifting core pipelines to streaming architectures, trading some infrastructure complexity for the ability to catch anomalies within minutes instead of by morning.",
    link: "https://example.com/streaming-first-pipelines"
  },
  {
    date: "2026-09-19",
    category: "Data Engineering & Pipelines",
    headline: "Orchestration tools add native cost attribution per pipeline run",
    image: "No Image Available",
    preview: "New releases from major orchestration platforms let teams see compute cost broken down by individual pipeline run, a feature engineers say is overdue given how opaque cloud data-warehouse bills have become.",
    link: "https://example.com/pipeline-cost-attribution"
  },
  {
    date: "2026-09-19",
    category: "Banking & Financial Analytics",
    headline: "Trade finance desks lean on AI to flag undocumented risk",
    image: "https://picsum.photos/seed/bb-bank1/900/700",
    preview: "Banks processing high volumes of guarantee and letter-of-credit documents are using classification models to surface transactions missing required risk tags, work previously done through manual sampling.",
    link: "https://example.com/trade-finance-ai-risk"
  },
  {
    date: "2026-09-19",
    category: "Banking & Financial Analytics",
    headline: "Real-time shipping data starts feeding trade liquidity models",
    image: "https://picsum.photos/seed/bb-bank2/900/700",
    preview: "Analysts are blending vessel tracking feeds with trade finance volumes to build early indicators of liquidity stress at specific ports, ahead of the lag in official trade statistics.",
    link: "https://example.com/shipping-liquidity-models"
  },
  {
    date: "2026-09-18",
    category: "Data Visualization & Interactive Analytics",
    headline: "Single-file HTML dashboards gain ground inside large enterprises",
    image: "https://picsum.photos/seed/bb-viz1/900/700",
    preview: "Analysts without a front-end background are shipping self-contained HTML tools for internal use, favoring a file they can email over a BI platform license request that takes weeks to approve.",
    link: "https://example.com/single-file-dashboards"
  },
  {
    date: "2026-09-18",
    category: "Data Visualization & Interactive Analytics",
    headline: "D3.js sees a resurgence as teams outgrow chart libraries",
    image: "https://picsum.photos/seed/bb-viz2/900/700",
    preview: "Data teams that started with off-the-shelf charting components are returning to D3 once they need layouts the libraries were never built for, accepting more code for full control over the result.",
    link: "https://example.com/d3-resurgence"
  },
  {
    date: "2026-09-18",
    category: "AI Workflows & Prompt Engineering",
    headline: "Prompt libraries get version control and rollback",
    image: "https://picsum.photos/seed/bb-prompt1/900/700",
    preview: "Teams running AI workflows in production are treating prompts like code, adding pull requests and rollback so a single edited instruction can't silently break an entire pipeline overnight.",
    link: "https://example.com/prompt-version-control"
  },
  {
    date: "2026-09-17",
    category: "AI Workflows & Prompt Engineering",
    headline: "Structured-output requests cut post-processing code in half",
    image: "No Image Available",
    preview: "Engineers building AI-assisted workflows report that asking models for strict JSON output, rather than free text, has removed most of the brittle parsing logic that used to sit downstream.",
    link: "https://example.com/structured-output-workflows"
  },
  {
    date: "2026-09-17",
    category: "Tech Culture & Workplace Dynamics",
    headline: "Return-to-office mandates collide with data-team hiring pools",
    image: "https://picsum.photos/seed/bb-culture1/900/700",
    preview: "Companies enforcing in-office schedules for data roles say applicant volume has dropped noticeably, with specialized talent choosing fully remote offers even at similar pay.",
    link: "https://example.com/rto-data-hiring"
  },
  {
    date: "2026-09-17",
    category: "Tech Culture & Workplace Dynamics",
    headline: "\"Vibe coding\" becomes a genuine skill line on data resumes",
    image: "https://picsum.photos/seed/bb-culture2/900/700",
    preview: "Analysts fluent in directing AI coding assistants to prototype internal tools are getting hired into roles once reserved for trained engineers, reshaping what counts as a technical résumé line.",
    link: "https://example.com/vibe-coding-resumes"
  },
  {
    date: "2026-09-16",
    category: "Industry Events & Forums",
    headline: "Regional analytics summits outdraw flagship conferences this year",
    image: "https://picsum.photos/seed/bb-event1/900/700",
    preview: "Smaller, city-level analytics summits are reporting higher attendance growth than the long-running flagship conferences, as travel budgets tighten and practitioners favor events closer to home.",
    link: "https://example.com/regional-summits-growth"
  },
  {
    date: "2026-09-16",
    category: "Industry Events & Forums",
    headline: "CDO forum agendas shift from platform talk to workforce planning",
    image: "https://picsum.photos/seed/bb-event2/900/700",
    preview: "This season's chief data officer forums are dedicating more agenda time to team structure and skills planning than to platform selection, a swap organizers attribute to tooling maturing faster than talent.",
    link: "https://example.com/cdo-forum-workforce"
  }
];

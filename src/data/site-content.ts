export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#overview" },
  { label: "Contact Us", href: "#contact" },
];

export const partnerLogos = [
  { name: "Invarion", category: "Global Enterprise" },
  { name: "Lucident", category: "Scale-up SaaS" },
  { name: "Continuum AI", category: "AI Platform" },
  { name: "ProspectFlow", category: "Revenue Operations" },
  { name: "Inertia Labs", category: "B2B Tech" },
  { name: "Vertex Media", category: "Marketing Agency" },
  { name: "OmniFlow", category: "Fintech Services" },
  { name: "PulseSync", category: "Cloud Infrastructure" },
];

export const statisticsData = [
  {
    prefix: "",
    value: 99.4,
    suffix: "%",
    title: "Verification Accuracy",
    description: "Multi-layered syntax, MX, and SMTP deliverability checks",
  },
  {
    prefix: "",
    value: 12.8,
    suffix: "M+",
    title: "Verified Contacts",
    description: "Cleaned and protected against bounces and domain damage",
  },
  {
    prefix: "",
    value: 4.8,
    suffix: "x",
    title: "Workflow Acceleration",
    description: "End-to-end automation across Email, WhatsApp & Social",
  },
  {
    prefix: "",
    value: 35,
    suffix: "k+",
    title: "Active Growth Teams",
    description: "Driving measurable engagement from one workspace",
  },
];

// 9 Core Platform Capabilities from Section 3 of content.txt
export const coreFeatures9 = [
  {
    id: "email-verification",
    tag: "Data Quality",
    title: "Reach the Right Inbox",
    name: "Email Verification",
    description:
      "Clean and validate email lists with syntax checks, domain and MX record checks, disposable email detection, role-account identification, catch-all analysis, and risk scoring.",
    highlights: [
      "Individual and bulk verification",
      "Email risk classification",
      "Downloadable verification results",
    ],
    cta: "Explore Email Verification",
    badge: "99.4% Accuracy",
  },
  {
    id: "email-marketing",
    tag: "Outreach",
    title: "Make Every Email Count",
    name: "Email Marketing",
    description:
      "Create, personalize, schedule, and manage email campaigns from one workspace. Build audience journeys that deliver relevant messages at the right moments.",
    highlights: [
      "Campaigns and email sequences",
      "Visual email templates",
      "Personalization and follow-ups",
    ],
    cta: "Explore Email Marketing",
    badge: "Sequences & A/B",
  },
  {
    id: "whatsapp-marketing",
    tag: "Conversational",
    title: "Turn Conversations into Connections",
    name: "WhatsApp Marketing",
    description:
      "Engage opted-in customers through the official WhatsApp Business Platform. Create approved message templates, organize campaigns, and manage conversations at scale.",
    highlights: [
      "Official WhatsApp campaigns",
      "Template & audience management",
      "Interactive customer messaging",
    ],
    cta: "Explore WhatsApp Marketing",
    badge: "Meta Verified",
  },
  {
    id: "social-publishing",
    tag: "Multichannel",
    title: "One Workspace. Multiple Social Channels",
    name: "Social Media Publishing",
    description:
      "Plan, create, schedule, and manage social media content across Instagram, LinkedIn, Facebook, and X without losing track of your publishing calendar.",
    highlights: [
      "Visual content calendar",
      "AI-assisted content creation",
      "Cross-platform publishing",
    ],
    cta: "Explore Social Publishing",
    badge: "Unified Schedule",
  },
  {
    id: "lead-intelligence",
    tag: "Enrichment",
    title: "Better Leads. Smarter Decisions",
    name: "Lead Intelligence",
    description:
      "Organize contact information, enrich lead profiles through authorized data sources, and prioritize prospects using intelligent scoring.",
    highlights: [
      "Lead enrichment & context",
      "Dynamic audience segmentation",
      "Lead scoring and qualification",
    ],
    cta: "Explore Lead Intelligence",
    badge: "Enriched Context",
  },
  {
    id: "visual-automation",
    tag: "Operations",
    title: "Build Workflows, Not Busywork",
    name: "Visual Automation",
    description:
      "Connect triggers, conditions, actions, and AI assistance through a visual workflow builder designed for complex multichannel marketing journeys.",
    highlights: [
      "Drag-and-drop workflow building",
      "Conditional branching logic",
      "Multichannel coordinated actions",
    ],
    cta: "Explore Automation",
    badge: "Visual Canvas",
  },
  {
    id: "ai-agents",
    tag: "Intelligence",
    title: "Your AI-Powered Marketing Team",
    name: "AI Marketing Agents",
    description:
      "Create marketing content, assist with lead qualification, prepare follow-ups, and coordinate campaigns through specialized autonomous AI agents.",
    highlights: [
      "AI Email & WhatsApp Agents",
      "AI Lead Qualification Agent",
      "AI Campaign Strategy Agent",
    ],
    cta: "Meet the AI Agents",
    badge: "Autonomous AI",
  },
  {
    id: "unified-inbox",
    tag: "Engagement",
    title: "Every Conversation. One Place",
    name: "Unified Inbox",
    description:
      "Bring supported customer communication channels into a single organized workspace where your team can manage replies and follow-up activity.",
    highlights: [
      "Shared multichannel conversations",
      "Rich contact timeline context",
      "Internal team collaboration",
    ],
    cta: "Explore Unified Inbox",
    badge: "Real-time Sync",
  },
  {
    id: "marketing-analytics",
    tag: "Visibility",
    title: "Turn Performance into Progress",
    name: "Marketing Analytics",
    description:
      "Understand how your campaigns perform with centralized reporting across email, WhatsApp, social engagement, and lead journeys.",
    highlights: [
      "Campaign delivery & open insights",
      "Audience engagement tracking",
      "End-to-end conversion reporting",
    ],
    cta: "Explore Analytics",
    badge: "Centralized KPI",
  },
];

// 6 AI Agents from Section 6 of content.txt
export const aiMarketingAgents = [
  {
    id: "ai-email",
    title: "AI Email Agent",
    tag: "Drafts & Sequences",
    description:
      "Turn campaign ideas into personalized email drafts, high-converting subject lines, and suggested messaging improvements.",
    metrics: "94% Draft Accuracy",
    actions: ["Subject Line Generator", "Sequence Writer", "Spam-Risk Checker"],
  },
  {
    id: "ai-whatsapp",
    title: "AI WhatsApp Agent",
    tag: "Conversational Care",
    description:
      "Support customer conversations with contextual reply assistance, compliant template phrasing, and approved automated workflows.",
    metrics: "< 15s Contextual Reply",
    actions: ["Template Optimizer", "Smart FAQ Responder", "Opt-in Guardian"],
  },
  {
    id: "ai-qualification",
    title: "AI Lead Qualification Agent",
    tag: "Pipeline Priority",
    description:
      "Evaluate lead information, intent signals, and engagement behaviors to help teams immediately identify and prioritize promising opportunities.",
    metrics: "3.2x Faster Triage",
    actions: ["Profile Enrichment", "Buying Intent Scoring", "Routing Trigger"],
  },
  {
    id: "ai-followup",
    title: "AI Follow-up Agent",
    tag: "Nurturing Logic",
    description:
      "Recommend or trigger timely follow-up actions according to approved campaign rules, inactivity thresholds, and audience preferences.",
    metrics: "+38% Re-engagement",
    actions: ["Timing Optimizer", "Re-engagement Prompts", "Channel Selector"],
  },
  {
    id: "ai-social",
    title: "AI Social Agent",
    tag: "Content Strategy",
    description:
      "Generate creative post ideas, cross-platform captions, hashtag strategy, and structured content calendars for your social channels.",
    metrics: "Multi-Platform Ready",
    actions: ["Caption Variation Engine", "Hashtag Recommender", "Calendar Auto-Fill"],
  },
  {
    id: "ai-campaign",
    title: "AI Campaign Agent",
    tag: "End-to-End Orchestrator",
    description:
      "Transform a high-level marketing goal into a complete campaign outline with suggested target audiences, messaging, and multi-step workflows.",
    metrics: "Goal-to-Launch in Mins",
    actions: ["Audience Segmenter", "Omnichannel Timeline", "KPI Forecaster"],
  },
];

// 6 Steps How It Works from Section 4 of content.txt
export const howItWorksSteps = [
  {
    step: "01",
    name: "Discover",
    title: "Identify & organize promising leads",
    description:
      "Identify and organize promising opportunities through your lead database and authorized enrichment sources.",
    tag: "Audience Sourcing",
    previewType: "database",
  },
  {
    step: "02",
    name: "Verify",
    title: "Clean lists & detect mailbox risks",
    description:
      "Check email addresses, identify risky contacts, filter disposables, and prepare cleaner lists before outreach.",
    tag: "Risk Assessment",
    previewType: "verification",
  },
  {
    step: "03",
    name: "Enrich",
    title: "Add business context & segmentation",
    description:
      "Add useful business context to your contact records and organize audiences based on relevant attributes.",
    tag: "Profile Intelligence",
    previewType: "enrichment",
  },
  {
    step: "04",
    name: "Engage",
    title: "Launch Email, WhatsApp & Social campaigns",
    description:
      "Connect with your audience through permission-based email campaigns, WhatsApp messaging, and supported social channels.",
    tag: "Omnichannel Delivery",
    previewType: "engagement",
  },
  {
    step: "05",
    name: "Automate",
    title: "Coordinate workflows & timed follow-ups",
    description:
      "Create intelligent workflows that coordinate customer journeys, timed follow-ups, and lead-handling actions.",
    tag: "Visual Builder",
    previewType: "automation",
  },
  {
    step: "06",
    name: "Optimize",
    title: "Refine performance with unified insights",
    description:
      "Use centralized performance insights to improve future campaigns, messaging, and engagement strategies.",
    tag: "Analytics & ROI",
    previewType: "optimization",
  },
];

// Deliverability & Email Health Areas from Section 8 of content.txt
export const deliverabilityChecks = [
  { name: "Domain Health", status: "Healthy", score: 98, detail: "All DNS zones responding normally" },
  { name: "SPF Authentication", status: "Valid", score: 100, detail: "v=spf1 include:_spf.nexareach.io ~all" },
  { name: "DKIM Configuration", status: "Signed", score: 100, detail: "2048-bit cryptographic signature verified" },
  { name: "DMARC Policy", status: "Active (p=reject)", score: 95, detail: "Strict spoofing defense enforced" },
  { name: "Domain Blacklist Checks", status: "Clear (0/84)", score: 100, detail: "Monitored across 84 RBL servers" },
  { name: "Bounce Rate Target", status: "< 0.8%", score: 99, detail: "Well below industry warning threshold" },
  { name: "Spam Complaint Rate", status: "< 0.02%", score: 99, detail: "Clean recipient feedback loops" },
  { name: "Sending Reputation", status: "High (Score 96)", score: 96, detail: "Favored for primary inbox placement" },
];

// Target Industries from Section 9 of content.txt
export const industrySolutions = [
  {
    title: "Startup Teams",
    description: "Launch targeted campaigns, organize prospects, and build repeatable growth workflows without engineering overhead.",
    badge: "Velocity",
  },
  {
    title: "Marketing Agencies",
    description: "Manage client campaigns, channels, reporting, and content production from organized, isolated workspaces.",
    badge: "Scale",
  },
  {
    title: "SaaS Businesses",
    description: "Coordinate onboarding, product communication, lifecycle campaigns, and customer retention engagement.",
    badge: "Retention",
  },
  {
    title: "E-commerce Brands",
    description: "Create audience segments, send permission-based promotions, and manage customer journeys that boost repeat orders.",
    badge: "Conversions",
  },
  {
    title: "Sales Teams",
    description: "Qualify prospects, track engagement, and connect lead activity directly with automated follow-up workflows.",
    badge: "Close Rates",
  },
  {
    title: "Growing Enterprises",
    description: "Standardize cross-channel marketing operations with structured approval workflows and enterprise-grade team controls.",
    badge: "Governance",
  },
];

// Pricing Plans from Page 14 of content.txt
export const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "The Essentials for Getting Started.",
    monthlyPrice: 29,
    yearlyPrice: 24,
    description:
      "A focused workspace for individuals and small teams beginning their marketing journey.",
    badge: null,
    highlight: false,
    cta: "Choose Starter",
    features: [
      "5,000 Email verifications / month",
      "Up to 2,500 active contacts",
      "Basic email marketing campaigns",
      "Reusable visual email templates",
      "Standard campaign reporting",
      "Standard support & community",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "More Power for Growing Teams.",
    monthlyPrice: 79,
    yearlyPrice: 64,
    description:
      "Advanced marketing tools designed for businesses expanding customer engagement.",
    badge: "Most Popular",
    highlight: true,
    cta: "Choose Growth",
    features: [
      "25,000 Email verifications / month",
      "Up to 15,000 active contacts",
      "Automated email sequences & A/B testing",
      "Dynamic audience segmentation",
      "Visual workflow automation builder",
      "AI content assistance & drafts",
      "Supported channel integrations (Email + Social)",
      "Advanced deliverability & bounce monitoring",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Advanced Automation for Ambitious Teams.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    description:
      "A connected marketing workspace for teams coordinating sophisticated customer journeys.",
    badge: "Full Power",
    highlight: false,
    cta: "Choose Pro",
    features: [
      "75,000 Email verifications / month",
      "Up to 50,000 active contacts",
      "Multichannel coordination (Email + WhatsApp + Social)",
      "Advanced conditional workflow logic",
      "Full suite of 6 Autonomous AI Marketing Agents",
      "Unified team inbox & conversation routing",
      "Comprehensive analytics & attribution",
      "Priority SLA support & onboarding assist",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Built for Larger Marketing Operations.",
    monthlyPrice: 299,
    yearlyPrice: 239,
    description:
      "Explore tailored usage capacity, administrative controls, support arrangements, and custom integrations.",
    badge: "Custom Scale",
    highlight: false,
    cta: "Contact Sales",
    features: [
      "Custom verification & contact allowances",
      "Advanced role-based access & audit controls",
      "Enterprise security & dedicated IP options",
      "Custom webhook & API integrations",
      "Dedicated account manager & technical onboarding",
      "Tailored commercial arrangements",
    ],
  },
];

// Official FAQs from Page 16 of content.txt
export const faqItems = [
  {
    question: "What is NexaReach?",
    answer:
      "NexaReach is an AI-powered omnichannel marketing platform designed to bring lead intelligence, email marketing, WhatsApp communication, social publishing, workflow automation, and analytics into one connected workspace.",
  },
  {
    question: "Who is NexaReach for?",
    answer:
      "NexaReach is designed for startups, marketing teams, agencies, SaaS businesses, sales teams, and organizations looking to simplify their marketing operations without switching between dozens of separate tools.",
  },
  {
    question: "Can I verify emails in bulk?",
    answer:
      "Yes. The email verification module supports uploading CSV lists, processing batches through multi-level checks (syntax, domain, MX, disposable, role-based, catch-all), reviewing risk classifications, and exporting clean lists.",
  },
  {
    question: "Does email verification guarantee successful delivery?",
    answer:
      "Email verification identifies known address and domain risks, filter disposables, and protects sending reputation. However, no verification system can guarantee external mailbox availability or recipient server acceptance.",
  },
  {
    question: "Can I automate email follow-ups?",
    answer:
      "Yes. NexaReach's visual automation capabilities support multi-step sequences, scheduled follow-ups, and condition-based triggers based on recipient engagement events.",
  },
  {
    question: "Does NexaReach support WhatsApp Business?",
    answer:
      "The WhatsApp module is built around Meta's official WhatsApp Business Platform. Availability depends on supported integration access, account eligibility, approved Meta templates, and applicable messaging rules.",
  },
  {
    question: "Can I manage multiple social media platforms?",
    answer:
      "Yes. NexaReach's social publishing engine includes supported integrations for Instagram, Facebook, LinkedIn, and X, allowing you to schedule, preview, and coordinate publishing from a single visual calendar.",
  },
  {
    question: "How do the AI Marketing Agents work?",
    answer:
      "NexaReach includes specialized AI agents for Email, WhatsApp, Lead Qualification, Follow-ups, Social Content, and Campaign Strategy. They turn marketing goals into draft plans, generate tailored content, and recommend actions while keeping your team in control.",
  },
  {
    question: "Is NexaReach suitable for agencies?",
    answer:
      "Yes. Agencies can centralize client campaign operations, manage multi-channel content scheduling, run bulk verification, and view consolidated reporting from organized workspaces.",
  },
  {
    question: "How does NexaReach handle unsubscribes and privacy?",
    answer:
      "The platform maintains automated unsubscribe and suppression lists to ensure future sends respect recipient consent. NexaReach is designed around privacy-conscious data handling, secure permissions, and compliant sending standards.",
  },
];

// Editorial Articles
export const blogArticles = [
  {
    id: 1,
    title: "The 2026 Guide to Cold Email Deliverability & DMARC Defense",
    excerpt:
      "How forward-thinking marketing teams preserve sender reputation, configure strict authentication, and keep complaint rates below 0.02%.",
    category: "Deliverability",
    date: "Oct 8, 2026",
    author: "Elena Rostova",
    image: "/images/blog-analytics.jpg",
  },
  {
    id: 2,
    title: "Orchestrating Omnichannel Workflows: WhatsApp + Email in Sync",
    excerpt:
      "Why combining high-touch WhatsApp messaging with structured email nurturing drives 3.4x higher conversion across qualified accounts.",
    category: "Automation",
    date: "Sep 28, 2026",
    author: "David Chen",
    image: "/images/blog-strategy.jpg",
  },
  {
    id: 3,
    title: "Building Autonomous Lead Qualification with AI Agents",
    excerpt:
      "A blueprint for triaging incoming contacts, enriching business signals, and triggering instant sales follow-ups without manual lag.",
    category: "AI Marketing",
    date: "Sep 15, 2026",
    author: "Sophia Vance",
    image: "/images/blog-pipeline.jpg",
  },
];

// Ecosystem Channels & Supported Integrations
export const integrationCategories = [
  { name: "WhatsApp Business", category: "Official Meta Cloud API", color: "#25D366" },
  { name: "Google Workspace", category: "Email & Contact Sync", color: "#EA4335" },
  { name: "Microsoft 365", category: "Outlook & Exchange", color: "#0078D4" },
  { name: "Instagram Direct", category: "Meta Messaging API", color: "#E4405F" },
  { name: "LinkedIn Pages", category: "B2B Social Publishing", color: "#0A66C2" },
  { name: "X / Twitter", category: "Social Broadcast API", color: "#111827" },
  { name: "Facebook Pages", category: "Social Engagement", color: "#1877F2" },
  { name: "Webhooks & REST", category: "Custom CRM & Automations", color: "#7545FF" },
];

// Customer Testimonials
export const testimonialsData = [
  {
    author: "Sarah Jenkins",
    role: "VP of Growth",
    company: "Horizon Digital Media",
    avatar: "/images/avatar-1.jpg",
    metric: "99.4% Deliverability",
    quote:
      "NexaReach replaced four disparate tools for our agency. List verification cut our bounce rate from 6.8% down to 0.4%, while the AI Email Agent drafts high-converting sequences in seconds.",
  },
  {
    author: "Marcus Alvarez",
    role: "Head of Revenue Operations",
    company: "CloudVantage Systems",
    avatar: "/images/avatar-2.jpg",
    metric: "+340% Conversions",
    quote:
      "The official WhatsApp integration alone transformed our re-engagement rate. We triggered timed sequences that generated 3.4x higher pipeline compared to standard email blasts.",
  },
  {
    author: "Priya Nair",
    role: "Founder & CEO",
    company: "ScaleForge Ventures",
    avatar: "/images/avatar-3.jpg",
    metric: "15 hrs Saved / Week",
    quote:
      "Having lead enrichment, verification, and visual workflows in one connected workspace removed 15+ hours of manual spreadsheet juggling every single week.",
  },
];

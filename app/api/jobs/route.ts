import { NextResponse } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import Parser from "rss-parser";

// export const runtime = "nodejs";
// export const revalidate = 3600;


const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "software-dev": [
    "software engineer",
    "software developer",
    "software development",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "full stack",
    "fullstack",
    "web developer",
    "mobile developer",
    "programmer",
    "javascript",
    "typescript",
    "react developer",
  ],
  data: [
    "data analyst",
    "data scientist",
    "data engineer",
    "data analytics",
    "business intelligence",
    "machine learning",
    "data science",
    "analytics engineer",
    "bi developer",
    "statistician",
  ],
  "devops-sysadmin": [
    "devops",
    "site reliability",
    "sre engineer",
    "cloud engineer",
    "platform engineer",
    "infrastructure engineer",
    "system administrator",
    "systems administrator",
    "sysadmin",
    "kubernetes",
    "network administrator",
  ],
  design: [
    "designer",
    "design lead",
    "design director",
    "ux designer",
    "ui designer",
    "product design",
    "graphic design",
    "visual design",
    "user experience",
    "user interface",
    "motion design",
  ],
  marketing: [
    "marketing",
    "seo",
    "content strategist",
    "social media",
    "growth marketing",
    "brand manager",
    "copywriter",
    "demand generation",
    "digital marketing",
    "marketing manager",
  ],
  "customer-support": [
    "customer support",
    "customer service",
    "customer success",
    "technical support",
    "support specialist",
    "help desk",
    "customer experience",
    "client services",
  ],
  sales: [
    "sales",
    "account executive",
    "account manager",
    "business development",
    "sales development",
    "sales representative",
    "sales manager",
    "sdr",
    "bdr",
  ],
  product: [
    "product manager",
    "product management",
    "product owner",
    "product operations",
    "product lead",
    "head of product",
    "director of product",
  ],
};

function matchesCategory(job: Job, selectedCategory: string): boolean {
  if (!selectedCategory || selectedCategory === "all") {
    return true;
  }

  const keywords = CATEGORY_KEYWORDS[selectedCategory];

  // An unknown category should not accidentally hide every job.
  if (!keywords) {
    return true;
  }

  const titleAndCategory = `${job.title} ${job.category ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ");

  // Prefer matches in the job title or its actual category.
  if (keywords.some((keyword) => titleAndCategory.includes(keyword))) {
    return true;
  }

  // Use the description as a fallback when the title/category is vague.
  const description = (job.description ?? "")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ");

  return keywords.some((keyword) => description.includes(keyword));
}


const parser = new Parser({
  customFields: {
    item: [
      ["company", "company"],
      ["location", "location"],
      ["region", "region"],
      ["himalayasJobs:companyName", "himalayasCompany"],
      ["himalayasJobs:locationRestriction", "himalayasLocation"],
    ],
  },
});

const EUROPE_COUNTRIES = [
  "europe",
  "european union",
  "emea",
  "worldwide",
  "united kingdom",
  "uk",
  "germany",
  "france",
  "spain",
  "italy",
  "netherlands",
  "portugal",
  "poland",
  "ireland",
  "sweden",
  "denmark",
  "finland",
  "austria",
  "belgium",
  "czechia",
  "czech republic",
  "romania",
  "greece",
  "estonia",
  "lithuania",
  "latvia",
  "croatia",
  "bulgaria",
  "hungary",
  "luxembourg",
  "slovakia",
  "slovenia",
  "cyprus",
  "malta",
  "norway",
  "switzerland",
  "iceland",
  "serbia",
  "ukraine",
  "albania",
  "montenegro",
  "north macedonia",
  "bosnia",
  "moldova",
  "kosovo",
  "türkiye",
  "turkey",
];

type Job = {
  title: string;
  company: string;
  location: string;
  url: string;
  date: string | null;
  source: string;
  description?: string;
  category?: string;
};

type SourceResult = {
  source: string;
  status: "success" | "error";
  count: number;
  error?: string;
};

function isEurope(location: string, allowWorldwide: boolean) {
  const normalized = location.toLowerCase();

  if (
    allowWorldwide &&
    /\b(worldwide|anywhere|global|everywhere)\b/.test(normalized)
  ) {
    return true;
  }

  return (
    /\beu\b/.test(normalized) ||
    EUROPE_COUNTRIES.some((country) => {
      const escaped = country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escaped}\\b`, "i").test(normalized);
    })
  );
}

function normalizeJob(
  raw: any,
  source: string,
  defaults: Partial<Job> = {}
): Job | null {
  const title = String(raw.title ?? raw.position ?? "").trim();
  const url = String(
    raw.url ?? raw.link ?? raw.job_url ?? raw.application_url ?? ""
  ).trim();

  if (!title || !url) return null;

  const dateValue =
    raw.publication_date ??
    raw.pubDate ??
    raw.published ??
    raw.created_at ??
    raw.date ??
    null;

  const parsedDate = dateValue ? new Date(dateValue) : null;

  return {
    title,
    company: String(
      raw.company_name ??
        raw.companyName ??
        raw.himalayasCompany ??
        raw.company ??
        raw.employer ??
        "Unknown company"
    ).trim(),
    location: String(
      raw.candidate_required_location ??
        raw.locationRestriction ??
        raw.himalayasLocation ??
        raw.location ??
        raw.region ??
        raw.geo ??
        defaults.location ??
        ""
    ).trim(),
    url,
    date:
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : null,
    source,
    description: String(
      raw.description ?? raw.summary ?? raw.contentSnippet ?? ""
    ).trim(),
    category: String(
      raw.category ?? raw.category_name ?? defaults.category ?? ""
    ).trim(),
  };
}

async function fetchJson(url: string) {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 172800 });
  cacheTag("job-feeds");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchRss(url: string) {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 172800 });
  cacheTag("job-feeds");

  const response = await fetch(url, {
    headers: { "User-Agent": "RemoteJobsAggregator/1.0" },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return parser.parseString(await response.text());
}

async function getSource(
  source: string,
  fetcher: () => Promise<any>,
  worldwide: boolean
): Promise<{ jobs: Job[]; status: SourceResult }> {
  try {
    const rawJobs: any[] = await fetcher();
    const jobs = rawJobs
      .map((raw) => normalizeJob(raw, source))
      .filter((job): job is Job => job !== null)
      .filter((job) => isEurope(job.location, worldwide));

    return {
      jobs,
      status: { source, status: "success", count: jobs.length },
    };
  } catch (error) {
    return {
      jobs: [],
      status: {
        source,
        status: "error",
        count: 0,
        error: error instanceof Error ? error.message : "Request failed",
      },
    };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const worldwide = searchParams.get("worldwide") === "true";
  const category = searchParams.get("category") ?? "software-dev";

  const sources = [
    getSource(
      "Remotive",
      async () => {
        const data = await fetchJson(
          `https://remotive.com/api/remote-jobs?category=${encodeURIComponent(category)}&limit=200`
        );
        return data.jobs ?? [];
      },
      worldwide
    ),

    getSource(
      "Himalayas",
      async () => {
        const data = await fetchJson(
          "https://himalayas.app/jobs/api?limit=20"
        );
        return data.jobs ?? [];
      },
      worldwide
    ),

    getSource(
      "Jobicy",
      async () => {
        const data = await fetchJson(
          `https://jobicy.com/api/v2/remote-jobs?count=200&geo=europe`
        );
        return data.jobs ?? [];
      },
      worldwide
    ),

    getSource(
      "We Work Remotely",
      async () => {
        const feed = await fetchRss(
          "https://weworkremotely.com/remote-jobs.rss"
        );
        return feed.items ?? [];
      },
      worldwide
    ),

    getSource(
      "Berlin Startup Jobs",
      async () => {
        const feed = await fetchRss(
          "https://berlinstartupjobs.com/feed/"
        );
        return feed.items ?? [];
      },
      worldwide
    ),

    getSource(
      "JobsCollider",
      async () => {
        const feed = await fetchRss(
          "https://jobscollider.com/remote-jobs.rss"
        );
        return feed.items ?? [];
      },
      worldwide
    ),

    getSource(
      "Arbeitnow",
      async () => {
        const data = await fetchJson(
          "https://www.arbeitnow.com/api/job-board-api"
        );
        return data.data ?? [];
      },
      worldwide
    ),

    getSource(
      "GermanTechJobs",
      async () => {
        const feed = await fetchRss(
          "https://germantechjobs.de/job_feed.xml"
        );
        return feed.items ?? [];
      },
      worldwide
    ),
  ];

  // const results = await Promise.all(sources);
  // const allJobs = results.flatMap((result) => result.jobs);
  const results = await Promise.all(sources);
const allJobs = results.flatMap((result) => result.jobs);

  // Remove duplicate listings, preferring the first source encountered.
  const uniqueJobs = Array.from(
    new Map(
      allJobs.map((job) => [
        job.url.replace(/\/$/, "").toLowerCase(),
        job,
      ])
    ).values()
  ).sort(
    (a, b) =>
      new Date(b.date ?? 0).getTime() -
      new Date(a.date ?? 0).getTime()
  );


  // Filter jobs across every source using the selected category.
  const categoryJobs = uniqueJobs.filter((job) =>
    matchesCategory(job, category)
  );

  // Keep source health counts consistent with the displayed results.
  const sourceStatuses = results.map((result) => {
    const status = result.status;

    if (status.status === "error") {
      return status;
    }

    return {
      ...status,
      count: categoryJobs.filter(
        (job) => job.source === status.source
      ).length,
    };
  });

  return NextResponse.json({
    total: categoryJobs.length,
    filters: { worldwide, category },
    sources: sourceStatuses,
    jobs: categoryJobs,
  });


  // return NextResponse.json({
  //   total: uniqueJobs.length,
  //   filters: { worldwide, category },
  //   sources: results.map((result) => result.status),
  //   jobs: uniqueJobs,
  // });
}

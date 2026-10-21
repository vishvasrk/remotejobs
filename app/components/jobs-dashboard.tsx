
"use client";

import { useMemo, useState } from "react";

type Job = {
  title: string;
  company: string;
  location: string;
  url: string;
  date: string | undefined;
  source: string;
  description?: string;
  category?: string;
};

type SourceStatus = {
  source: string;
  status: "success" | "error";
  count: number;
  error?: string;
};

type JobsResponse = {
  total: number;
  filters: { worldwide: boolean; category: string };
  sources: SourceStatus[];
  jobs: Job[];
};

const categories = [
  ["software-dev", "Software engineering"],
  ["data", "Data & analytics"],
  ["devops-sysadmin", "DevOps & infrastructure"],
  ["design", "Design"],
  ["marketing", "Marketing"],
  ["customer-support", "Customer support"],
  ["sales", "Sales"],
  ["product", "Product"],
];

// function postedLabel(date: string | null) {
//   if (!date) return "Date unavailable";

//   const parsed = new Date(date);
//   if (Number.isNaN(parsed.getTime())) return "Date unavailable";

//   const days = Math.floor(
//     (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)
//   );

//   if (days < 0) return "Recently posted";
//   if (days === 0) return "Today";
//   if (days === 1) return "Yesterday";
//   if (days < 30) return `${days} days ago`;

//   return parsed.toLocaleDateString("en-GB", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// }


function postedLabel(date: string | undefined) {
  if (!date) return "Date unknown";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unknown";
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const day = String(parsedDate.getUTCDate()).padStart(2, "0");
  const month = months[parsedDate.getUTCMonth()];
  const year = parsedDate.getUTCFullYear();

  return `${day} ${month} ${year}`;
}


function companyInitials(company: string) {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function JobsDashboard({
  data,
  category,
  worldwide,
}: {
  data: JobsResponse;
  category: string;
  worldwide: boolean;
}) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("newest");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const availableSources = data.sources.filter(
    (item) => item.status === "success"
  ).length;

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.jobs
      .filter((job) => {
        const matchesSearch =
          !query ||
          [job.title, job.company, job.location, job.source, job.category]
            .some((value) => value?.toLowerCase().includes(query));

        const matchesSource = source === "all" || job.source === source;

        const matchesRemote =
          !remoteOnly ||
          /\b(remote|worldwide|anywhere|distributed)\b/i.test(
            `${job.title} ${job.location} ${job.description ?? ""}`
          );

        return matchesSearch && matchesSource && matchesRemote;
      })
      .sort((a, b) => {
        if (sort === "company") return a.company.localeCompare(b.company);

        return (
          new Date(b.date ?? 0).getTime() -
          new Date(a.date ?? 0).getTime()
        );
      });
  }, [data.jobs, search, source, sort, remoteOnly]);

  const selectClass =
    "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0b1120] dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
              R
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">
                RemoteScout
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Your next opportunity
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {availableSources} sources connected
            <span className="ml-1 rounded-full border border-slate-200 px-2 py-1 dark:border-slate-700">
              ◐ Auto theme
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-9 text-white shadow-xl shadow-blue-900/10 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 top-8 h-44 w-44 rounded-full border border-white/10" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
              <span>✦</span> Remote opportunities, all in one place
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
              Work from anywhere.
              <br />
              <span className="text-blue-200">Find your next role.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Discover remote opportunities across Europe from multiple job
              boards. Search smarter and spend more time applying.
            </p>
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">{data.total}</p>
              <p className="mt-1 text-xs text-blue-100">Matching jobs</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">{availableSources}</p>
              <p className="mt-1 text-xs text-blue-100">Sources available</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:col-span-1">
              <p className="text-2xl font-bold">{filteredJobs.length}</p>
              <p className="mt-1 text-xs text-blue-100">After your filters</p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Find your opportunity
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search by role, company, location or source.
              </p>
            </div>
            <a
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Reset URL filters ↗
            </a>
          </div>

          <form action="/" method="GET" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Job title, company or location</span>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                ⌕
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Job title, company or location..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>

            <label>
              <span className="sr-only">Job category</span>
              <select
                name="category"
                defaultValue={category}
                className={`${selectClass} w-full`}
              >
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              <input
                type="checkbox"
                name="worldwide"
                value="true"
                defaultChecked={worldwide}
                className="h-4 w-4 accent-blue-600"
              />
              Worldwide
            </label>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
            >
              Search jobs
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <label className="flex items-center gap-2 px-1 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(event) => setRemoteOnly(event.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              Remote-labelled only
            </label>

            <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

            <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              Source
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className={selectClass}
              >
                <option value="all">All sources</option>
                {data.sources
                  .filter((item) => item.status === "success")
                  .map((item) => (
                    <option key={item.source} value={item.source}>
                      {item.source}
                    </option>
                  ))}
              </select>
            </label>

            <label className="ml-auto flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              Sort by
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className={selectClass}
              >
                <option value="newest">Newest first</option>
                <option value="company">Company name</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Latest opportunities
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Showing {filteredJobs.length} of {data.jobs.length} loaded
                  listings
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                {worldwide ? "Worldwide" : "Europe-focused"}
              </span>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
                <div className="text-4xl">⌕</div>
                <h3 className="mt-4 text-lg font-semibold">
                  No matching jobs found
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Try another search term, select all sources, or clear the
                  remote-only filter.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSource("all");
                    setRemoteOnly(false);
                    setSort("newest");
                  }}
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <article
                    key={`${job.source}-${job.url}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:shadow-black/20 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {companyInitials(job.company || "Company")}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-base font-bold leading-snug tracking-tight text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 sm:text-lg">
                              {job.title}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                              {job.company || "Company not specified"}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {postedLabel(job.date)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            ♧ {job.location || "Location unspecified"}
                          </span>
                          <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            {job.source}
                          </span>
                          {job.category && (
                            <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                              {job.category}
                            </span>
                          )}
                        </div>

                        {job.description && (
                          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {job.description
                              .replace(/<[^>]*>/g, " ")
                              .replace(/\s+/g, " ")
                              .slice(0, 220)}
                            {job.description.length > 220 ? "…" : ""}
                          </p>
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                          <span className="text-xs text-slate-400">
                            Via {job.source}
                          </span>
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            View job <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold">Source health</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Status of each job board
              </p>

              <div className="mt-5 space-y-4">
                {data.sources.map((item) => (
                  <div key={item.source} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.status === "success"
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.source}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.status === "success"
                          ? `${item.count} matching jobs`
                          : item.error || "Source unavailable"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl dark:bg-blue-900/70">
                ✦
              </div>
              <h3 className="mt-4 font-bold">A better job search</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Check each listing's location requirements and work
                authorization before applying. Remote doesn't always mean
                worldwide.
              </p>
            </section>
          </aside>
        </section>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          RemoteScout · Aggregated job listings from external sources.
          Application requirements and availability may change.
        </footer>
      </div>
    </main>
  );
}

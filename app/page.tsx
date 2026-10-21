
import JobsDashboard from "@/app/components/jobs-dashboard";

export const instant = false;

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
  filters: {
    worldwide: boolean;
    category: string;
  };
  sources: SourceStatus[];
  jobs: Job[];
};

async function getJobs(
  category: string,
  worldwide: boolean
): Promise<JobsResponse> {
  const params = new URLSearchParams({
    category,
    worldwide: String(worldwide),
  });

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const res = await fetch(
      `${baseUrl}/api/jobs?${params.toString()}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Jobs API returned ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Unable to load jobs:", error);

    return {
      total: 0,
      filters: { worldwide, category },
      sources: [],
      jobs: [],
    };
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    worldwide?: string;
  }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "software-dev";
  const worldwide = params.worldwide === "true";

  const data = await getJobs(category, worldwide);

  return (
    <JobsDashboard
      data={data}
      category={category}
      worldwide={worldwide}
    />
  );
}

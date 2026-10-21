import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { GET as getJobsRoute } from "@/app/api/jobs/route";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("job-feeds", { expire: 0 });

  const response = await getJobsRoute(
    new Request(
      "http://localhost/api/jobs?category=software-dev&worldwide=false"
    )
  );
  const data = await response.json();

  return NextResponse.json({
    refreshed: response.ok,
    total: data.total,
    sources: data.sources,
  }, { status: response.status });
}

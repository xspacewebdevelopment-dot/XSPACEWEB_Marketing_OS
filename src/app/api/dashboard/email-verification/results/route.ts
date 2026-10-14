import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resultsCleaningService, ResultsQueryOptions } from "@/lib/services/results-cleaning";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "25", 10) || 25;
    const sortBy = (searchParams.get("sortBy") as any) || "verifiedAt";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const source = searchParams.get("source") || undefined;
    const jobId = searchParams.get("jobId") || undefined;
    const domain = searchParams.get("domain") || undefined;
    const providerStatus = searchParams.get("providerStatus") || undefined;

    const isCatchAllParam = searchParams.get("isCatchAll");
    const isCatchAll =
      isCatchAllParam === "true" ? true : isCatchAllParam === "false" ? false : undefined;

    const isDisposableParam = searchParams.get("isDisposable");
    const isDisposable =
      isDisposableParam === "true" ? true : isDisposableParam === "false" ? false : undefined;

    const isRoleBasedParam = searchParams.get("isRoleBased");
    const isRoleBased =
      isRoleBasedParam === "true" ? true : isRoleBasedParam === "false" ? false : undefined;

    const isDeliverableParam = searchParams.get("isDeliverable");
    const isDeliverable =
      isDeliverableParam === "true" ? true : isDeliverableParam === "false" ? false : undefined;

    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const options: ResultsQueryOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      status,
      source,
      jobId,
      domain,
      providerStatus,
      isCatchAll,
      isDisposable,
      isRoleBased,
      isDeliverable,
      dateFrom,
      dateTo,
    };

    const data = await resultsCleaningService.getResults(auth.workspace.id, options);

    const response = NextResponse.json({
      success: true,
      data,
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to load verification results";
    return NextResponse.json({ success: false, error: msg, code: "QUERY_ERROR" }, { status: 500 });
  }
}

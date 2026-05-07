import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/seavantage/watch/[id]/history
 *   해당 watch의 스냅샷을 시간 역순으로 반환 (타임라인용).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sb = createAdminClient();

    const { data, error } = await sb
      .from("seavantage_watch_snapshot")
      .select("*")
      .eq("watch_id", id)
      .order("checked_at", { ascending: false });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

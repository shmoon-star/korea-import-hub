import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchCargo, diffCargo } from "@/lib/seavantage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/seavantage/watch/[id]/refresh
 *   - SeaVantage 재호출 → 변화 시 스냅샷 적재 + 캐시 업데이트
 *   - 변화 없으면 last_checked_at만 업데이트
 *   - 에러 시 last_error 기록
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sb = createAdminClient();

    const { data: watch, error: wErr } = await sb
      .from("seavantage_watch")
      .select("*")
      .eq("id", id)
      .single();
    if (wErr || !watch) {
      return NextResponse.json(
        { ok: false, error: "watch not found" },
        { status: 404 },
      );
    }

    const result = await searchCargo({
      mblNo: watch.mbl_no ?? undefined,
      bookingNo: watch.booking_no ?? undefined,
      containerNo: watch.container_no ?? undefined,
    });

    const now = new Date().toISOString();

    if (!result.ok) {
      await sb
        .from("seavantage_watch")
        .update({ last_checked_at: now, last_error: result.error })
        .eq("id", id);
      return NextResponse.json(
        { ok: false, error: result.error, data: { changed: false } },
        { status: 200 },
      );
    }

    const data = result.data;
    const diff = diffCargo(
      {
        last_bl_status: watch.last_bl_status,
        last_initial_eta: watch.last_initial_eta,
        last_initial_etd: watch.last_initial_etd,
        last_location_count: watch.last_location_count,
      },
      data,
    );

    const firstCall = !watch.last_checked_at;
    const shouldSnapshot = firstCall || diff.changed;

    if (shouldSnapshot) {
      const { error: sErr } = await sb.from("seavantage_watch_snapshot").insert({
        watch_id: id,
        bl_status: diff.snapshot.bl_status,
        initial_eta: diff.snapshot.initial_eta,
        initial_etd: diff.snapshot.initial_etd,
        location_count: diff.snapshot.location_count,
        raw_response: data as any,
        change_summary: firstCall ? "최초 조회" : diff.summary,
      });
      if (sErr) throw new Error(`snapshot insert 실패: ${sErr.message}`);
    }

    const patch: Record<string, any> = {
      last_checked_at: now,
      last_bl_status: diff.snapshot.bl_status,
      last_initial_eta: diff.snapshot.initial_eta,
      last_initial_etd: diff.snapshot.initial_etd,
      last_location_count: diff.snapshot.location_count,
      cargo_info: data,
      last_error: null,
    };
    // SeaVantage 응답에 documentId가 새로 보이면 보강
    if (!watch.document_id && data.documentId) {
      patch.document_id = data.documentId;
    }
    const { error: uErr } = await sb
      .from("seavantage_watch")
      .update(patch)
      .eq("id", id);
    if (uErr) throw new Error(`watch update 실패: ${uErr.message}`);

    return NextResponse.json({
      ok: true,
      data: {
        changed: diff.changed,
        firstCall,
        summary: diff.summary,
        snapshot: diff.snapshot,
        response: data,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCargProgress, diffProgress } from "@/lib/unipass";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/customs/watch/[id]/refresh
 *   1) 상태가 변했으면 customs_watch_snapshot insert + customs_watch 캐시 업데이트
 *   2) 변화 없으면 last_checked_at만 업데이트
 *   3) API 에러면 last_error 기록
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sb = createAdminClient();

    const { data: watch, error: wErr } = await sb
      .from("customs_watch")
      .select("*")
      .eq("id", id)
      .single();
    if (wErr || !watch) {
      return NextResponse.json({ ok: false, error: "watch not found" }, { status: 404 });
    }

    const result = await fetchCargProgress({
      mblNo: watch.mbl_no ?? undefined,
      hblNo: watch.hbl_no ?? undefined,
      blYy: watch.bl_yy ?? undefined,
      cargMtNo: watch.carg_mt_no ?? undefined,
    });

    const now = new Date().toISOString();

    if (!result.ok) {
      await sb
        .from("customs_watch")
        .update({ last_checked_at: now, last_error: result.error })
        .eq("id", id);
      return NextResponse.json(
        { ok: false, error: result.error, data: { changed: false } },
        { status: 200 },
      );
    }

    const data = result.data;
    const diff = diffProgress(
      {
        last_prgs_stts: watch.last_prgs_stts,
        last_cscl_prgs_stts: watch.last_cscl_prgs_stts,
        last_etpr_dt: watch.last_etpr_dt,
        last_detail_count: watch.last_detail_count,
      },
      data,
    );

    const firstCall = !watch.last_checked_at;
    const shouldSnapshot = firstCall || diff.changed;

    if (shouldSnapshot) {
      const { error: sErr } = await sb.from("customs_watch_snapshot").insert({
        watch_id: id,
        prgs_stts: diff.snapshot.prgs_stts,
        cscl_prgs_stts: diff.snapshot.cscl_prgs_stts,
        etpr_dt: diff.snapshot.etpr_dt,
        detail_count: diff.snapshot.detail_count,
        raw_response: data as any,
        change_summary: firstCall ? "최초 조회" : diff.summary,
      });
      if (sErr) throw new Error(`snapshot insert 실패: ${sErr.message}`);
    }

    const cargoInfoPatch: Record<string, any> = {
      last_checked_at: now,
      last_prgs_stts: diff.snapshot.prgs_stts,
      last_cscl_prgs_stts: diff.snapshot.cscl_prgs_stts,
      last_etpr_dt: diff.snapshot.etpr_dt,
      last_detail_count: diff.snapshot.detail_count,
      last_error: null,
    };
    if (data.header) {
      cargoInfoPatch.cargo_info = data.header;
      if (!watch.carg_mt_no && data.header.cargMtNo) {
        cargoInfoPatch.carg_mt_no = data.header.cargMtNo;
      }
    }
    const { error: uErr } = await sb
      .from("customs_watch")
      .update(cargoInfoPatch)
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

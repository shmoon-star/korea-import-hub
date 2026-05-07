import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchCargo, diffCargo } from "@/lib/seavantage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/seavantage/watch/refresh-all
 *   is_closed=false인 모든 watch를 순차 재호출.
 *   429 응답 시 Retry-After만큼 대기 (간단 버전 — 향후 개선).
 */
export async function POST(_req: NextRequest) {
  try {
    const sb = createAdminClient();

    const { data: watches, error } = await sb
      .from("seavantage_watch")
      .select("*")
      .eq("is_closed", false);
    if (error) throw new Error(error.message);

    const now = () => new Date().toISOString();
    let updated = 0;
    let unchanged = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const w of watches ?? []) {
      const result = await searchCargo({
        mblNo: w.mbl_no ?? undefined,
        bookingNo: w.booking_no ?? undefined,
        containerNo: w.container_no ?? undefined,
      });

      if (!result.ok) {
        errors.push({ id: w.id, error: result.error });
        await sb
          .from("seavantage_watch")
          .update({ last_checked_at: now(), last_error: result.error })
          .eq("id", w.id);
        // 429면 잠깐 쉬기
        if (result.status === 429) {
          await new Promise((r) => setTimeout(r, 60_000));
        }
        continue;
      }

      const diff = diffCargo(
        {
          last_bl_status: w.last_bl_status,
          last_initial_eta: w.last_initial_eta,
          last_initial_etd: w.last_initial_etd,
          last_location_count: w.last_location_count,
        },
        result.data,
      );
      const firstCall = !w.last_checked_at;
      const shouldSnapshot = firstCall || diff.changed;

      if (shouldSnapshot) {
        await sb.from("seavantage_watch_snapshot").insert({
          watch_id: w.id,
          bl_status: diff.snapshot.bl_status,
          initial_eta: diff.snapshot.initial_eta,
          initial_etd: diff.snapshot.initial_etd,
          location_count: diff.snapshot.location_count,
          raw_response: result.data as any,
          change_summary: firstCall ? "최초 조회" : diff.summary,
        });
        updated += 1;
      } else {
        unchanged += 1;
      }

      const patch: Record<string, any> = {
        last_checked_at: now(),
        last_bl_status: diff.snapshot.bl_status,
        last_initial_eta: diff.snapshot.initial_eta,
        last_initial_etd: diff.snapshot.initial_etd,
        last_location_count: diff.snapshot.location_count,
        cargo_info: result.data,
        last_error: null,
      };
      if (!w.document_id && result.data.documentId) {
        patch.document_id = result.data.documentId;
      }
      await sb.from("seavantage_watch").update(patch).eq("id", w.id);
    }

    return NextResponse.json({
      ok: true,
      data: {
        total: watches?.length ?? 0,
        updated,
        unchanged,
        errors,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteCargo } from "@/lib/seavantage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * DELETE /api/seavantage/watch/[id]
 *   - SeaVantage에서도 삭제(documentId 있을 때) + 로컬 row 삭제
 *   - SeaVantage 삭제 실패해도 로컬은 지움 (고립 정리는 추후 sweep 처리)
 *
 * PATCH  /api/seavantage/watch/[id]
 *   body: { memo?, is_closed? }
 */

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sb = createAdminClient();

    const { data: row } = await sb
      .from("seavantage_watch")
      .select("document_id")
      .eq("id", id)
      .single();

    let remoteWarning: string | null = null;
    if (row?.document_id) {
      const r = await deleteCargo(row.document_id);
      if (!r.ok) remoteWarning = r.error;
    }

    const { error } = await sb.from("seavantage_watch").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, remoteWarning });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sb = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};
    if (typeof body.memo === "string") patch.memo = body.memo;
    if (typeof body.is_closed === "boolean") {
      patch.is_closed = body.is_closed;
      patch.closed_at = body.is_closed ? new Date().toISOString() : null;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { ok: false, error: "변경할 필드가 없습니다." },
        { status: 400 },
      );
    }
    const { data, error } = await sb
      .from("seavantage_watch")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

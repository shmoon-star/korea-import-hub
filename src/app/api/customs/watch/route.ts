import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCargProgressParams } from "@/lib/unipass";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/customs/watch?includeClosed=false
 * POST /api/customs/watch
 *   body: { mblNo?, hblNo?, blYy?, cargMtNo?, memo? }
 */

export async function GET(req: NextRequest) {
  try {
    const sb = createAdminClient();
    const includeClosed = req.nextUrl.searchParams.get("includeClosed") === "true";

    let q = sb
      .from("customs_watch")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!includeClosed) q = q.eq("is_closed", false);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const row = {
      mbl_no: (body.mblNo as string | undefined)?.trim() || null,
      hbl_no: (body.hblNo as string | undefined)?.trim() || null,
      bl_yy: (body.blYy as string | undefined)?.trim() || null,
      carg_mt_no: (body.cargMtNo as string | undefined)?.trim() || null,
      memo: (body.memo as string | undefined)?.trim() || null,
    };

    const err = validateCargProgressParams({
      mblNo: row.mbl_no || undefined,
      hblNo: row.hbl_no || undefined,
      blYy: row.bl_yy || undefined,
      cargMtNo: row.carg_mt_no || undefined,
    });
    if (err) {
      return NextResponse.json({ ok: false, error: err }, { status: 400 });
    }

    const { data, error } = await sb
      .from("customs_watch")
      .insert(row)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "이미 등록된 BL 조합입니다." },
          { status: 409 },
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

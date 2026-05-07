import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCargo, validateCreateParams } from "@/lib/seavantage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/seavantage/watch?includeClosed=false
 * POST /api/seavantage/watch
 *   body: { carrierCode, mblNo?, bookingNo?, containerNo?, memo?, customColumn1?..3? }
 *   → SeaVantage POST /cargo 호출 + DB 적재 (둘 중 하나 실패 시 롤백 X — 운영중 보정)
 */

export async function GET(req: NextRequest) {
  try {
    const sb = createAdminClient();
    const includeClosed = req.nextUrl.searchParams.get("includeClosed") === "true";

    let q = sb
      .from("seavantage_watch")
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
    const params = {
      carrierCode: (body.carrierCode as string | undefined)?.trim() || "",
      mblNo: (body.mblNo as string | undefined)?.trim() || undefined,
      bookingNo: (body.bookingNo as string | undefined)?.trim() || undefined,
      containerNo: (body.containerNo as string | undefined)?.trim() || undefined,
      customColumn1: (body.customColumn1 as string | undefined)?.trim() || undefined,
      customColumn2: (body.customColumn2 as string | undefined)?.trim() || undefined,
      customColumn3: (body.customColumn3 as string | undefined)?.trim() || undefined,
    };

    const err = validateCreateParams(params);
    if (err) {
      return NextResponse.json({ ok: false, error: err }, { status: 400 });
    }

    // 1) SeaVantage에 등록 → documentId 받기
    const result = await createCargo(params);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, status: result.status, raw: result.raw },
        { status: 200 },
      );
    }

    // 2) 로컬 DB에 적재 (SeaVantage 등록 성공 후에만)
    const row = {
      carrier_code: params.carrierCode.toUpperCase(),
      mbl_no: params.mblNo ?? null,
      booking_no: params.bookingNo ?? null,
      container_no: params.containerNo ?? null,
      document_id: result.data.documentId,
      memo: (body.memo as string | undefined)?.trim() || null,
      custom_column1: params.customColumn1 ?? null,
      custom_column2: params.customColumn2 ?? null,
      custom_column3: params.customColumn3 ?? null,
    };

    const { data, error } = await sb
      .from("seavantage_watch")
      .insert(row)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            error: "이미 등록된 화물입니다 (carrier + 키 조합 중복).",
            documentId: result.data.documentId,
          },
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

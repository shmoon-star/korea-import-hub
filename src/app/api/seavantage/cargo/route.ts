import { NextRequest, NextResponse } from "next/server";
import { searchCargo } from "@/lib/seavantage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/seavantage/cargo?mblNo=&bookingNo=&containerNo=&withTrack=true
 * 즉시 조회 (DB 저장 없음). UNI-PASS의 import-progress 대응.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const withTrack = sp.get("withTrack") === "true";
  const result = await searchCargo(
    {
      mblNo: sp.get("mblNo") ?? undefined,
      bookingNo: sp.get("bookingNo") ?? undefined,
      containerNo: sp.get("containerNo") ?? undefined,
    },
    withTrack,
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, status: result.status, raw: result.raw },
      { status: 200 },
    );
  }
  return NextResponse.json({ ok: true, data: result.data });
}

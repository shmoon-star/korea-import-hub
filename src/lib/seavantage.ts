/**
 * SeaVantage Cargo Insight API 공통 유틸
 *
 * Endpoints (Swagger 기준):
 *   POST   /cargo                    화물 등록 → documentId 반환
 *   GET    /cargo/search             조회 (selection만)
 *   GET    /cargo/search/past-track  조회 + 선박 위치 이력
 *   PUT    /cargo/{documentId}       수정
 *   DELETE /cargo/{documentId}       삭제 (Cookie 헤더 요구사항은 추후 검증)
 *
 * 인증: HTTP Basic Auth — SEAVANTAGE_API_USER / SEAVANTAGE_API_PASS 환경변수.
 */

const DEFAULT_API_BASE = "https://insight.seavantage.com/api";

export type CreateCargoParams = {
  carrierCode: string; // 4자리, e.g., "MAEU"
  mblNo?: string;
  bookingNo?: string;
  containerNo?: string;
  customColumn1?: string;
  customColumn2?: string;
  customColumn3?: string;
};

export type SearchCargoParams = {
  mblNo?: string;
  bookingNo?: string;
  containerNo?: string;
};

export type CargoSearchResponse = {
  documentId?: string;
  carrierCode?: string;
  referenceType?: string; // MBL / CONTAINER / BOOKING
  bookingNo?: string;
  mblNo?: string;
  containerNo?: string;
  blStatus?: string; // BEFORE/PROCESSING/ON/PENDING/END/NOT_FOUND
  initialEtd?: string;
  initialEta?: string;
  bookingRegno?: string;
  srNo?: string;
  customColumn1?: string;
  customColumn2?: string;
  customColumn3?: string;
  locations?: any[];
  hbls?: any[];
  pastTrack?: any[]; // /past-track 호출 시에만
};

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number; raw?: string };

function getApiBase(): string {
  return (process.env.SEAVANTAGE_API_BASE?.trim() || DEFAULT_API_BASE).replace(/\/$/, "");
}

function getAuthHeader(): { ok: true; auth: string } | { ok: false; error: string } {
  const user = process.env.SEAVANTAGE_API_USER;
  const pass = process.env.SEAVANTAGE_API_PASS;
  if (!user || !pass) {
    return {
      ok: false,
      error: "SEAVANTAGE_API_USER / SEAVANTAGE_API_PASS 환경변수가 설정되지 않았습니다.",
    };
  }
  const auth = Buffer.from(`${user}:${pass}`).toString("base64");
  return { ok: true, auth };
}

export function validateCreateParams(p: CreateCargoParams): string | null {
  const code = (p.carrierCode || "").trim();
  if (!code) return "carrierCode (캐리어 4자리 코드)는 필수입니다 (예: MAEU)";
  if (code.length !== 4) return "carrierCode는 정확히 4자리여야 합니다";
  if (!p.mblNo && !p.bookingNo && !p.containerNo) {
    return "MBL / Booking / Container 번호 중 하나는 입력해야 합니다.";
  }
  return null;
}

export function validateSearchParams(p: SearchCargoParams): string | null {
  if (!p.mblNo && !p.bookingNo && !p.containerNo) {
    return "MBL / Booking / Container 번호 중 하나는 입력해야 합니다.";
  }
  return null;
}

/**
 * POST /cargo — 화물 등록.
 * 성공 시 SeaVantage가 발급한 documentId를 반환.
 */
export async function createCargo(
  p: CreateCargoParams,
): Promise<Result<{ documentId: string }>> {
  const err = validateCreateParams(p);
  if (err) return { ok: false, error: err };

  const cred = getAuthHeader();
  if (!cred.ok) return { ok: false, error: cred.error };

  const body: Record<string, string> = {
    carrierCode: p.carrierCode.toUpperCase().trim(),
  };
  if (p.mblNo) body.mblNo = p.mblNo.trim();
  if (p.bookingNo) body.bookingNo = p.bookingNo.trim();
  if (p.containerNo) body.containerNo = p.containerNo.trim();
  if (p.customColumn1) body.customColumn1 = p.customColumn1.trim();
  if (p.customColumn2) body.customColumn2 = p.customColumn2.trim();
  if (p.customColumn3) body.customColumn3 = p.customColumn3.trim();

  let raw: string;
  try {
    const resp = await fetch(`${getApiBase()}/cargo`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${cred.auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    raw = await resp.text();
    if (!resp.ok) {
      return {
        ok: false,
        error: parseErrorMessage(raw, `SeaVantage 등록 실패 (status ${resp.status})`),
        status: resp.status,
        raw: raw.slice(0, 1000),
      };
    }
    const json = raw ? JSON.parse(raw) : {};
    const documentId = json?.response?.documentId;
    if (!documentId) {
      return {
        ok: false,
        error: "응답에 documentId가 없습니다",
        raw: raw.slice(0, 500),
      };
    }
    return { ok: true, data: { documentId } };
  } catch (e: any) {
    return { ok: false, error: e?.message || "SeaVantage 네트워크 오류" };
  }
}

/**
 * GET /cargo/search 또는 /cargo/search/past-track.
 * withTrack=true 시 vessel position 이력 포함.
 */
export async function searchCargo(
  p: SearchCargoParams,
  withTrack = false,
): Promise<Result<CargoSearchResponse>> {
  const err = validateSearchParams(p);
  if (err) return { ok: false, error: err };

  const cred = getAuthHeader();
  if (!cred.ok) return { ok: false, error: cred.error };

  const path = withTrack ? "/cargo/search/past-track" : "/cargo/search";
  const qs = new URLSearchParams();
  if (p.mblNo) qs.set("mblNo", p.mblNo.trim());
  if (p.bookingNo) qs.set("bookingNo", p.bookingNo.trim());
  if (p.containerNo) qs.set("containerNo", p.containerNo.trim());

  let raw: string;
  try {
    const resp = await fetch(`${getApiBase()}${path}?${qs.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${cred.auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    raw = await resp.text();
    if (!resp.ok) {
      return {
        ok: false,
        error: parseErrorMessage(raw, `SeaVantage 조회 실패 (status ${resp.status})`),
        status: resp.status,
        raw: raw.slice(0, 1000),
      };
    }
    const json = raw ? JSON.parse(raw) : {};
    const data = (json?.response ?? null) as CargoSearchResponse | null;
    if (!data) {
      return {
        ok: false,
        error: "응답이 비어있습니다 (해당 화물이 없거나 아직 처리 중)",
        raw: raw.slice(0, 500),
      };
    }
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "SeaVantage 네트워크 오류" };
  }
}

/**
 * DELETE /cargo/{documentId}.
 * NOTE: Swagger 상으로는 Cookie 헤더가 required로 표시되나, Basic Auth API에서
 * 비정상으로 보임. 일단 Basic Auth만 사용하고, 실패 시 그때 보완.
 */
export async function deleteCargo(documentId: string): Promise<Result<void>> {
  const cred = getAuthHeader();
  if (!cred.ok) return { ok: false, error: cred.error };

  try {
    const resp = await fetch(
      `${getApiBase()}/cargo/${encodeURIComponent(documentId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${cred.auth}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (resp.status === 204 || resp.ok) {
      return { ok: true, data: undefined as unknown as void };
    }
    const raw = await resp.text();
    return {
      ok: false,
      error: parseErrorMessage(raw, `SeaVantage 삭제 실패 (status ${resp.status})`),
      status: resp.status,
      raw: raw.slice(0, 500),
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "SeaVantage 네트워크 오류" };
  }
}

function parseErrorMessage(raw: string, fallback: string): string {
  if (!raw) return fallback;
  try {
    const j = JSON.parse(raw);
    if (typeof j?.message === "string") return `${fallback}: ${j.message}`;
  } catch {
    // raw is not JSON, ignore
  }
  return fallback;
}

/**
 * 상태 변화 감지: prev 캐시 vs next 응답.
 */
export function diffCargo(
  prev: {
    last_bl_status?: string | null;
    last_initial_eta?: string | null;
    last_initial_etd?: string | null;
    last_location_count?: number | null;
  },
  next: CargoSearchResponse,
): {
  changed: boolean;
  summary: string;
  snapshot: {
    bl_status: string | null;
    initial_eta: string | null;
    initial_etd: string | null;
    location_count: number;
  };
} {
  const snapshot = {
    bl_status: next.blStatus ?? null,
    initial_eta: next.initialEta ?? null,
    initial_etd: next.initialEtd ?? null,
    location_count: next.locations?.length ?? 0,
  };
  const changes: string[] = [];
  if ((prev.last_bl_status ?? null) !== snapshot.bl_status) {
    changes.push(`BL 상태: ${prev.last_bl_status || "-"} → ${snapshot.bl_status || "-"}`);
  }
  if ((prev.last_initial_eta ?? null) !== snapshot.initial_eta) {
    changes.push(`ETA: ${prev.last_initial_eta || "-"} → ${snapshot.initial_eta || "-"}`);
  }
  if ((prev.last_initial_etd ?? null) !== snapshot.initial_etd) {
    changes.push(`ETD: ${prev.last_initial_etd || "-"} → ${snapshot.initial_etd || "-"}`);
  }
  if ((prev.last_location_count ?? 0) !== snapshot.location_count) {
    changes.push(
      `로케이션: ${prev.last_location_count ?? 0}건 → ${snapshot.location_count}건`,
    );
  }
  return {
    changed: changes.length > 0,
    summary: changes.join(", "),
    snapshot,
  };
}

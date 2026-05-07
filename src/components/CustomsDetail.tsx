/**
 * UNI-PASS cargo_info를 카테고리별로 구조화 표시.
 * cargo_info에 들어오는 모든 필드 노출 — 중요 필드는 라벨로, 나머지는 "기타" 섹션.
 */

// 진행상태 코드 → 색상 라벨
const PRGS_STATUS_COLORS: Record<string, string> = {
  반출완료: "#10b981",
  하선완료: "#0ea5e9",
  적재완료: "#0ea5e9",
  운송중: "#f59e0b",
  입항보고: "#6366f1",
  반입신고: "#6366f1",
  하선신고: "#0ea5e9",
};

// 카테고리별 필드 매핑 (라벨 + 포맷)
type FieldDef = { key: string; label: string; format?: "date" | "datetime" };

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "식별",
    fields: [
      { key: "cargMtNo", label: "화물관리번호" },
      { key: "mblNo", label: "MBL 번호" },
      { key: "hblNo", label: "HBL 번호" },
      { key: "blPtNm", label: "B/L 유형" },
      { key: "blPt", label: "B/L 구분코드" },
      { key: "cargTp", label: "화물구분" },
      { key: "spcnCargCd", label: "특수화물 코드" },
    ],
  },
  {
    title: "운송",
    fields: [
      { key: "shipNm", label: "선박명" },
      { key: "shipNatNm", label: "선박국적" },
      { key: "shipNat", label: "선박국적코드" },
      { key: "vydf", label: "항차" },
      { key: "shcoFlco", label: "선사" },
      { key: "shcoFlcoSgn", label: "선사부호" },
      { key: "agnc", label: "대리점" },
      { key: "ldprNm", label: "적재항" },
      { key: "ldprCd", label: "적재항 코드" },
      { key: "lodCntyCd", label: "적재국가" },
      { key: "dsprNm", label: "양륙항" },
      { key: "dsprCd", label: "양륙항 코드" },
    ],
  },
  {
    title: "입항",
    fields: [
      { key: "etprCstm", label: "입항세관" },
      { key: "etprDt", label: "입항일자", format: "date" },
      { key: "prcsDttm", label: "처리일시", format: "datetime" },
    ],
  },
  {
    title: "화물",
    fields: [
      { key: "prnm", label: "품명" },
      { key: "ttwg", label: "총중량" },
      { key: "wghtUt", label: "중량단위" },
      { key: "msrm", label: "측정 (CBM)" },
      { key: "pckGcnt", label: "포장개수" },
      { key: "pckUt", label: "포장단위" },
      { key: "cntrNo", label: "컨테이너 번호" },
      { key: "cntrGcnt", label: "컨테이너 개수" },
    ],
  },
  {
    title: "통관 / 진행",
    fields: [
      { key: "prgsStts", label: "진행상태" },
      { key: "prgsStCd", label: "진행상태 코드" },
      { key: "csclPrgsStts", label: "통관진행상태" },
      { key: "dclrDelyAdtxYn", label: "신고지연 가산세" },
      { key: "mtTrgtCargYnNm", label: "관리대상화물" },
      { key: "rlseDtyPridPassTpcd", label: "반출허가 경과" },
    ],
  },
  {
    title: "업체",
    fields: [
      { key: "frwrEntsConm", label: "포워더" },
      { key: "frwrSgn", label: "포워더 부호" },
      { key: "entsKoreNm", label: "업체명" },
    ],
  },
];

function fmtDt(s?: string | null): string {
  if (!s) return "";
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  if (/^\d{14}$/.test(s))
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`;
  return s;
}

export default function CustomsDetail({
  cargoInfo,
}: {
  cargoInfo: Record<string, any> | null | undefined;
}) {
  if (!cargoInfo || typeof cargoInfo !== "object") {
    return (
      <div style={{ padding: 16, color: "#9ca3af", fontSize: 12 }}>
        아직 응답 데이터가 없습니다 — 갱신을 먼저 실행하세요.
      </div>
    );
  }

  const prgs = String(cargoInfo.prgsStts || "");
  const cscl = String(cargoInfo.csclPrgsStts || "");
  const prgsColor = PRGS_STATUS_COLORS[prgs] || "#6b7280";

  // 카테고리에 들어가는 모든 키
  const knownKeys = new Set(SECTIONS.flatMap((s) => s.fields.map((f) => f.key)));
  const otherEntries = Object.entries(cargoInfo).filter(
    ([k, v]) => !knownKeys.has(k) && v !== null && v !== "",
  );

  // UNI-PASS 화물진행정보 조회 페이지 (공식 포털)
  const unipassUrl = "https://unipass.customs.go.kr/clip/index.do";

  return (
    <div style={{ fontSize: 12, color: "#1f2937" }}>
      {/* 헤더 카드 */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 14,
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <strong style={{ fontSize: 14 }}>{cargoInfo.cargMtNo || "-"}</strong>
            <span style={{ color: "#9ca3af" }}>·</span>
            <span style={{ color: "#6b7280" }}>{cargoInfo.cargTp || "-"}</span>
            {prgs && (
              <span
                style={{
                  marginLeft: 6,
                  padding: "2px 8px",
                  background: prgsColor,
                  color: "white",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {prgs}
              </span>
            )}
            {cscl && (
              <span
                style={{
                  padding: "2px 8px",
                  background: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {cscl}
              </span>
            )}
          </div>
          {cargoInfo.mblNo && <KV label="MBL" value={cargoInfo.mblNo} />}
          {cargoInfo.hblNo && <KV label="HBL" value={cargoInfo.hblNo} />}
          {cargoInfo.cntrNo && <KV label="Container" value={cargoInfo.cntrNo} />}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#6b7280" }}>
              {cargoInfo.ldprNm || "-"} → {cargoInfo.dsprNm || "-"}
            </div>
            {cargoInfo.shipNm && (
              <div style={{ fontWeight: 600 }}>
                🚢 {cargoInfo.shipNm}
                {cargoInfo.vydf && (
                  <span style={{ color: "#6b7280", fontWeight: 400 }}>
                    {" "}
                    · {cargoInfo.vydf}
                  </span>
                )}
              </div>
            )}
            {cargoInfo.etprDt && (
              <div style={{ fontSize: 11, color: "#374151" }}>
                입항: {fmtDt(cargoInfo.etprDt)}
              </div>
            )}
          </div>
          <a
            href={unipassUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "6px 12px",
              background: "#111827",
              color: "white",
              textDecoration: "none",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            UNI-PASS 포털 ↗
          </a>
        </div>
      </div>

      {/* 카테고리별 필드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {SECTIONS.map((section) => {
          const visible = section.fields
            .map((f) => ({ ...f, val: cargoInfo[f.key] }))
            .filter((f) => f.val !== null && f.val !== undefined && f.val !== "");
          if (visible.length === 0) return null;
          return (
            <div
              key={section.title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: 10,
                background: "white",
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                  paddingBottom: 4,
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                {section.title}
              </div>
              {visible.map((f) => {
                let displayVal = String(f.val ?? "");
                if (f.format === "date") displayVal = fmtDt(displayVal);
                if (f.format === "datetime") displayVal = fmtDt(displayVal);
                return <KV key={f.key} label={f.label} value={displayVal} />;
              })}
            </div>
          );
        })}

        {/* 기타 (라벨 매핑 안 된 필드 전부) */}
        {otherEntries.length > 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              border: "1px dashed #d1d5db",
              borderRadius: 6,
              padding: 10,
              background: "#fafbfc",
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              기타 / 미매핑 필드 ({otherEntries.length})
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 4,
              }}
            >
              {otherEntries.map(([k, v]) => (
                <div key={k} style={{ fontSize: 11 }}>
                  <code style={{ color: "#9ca3af", fontSize: 10 }}>{k}</code>:{" "}
                  <span>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Raw JSON (접힘) */}
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontSize: 11, color: "#6b7280" }}>
          Raw JSON 보기
        </summary>
        <pre
          style={{
            fontSize: 10,
            background: "#0f172a",
            color: "#e2e8f0",
            padding: 12,
            borderRadius: 6,
            marginTop: 6,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {JSON.stringify(cargoInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div style={{ fontSize: 11, lineHeight: 1.55, display: "flex", gap: 6 }}>
      <span style={{ color: "#6b7280", minWidth: 96 }}>{label}</span>
      <span style={{ color: "#1f2937", fontWeight: 500, flex: 1 }}>{value}</span>
    </div>
  );
}

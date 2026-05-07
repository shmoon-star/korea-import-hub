/**
 * 수입 화물 흐름도 — 실무자 메인 화면.
 * 외부 5개 채널 + WMS 데이터를 한 PO/BL의 단일 타임라인으로 통합.
 *
 * 9단계: PO(SCM Hub) → CRD/Booking(Forwarder) → 출항·운송·입항(SeaVantage)
 *        → 수입신고/통관(ReadyKorea+UNI-PASS) → 반출(UNI-PASS) → 입고완료(WMS/SCM Hub)
 */

type StageStatus = "done" | "active" | "pending" | "error";
type Stage = {
  num: number;
  label: string;
  source: string;
  sourceBadge: "scmhub" | "forwarder" | "seavantage" | "unipass" | "readykorea" | "wms" | "external";
  description: string;
  status: StageStatus;
  data?: { key: string; value: string }[];
  link?: { label: string; href: string };
};

// ─────────────────────────────────────────────
// 1) 흐름 단계 정의 (전체 9단계 — 비활성, 설명용)
// ─────────────────────────────────────────────
const STAGE_DEFS: Omit<Stage, "status" | "data" | "link">[] = [
  {
    num: 1,
    label: "PO 발행",
    source: "SCM Hub PO",
    sourceBadge: "scmhub",
    description: "SCM Hub가 모든 PO를 단일화 (2026년 목표). 우리 hub의 PO 진실 source",
  },
  {
    num: 2,
    label: "CRD 입력",
    source: "Forwarder (E2E)",
    sourceBadge: "forwarder",
    description: "공급사가 PO/SKU별 CRD/생산일/수량/CBM/중량 입력",
  },
  {
    num: 3,
    label: "Booking 확정",
    source: "Forwarder (E2E)",
    sourceBadge: "forwarder",
    description: "MBL/HBL 발급 + Vessel/POL/POD/ETD/ETA + Booking Confirmation 발송",
  },
  {
    num: 4,
    label: "출항 (Loaded)",
    source: "SeaVantage",
    sourceBadge: "seavantage",
    description: "POL ATD / Container 적재 완료 / Vessel departure",
  },
  {
    num: 5,
    label: "운송 중",
    source: "SeaVantage",
    sourceBadge: "seavantage",
    description: "선박 위치 추적 / 환적 (TSL/TSD) 정보 / ETA 갱신",
  },
  {
    num: 6,
    label: "입항",
    source: "SeaVantage + UNI-PASS",
    sourceBadge: "external",
    description: "POD ATA / 입항보고 — 한국 도착 시점부터 UNI-PASS 데이터 시작",
  },
  {
    num: 7,
    label: "수입신고 / 통관",
    source: "ReadyKorea + UNI-PASS",
    sourceBadge: "external",
    description: "관세사가 신고서 입력 (ReadyKorea) → 관세청 처리 (UNI-PASS)",
  },
  {
    num: 8,
    label: "통관완료 / 반출",
    source: "UNI-PASS",
    sourceBadge: "unipass",
    description: "수입신고수리 → 반출완료. cargMtNo 기준 추적",
  },
  {
    num: 9,
    label: "입고 완료",
    source: "WMS / SCM Hub",
    sourceBadge: "wms",
    description: "SCM Hub의 WMS 모듈에 입고 등록 완료 — 화물의 종착",
  },
];

// ─────────────────────────────────────────────
// 2) 예시 데이터 (실무자 시연용 — Mock)
// ─────────────────────────────────────────────
const EXAMPLE: { po: string; mbl: string; hbl: string; carrier: string; brand: string; stages: Stage[] } = {
  po: "PO-2026-FW-001234",
  mbl: "WDFCGBF32332212",
  hbl: "ELCKTAO26030088",
  carrier: "MAEU",
  brand: "FW26 KF001",
  stages: [
    {
      ...STAGE_DEFS[0],
      status: "done",
      data: [
        { key: "PO No", value: "PO-2026-FW-001234" },
        { key: "발행일", value: "2026-03-15" },
        { key: "Brand/Season", value: "FW26 KF001" },
        { key: "총 SKU", value: "12 SKU" },
      ],
    },
    {
      ...STAGE_DEFS[1],
      status: "done",
      data: [
        { key: "Cargo Ready Date", value: "2026-04-10" },
        { key: "수량", value: "1,200 PCS" },
        { key: "CBM", value: "8.5" },
        { key: "중량", value: "707.9 KG" },
        { key: "포장", value: "45 GT" },
      ],
      link: { label: "Forwarder", href: "/tools/forwarder" },
    },
    {
      ...STAGE_DEFS[2],
      status: "done",
      data: [
        { key: "MBL", value: "WDFCGBF32332212" },
        { key: "HBL", value: "ELCKTAO26030088" },
        { key: "Carrier", value: "MAEU" },
        { key: "Vessel/Voyage", value: "NEWGOLDENBRIDGE 5 / 3233" },
        { key: "POL → POD", value: "Qingdao(CNTAO) → Incheon(KRINC)" },
        { key: "ETD / ETA", value: "2026-04-25 / 2026-05-08" },
      ],
      link: { label: "Forwarder", href: "/tools/forwarder" },
    },
    {
      ...STAGE_DEFS[3],
      status: "done",
      data: [
        { key: "POL ATD", value: "2026-04-25 14:30" },
        { key: "Container", value: "KEIU9700066" },
        { key: "Vessel", value: "NEWGOLDENBRIDGE 5" },
      ],
      link: { label: "SeaVantage", href: "/tools/shipment-tracking" },
    },
    {
      ...STAGE_DEFS[4],
      status: "done",
      data: [
        { key: "현재 위치", value: "동중국해 (lat 33.2, lng 124.1)" },
        { key: "ETA 갱신", value: "2026-05-08 → 2026-05-07 (1일 빠름)" },
        { key: "환적", value: "없음 (직항)" },
      ],
      link: { label: "SeaVantage", href: "/tools/shipment-tracking" },
    },
    {
      ...STAGE_DEFS[5],
      status: "done",
      data: [
        { key: "POD ATA", value: "2026-05-07 09:15" },
        { key: "입항세관", value: "인천세관" },
        { key: "선박국적", value: "파나마 (PA)" },
      ],
      link: { label: "UNI-PASS", href: "/tools/customs-tracking" },
    },
    {
      ...STAGE_DEFS[6],
      status: "active",
      data: [
        { key: "수입신고", value: "ReadyKorea 입력 중 (TBD)" },
        { key: "진행상태 (UNI-PASS)", value: "반출완료" },
        { key: "통관진행상태", value: "수입신고수리" },
        { key: "화물관리번호", value: "26WDFCF233I07050006" },
      ],
      link: { label: "UNI-PASS", href: "/tools/customs-tracking" },
    },
    {
      ...STAGE_DEFS[7],
      status: "pending",
      data: [{ key: "예상", value: "수리 후 24~48시간 내 반출" }],
    },
    {
      ...STAGE_DEFS[8],
      status: "pending",
      data: [{ key: "예상", value: "반출 후 1~2일 내 mwms-lite 입고" }],
    },
  ],
};

// ─────────────────────────────────────────────
// 3) 출처 배지 색상
// ─────────────────────────────────────────────
const BADGE_COLORS: Record<Stage["sourceBadge"], { bg: string; fg: string }> = {
  scmhub: { bg: "#fef3c7", fg: "#92400e" },
  forwarder: { bg: "#dbeafe", fg: "#1e40af" },
  seavantage: { bg: "#dcfce7", fg: "#166534" },
  unipass: { bg: "#fce7f3", fg: "#9f1239" },
  readykorea: { bg: "#f3e8ff", fg: "#6b21a8" },
  wms: { bg: "#e0e7ff", fg: "#3730a3" },
  external: { bg: "#f1f5f9", fg: "#334155" },
};

const STATUS_STYLE: Record<StageStatus, { icon: string; color: string; label: string }> = {
  done: { icon: "✓", color: "#10b981", label: "완료" },
  active: { icon: "●", color: "#f59e0b", label: "진행 중" },
  pending: { icon: "○", color: "#9ca3af", label: "대기" },
  error: { icon: "✕", color: "#ef4444", label: "에러" },
};

// ─────────────────────────────────────────────
// 4) 페이지
// ─────────────────────────────────────────────
export default function CargoFlowPage() {
  const completedCount = EXAMPLE.stages.filter((s) => s.status === "done").length;

  return (
    <div style={{ padding: 24, maxWidth: 1280, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 11,
          color: "#92400e",
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        ★ MAIN — 실무자 통합 화면 (가장 중요)
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>수입 화물 흐름도</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        한 PO/BL의 PO 발행부터 입고 완료까지 9단계를 외부 5개 채널 + WMS 데이터로 통합.
        실무자가 한 화면에서 화물의 현재 위치/상태/병목을 즉시 파악.
      </p>

      {/* ─────── 화물 조회 (placeholder) ─────── */}
      <section style={section}>
        <h2 style={h2}>화물 조회</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
          <input placeholder="PO #" style={input} disabled />
          <input placeholder="MBL 번호" style={input} disabled />
          <input placeholder="HBL 번호" style={input} disabled />
          <button style={btn} disabled>
            조회
          </button>
        </div>
        <p style={{ ...p, marginTop: 8, fontSize: 11.5, color: "#9ca3af" }}>
          (실제 조회는 외부 채널 연동 완료 후. 아래는 시연용 예시)
        </p>
      </section>

      {/* ─────── 예시 PO 통합 타임라인 (메인 콘텐츠) ─────── */}
      <section
        style={{
          ...section,
          background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            paddingBottom: 12,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#92400e",
                background: "#fef3c7",
                padding: "2px 8px",
                borderRadius: 4,
                display: "inline-block",
                marginBottom: 6,
              }}
            >
              EXAMPLE · 시연용 가상 데이터
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {EXAMPLE.po}{" "}
              <span style={{ color: "#6b7280", fontWeight: 400, fontSize: 13 }}>
                · {EXAMPLE.brand}
              </span>
            </h2>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              MBL: <strong>{EXAMPLE.mbl}</strong> · HBL:{" "}
              <strong>{EXAMPLE.hbl}</strong> · Carrier:{" "}
              <strong>{EXAMPLE.carrier}</strong>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>현재 진행</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#f59e0b",
              }}
            >
              {completedCount} / {EXAMPLE.stages.length} 완료
            </div>
            <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>
              ● 수입신고 / 통관 진행 중
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div
          style={{
            width: "100%",
            height: 6,
            background: "#f3f4f6",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: `${(completedCount / EXAMPLE.stages.length) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #10b981 0%, #f59e0b 100%)",
            }}
          />
        </div>

        {/* 타임라인 */}
        <div style={{ display: "grid", gap: 10 }}>
          {EXAMPLE.stages.map((s) => {
            const stat = STATUS_STYLE[s.status];
            const badge = BADGE_COLORS[s.sourceBadge];
            const isInactive = s.status === "pending";
            return (
              <div
                key={s.num}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 280px",
                  gap: 14,
                  padding: 12,
                  background: "white",
                  border: `1px solid ${isInactive ? "#f3f4f6" : "#e5e7eb"}`,
                  borderRadius: 8,
                  opacity: isInactive ? 0.6 : 1,
                }}
              >
                {/* 단계 번호 + 상태 아이콘 */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: stat.color,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {stat.icon}
                </div>

                {/* 단계 정보 + 데이터 */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>
                      {s.num}.
                    </span>
                    <strong style={{ fontSize: 14 }}>{s.label}</strong>
                    <span
                      style={{
                        padding: "2px 8px",
                        background: badge.bg,
                        color: badge.fg,
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 999,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {s.source}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: stat.color,
                        fontWeight: 700,
                        marginLeft: "auto",
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.5 }}>
                    {s.description}
                  </div>
                </div>

                {/* 데이터 미리보기 */}
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#374151",
                    background: "#f9fafb",
                    padding: 8,
                    borderRadius: 6,
                    lineHeight: 1.6,
                  }}
                >
                  {s.data && s.data.length > 0 ? (
                    s.data.map((d, i) => (
                      <div key={i} style={{ display: "flex", gap: 6 }}>
                        <span style={{ color: "#9ca3af", minWidth: 100 }}>{d.key}</span>
                        <span style={{ fontWeight: 500 }}>{d.value}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#9ca3af" }}>데이터 없음</span>
                  )}
                  {s.link && (
                    <a
                      href={s.link.href}
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        fontSize: 10.5,
                        color: "#2563eb",
                        textDecoration: "none",
                      }}
                    >
                      → {s.link.label} 페이지로
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ ...p, marginTop: 14, fontSize: 11.5, color: "#6b7280" }}>
          ※ 위 데이터는 시연용입니다. 외부 채널 연동 완료 후 실제 PO 입력하면 동일 형태로 자동
          채워집니다.
        </p>
      </section>

      {/* ─────── 흐름 단계 일반 설명 (참고) ─────── */}
      <section style={section}>
        <h2 style={h2}>흐름 단계 (전체 9단계 — 참고)</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {STAGE_DEFS.map((s) => {
            const badge = BADGE_COLORS[s.sourceBadge];
            return (
              <div
                key={s.num}
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 1fr 240px",
                  gap: 12,
                  padding: "10px 12px",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#e5e7eb",
                    color: "#374151",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {s.num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                    {s.description}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: badge.fg,
                    background: badge.bg,
                    padding: "4px 8px",
                    borderRadius: 4,
                    textAlign: "center",
                  }}
                >
                  {s.source}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Section title="구현 우선순위">
        <ol style={list}>
          <li>먼저 1개 PO 단위 통합 view — UNI-PASS + SeaVantage 연결만 (이미 데이터 있음)</li>
          <li>Forwarder/ReadyKorea 연동되면 단계 2,3,7에 데이터 자동 채워짐</li>
          <li>SCM Hub PO + WMS 입고 정보 연동 — 1단계와 9단계 채워짐</li>
          <li>알림: 단계간 지연 발생 시 (예: ATD 후 7일 지나도 ATA 없음) 색상/배지</li>
          <li>(선택) 지도 view — SeaVantage 선박 위치 + UNI-PASS 입항지 마커</li>
        </ol>
      </Section>
    </div>
  );
}

const section: React.CSSProperties = {
  marginBottom: 20,
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "white",
};
const h2: React.CSSProperties = { fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#111827" };
const p: React.CSSProperties = { fontSize: 13, lineHeight: 1.7, color: "#374151", margin: 0 };
const list: React.CSSProperties = {
  paddingLeft: 20,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#374151",
  margin: 0,
};
const input: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "inherit",
};
const btn: React.CSSProperties = {
  padding: "8px 18px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  opacity: 0.5,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={section}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

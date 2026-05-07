/**
 * 수입 화물 흐름도 — 실무자가 매일 보는 통합 화면.
 * 한 PO/BL의 모든 단계를 외부 5개 채널 데이터로 구성한 타임라인.
 *
 * 표면적 메인 — 데이터 모음(숨은 메인)과 같은 데이터를 다른 형태로 보여줌.
 */

export default function CargoFlowPage() {
  // 흐름 단계 정의 (TBD — 데이터 들어오면 채워짐)
  const STAGES = [
    {
      key: "po",
      label: "1. PO 발행",
      source: "SCM Hub PO (단일화)",
      description: "SCM Hub PO 발행 → 공급사에 전달. 2026년 단일화 목표",
      status: "TBD",
    },
    {
      key: "crd",
      label: "2. CRD 입력",
      source: "Forwarder (E2E)",
      description: "공급사가 PO/SKU별 CRD/생산일/수량/CBM 입력",
      status: "TBD",
    },
    {
      key: "booking",
      label: "3. Booking 확정",
      source: "Forwarder (E2E)",
      description: "Vessel / POL / POD / ETD / ETA + Booking Confirmation 발송",
      status: "TBD",
    },
    {
      key: "loaded",
      label: "4. 출항 (Loaded)",
      source: "SeaVantage",
      description: "POL ATD / Container 적재 완료",
      status: "TBD",
    },
    {
      key: "transit",
      label: "5. 운송 중",
      source: "SeaVantage",
      description: "선박 위치 추적 / 환적 (TSL/TSD) 정보",
      status: "TBD",
    },
    {
      key: "arrival",
      label: "6. 입항",
      source: "SeaVantage + UNI-PASS",
      description: "POD ATA / 입항보고",
      status: "TBD",
    },
    {
      key: "customs",
      label: "7. 통관 진행",
      source: "UNI-PASS + ReadyKorea",
      description: "수입신고 / 세액 / 통관진행 / 반출완료",
      status: "TBD",
    },
    {
      key: "scmhub",
      label: "8. SCM Hub 송신",
      source: "Data Mart → SCM Hub",
      description:
        "정제 데이터를 사내 SCM Hub로 송신 (이 hub의 종착지). SAP 적재는 SCM Hub가 책임",
      status: "TBD",
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, fontFamily: "system-ui, sans-serif" }}>
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
        ★ MAIN (표면적 기능) — 실무자 통합 화면
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>수입 화물 흐름도</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        PO# / MBL / HBL 입력 → 5개 External Channel 데이터를 단일 타임라인으로 통합.
        실무자가 한 화면에서 PO 발행부터 SAP 송신까지 전 단계 확인.
      </p>

      <Banner>
        🚧 <strong>구현 대기</strong> — External Channels 권한이 풀려야 데이터 통합 가능
      </Banner>

      {/* PO/BL 검색 (UI 골격) */}
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
          (입력 활성화는 데이터 채널 연동 완료 후)
        </p>
      </section>

      {/* 타임라인 시안 */}
      <section style={section}>
        <h2 style={h2}>흐름 단계 (8단계)</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              style={{
                display: "grid",
                gridTemplateColumns: "30px 1fr 200px 100px",
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
                {i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
                <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                  {s.description}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#374151" }}>
                <span style={{ color: "#9ca3af" }}>출처</span>{" "}
                <span style={{ fontWeight: 600 }}>{s.source}</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textAlign: "right",
                }}
              >
                {s.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Section title="구현 우선순위">
        <ol style={list}>
          <li>먼저 1개 PO 단위 통합 view — UNI-PASS + SeaVantage 연결만 (이미 데이터 있음)</li>
          <li>Forwarder/ReadyKorea 연동되면 단계 2,3,7에 데이터 자동 채워짐</li>
          <li>같은 화물 multi-source view: 같은 PO/MBL이 어느 채널에 있는지 표 형태</li>
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

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#fef3c7",
        border: "1px solid #fcd34d",
        borderRadius: 8,
        fontSize: 13,
        color: "#92400e",
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={section}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * SCM Hub — PO 발행 / 단일 진실 source.
 * 사내 시스템이라 사양 확인 후 연동. 우리 hub 흐름의 출발점.
 */

export default function ScmHubPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>SCM Hub</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        무신사 사내 SCM Hub — <strong>PO를 발행하고 단일화하는 진실의 source</strong>. 우리 hub의
        모든 흐름은 SCM Hub PO에서 시작. 또한 WMS / 재고 / SAP 송신을 모두 책임.
      </p>

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
        🚧 <strong>TBD</strong> — 사내 SCM Hub API 사양 / 인증 / endpoint 확인 후 연동
      </div>

      <Section title="역할 (이 hub 관점)">
        <Table
          rows={[
            ["출발점", "PO 발행 → Forwarder에 전달 → 우리 hub의 모든 watch가 이 PO 키 기준"],
            ["단일 진실", "2026년 SCM Hub PO 단일화 목표. SAP PO / PLM PO와 매핑"],
            ["WMS / 재고", "입항 후 mwms-lite로 입고 → SCM Hub가 통합 관리"],
            ["SAP 송신", "우리는 SAP에 직접 X. SCM Hub가 책임 (start-point qty 등)"],
            [
              "Hub 연결 위치",
              <>
                개발: <code>https://api.dev.one.musinsa.com/api2/sap</code>
                <br />
                운영: <code>https://sap.ally.musinsa.com/api2/sap</code>
              </>,
            ],
          ]}
        />
      </Section>

      <Section title="우리가 받아야 할 데이터 (가설)">
        <Table
          rows={[
            ["PO 마스터", "PO# / 발행일 / Brand · Season / SKU 리스트 / 수량 / 단가"],
            ["PO 상태", "발행 / 전달완료 / CRD확정 / 출항 / 입항 / 통관 / 입고 / 종료"],
            ["PO 변경 이력", "수량 변경 / 분할 / 취소 / 머지"],
            ["Forwarder 매핑", "어느 PO가 어느 Forwarder/Consolidator에 할당됐는지"],
            ["WMS 입고", "mwms-lite 입고 결과 — SCM Hub가 SoT"],
            ["재고 onhand", "현재 재고 — 우리 hub 흐름 종착 후 표시용"],
          ]}
        />
      </Section>

      <Section title="다음 액션">
        <ol style={list}>
          <li>SCM Hub PO API endpoint / 인증 방식 / 응답 schema 확보</li>
          <li>2026년 단일화 진행률 — 활성화 시점 결정 (SCM Hub PO가 일정량 이상 들어와야 의미)</li>
          <li>
            SCM Hub PO ↔ Forwarder PO ↔ ReadyKorea 신고번호 ↔ UNI-PASS 화물관리번호 — 키 매핑
            전략 합의
          </li>
          <li>WMS 입고 데이터 받는 형태 (push? pull? 주기?)</li>
          <li>SCM Hub의 SHIF 인터페이스 정의서 시트 접근</li>
        </ol>
      </Section>
    </div>
  );
}

const list: React.CSSProperties = {
  paddingLeft: 20,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#374151",
  margin: 0,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 20,
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "white",
      }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#111827" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Table({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 8, fontSize: 12.5 }}>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: "contents" }}>
          <div style={{ color: "#6b7280", fontWeight: 600, padding: "4px 0" }}>{k}</div>
          <div style={{ color: "#1f2937", padding: "4px 0" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

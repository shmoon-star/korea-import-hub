/**
 * SAP PO 연동 — placeholder. 외부 채널(Forwarder/UNI-PASS/ReadyKorea/SeaVantage)에서
 * 모은 데이터를 종착지 SAP로 push하는 깔때기.
 */

export default function SapPage() {
  return (
    <div style={{ padding: 24, maxWidth: 960, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>SAP 연동</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        외부 채널(Forwarder · UNI-PASS · ReadyKorea · SeaVantage)에서 모은 화물·통관 데이터의
        종착지. 이 hub가 직접 SAP에 push하지는 않고, 사내망 사이드의 Bridge가 SAP CPI로 일괄 전송.
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
        🚧 <strong>TBD</strong> — 사내 SCM Hub / 사내 api-app 측 연동 사양 확정 후 구현
      </div>

      <section style={section}>
        <h2 style={h2}>아키텍처 (현재 합의된 구조)</h2>
        <pre style={code}>
{`korea-import-hub (Vercel · 공용 인터넷)
        │
        │ (외부 채널에서 데이터 수집·축적)
        ▼
   Supabase (별도 프로젝트)
        │
        │ (사내망 시스템이 pull)
        ▼
사내 SCM Hub / api-app (OCMP AWS 계정, 사내망)
        │
        ▼
SAP CPI (BTP Integration Suite)
        │
        ▼
       SAP`}
        </pre>
        <p style={p}>
          → 이 페이지(SAP)는 "어떤 데이터가 SAP로 향하는가"의 <strong>운영 가시성</strong>만
          제공합니다. 실제 SAP 호출은 hub가 하지 않음.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>이 페이지에 들어갈 것 (계획)</h2>
        <ul style={list}>
          <li>SAP 송신 대상 PO/BL 리스트 (status: pending / sent / acked / failed)</li>
          <li>SAP 수신 PO 정보 (사내망에서 pull한 결과 mirror)</li>
          <li>매핑 누락/실패 항목 알림</li>
          <li>(선택) SAP CPI 인터페이스 카탈로그 (SHIF### 번호별)</li>
        </ul>
      </section>

      <section style={section}>
        <h2 style={h2}>먼저 필요한 것</h2>
        <ul style={list}>
          <li>사내 SCM Hub 측 endpoint 사양 (api.dev.one.musinsa.com / sap.ally.musinsa.com)</li>
          <li>인증 방식 (Legacy Stock 승계 — SAP팀 합의 필요)</li>
          <li>우리 hub의 데이터를 어떤 schema로 SCM Hub에 넘길지 합의</li>
          <li>SHIF 인터페이스 정의서 시트 접근</li>
        </ul>
      </section>
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
const p: React.CSSProperties = { fontSize: 13, lineHeight: 1.7, color: "#374151", margin: "8px 0 0" };
const list: React.CSSProperties = {
  paddingLeft: 20,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#374151",
  margin: 0,
};
const code: React.CSSProperties = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: 12,
  borderRadius: 6,
  fontSize: 11,
  whiteSpace: "pre-wrap",
  margin: 0,
};

/**
 * Airplane Tracking — 항공 화물 추적. placeholder (TBD).
 */

export default function AirplaneTrackingPage() {
  return (
    <div style={{ padding: 24, maxWidth: 960, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Airplane Tracking · 항공 화물 추적
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        해상은 SeaVantage로 처리, 항공은 별도 트랙. 사용할 데이터 소스 미정.
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
        🚧 <strong>TBD</strong> — 데이터 소스 결정 필요
      </div>

      <section style={section}>
        <h2 style={h2}>후보 데이터 소스</h2>
        <ul style={list}>
          <li>
            <strong>FlightAware AeroAPI</strong> — 항공편 실시간/이력, 화물 전용 X (운항 위주)
          </li>
          <li>
            <strong>Cargo iQ (IATA)</strong> — 화물 전용 milestone 트래킹, 가입 캐리어 전제
          </li>
          <li>
            <strong>각 항공사 자체 API</strong> — KE/OZ/CX 등, AWB 단위. 캐리어별 별도 계약
          </li>
          <li>
            <strong>Forwarder의 항공 시스템</strong> — E2E가 항공도 다루면 그쪽에서 pull
          </li>
          <li>
            <strong>SeaVantage AirVantage 등 통합 SaaS</strong> — 단일 진입점 (요금 확인 필요)
          </li>
        </ul>
      </section>

      <section style={section}>
        <h2 style={h2}>먼저 결정할 것</h2>
        <ol style={list}>
          <li>항공 화물 비중 — 전체 import 중 항공이 몇 % 인가? (Trial 우선순위 결정)</li>
          <li>주로 쓰는 항공사 / 포워더 — 그쪽 API 우선 검토</li>
          <li>AWB(Air Waybill) 입수 시점 — Forwarder에서 받는지 항공사에서 받는지</li>
          <li>단순 status 추적 vs 시간단위 위치 추적 중 무엇이 필요한가</li>
        </ol>
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
const list: React.CSSProperties = {
  paddingLeft: 20,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#374151",
  margin: 0,
};

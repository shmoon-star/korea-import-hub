/**
 * SAP 메뉴 — 우리 hub는 SAP에 직접 push하지 않음.
 * 사내 SCM Hub가 SAP CPI를 통해 송신. 이 페이지는 그 경로의 가시성만 제공.
 */

export default function SapPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1000, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>SAP 연동</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        이 hub는 SAP에 <strong>직접 송신하지 않음</strong>. 우리는 사내 SCM Hub까지만 데이터를
        넘기고, 그 이후 SAP / Finance / 원가회계는 SCM Hub와 SAP 단에서 처리. 이 페이지는 그
        경로의 운영 가시성을 위한 자리.
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
        🚧 <strong>TBD</strong> — SCM Hub 송신 사양 합의 후 가시화 항목 정의
      </div>

      <section style={section}>
        <h2 style={h2}>경로 (정정된 아키텍처)</h2>
        <pre style={code}>
{`korea-import-hub (이 시스템)
        │
        │  외부 채널 5개 + 운영 입력 → 데이터 모음 (Supabase)
        ▼
사내 SCM Hub (OCMP AWS, 사내망)
  ├── PO 단일화 (2026년 목표 — SCM Hub PO가 진실)
  ├── WMS / 재고 통합 관리
  ├── 우리 hub의 정제 데이터 수신
  │
  │  start-point quantity 등 핵심만 push
  ▼
SAP CPI (BTP Integration Suite)
        │
        ▼
SAP
  └─ Finance · 원가 회계는 SAP 단에서 키워나감
     (SAP→Finance 마지막 정리는 시스템 개발사 담당)`}
        </pre>
      </section>

      <section style={section}>
        <h2 style={h2}>책임 분담</h2>
        <table style={tbl}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <Th>레이어</Th>
              <Th>책임 주체</Th>
              <Th>주요 데이터</Th>
            </tr>
          </thead>
          <tbody>
            <tr style={tr}>
              <Td>외부 채널 수집</Td>
              <Td>
                <strong>korea-import-hub (우리)</strong>
              </Td>
              <Td>UNI-PASS / SeaVantage / ReadyKorea / Forwarder / Airplane</Td>
            </tr>
            <tr style={tr}>
              <Td>PO 단일화 / WMS / 재고</Td>
              <Td>SCM Hub</Td>
              <Td>SCM Hub PO (= 진실 source) / WMS 입출고 / 재고 onhand</Td>
            </tr>
            <tr style={tr}>
              <Td>SAP 적재</Td>
              <Td>SCM Hub → SAP CPI</Td>
              <Td>start-point quantity 등 핵심 필드</Td>
            </tr>
            <tr style={tr}>
              <Td>Finance / 원가</Td>
              <Td>SAP 단 + 시스템 개발사</Td>
              <Td>원가회계, 파이낸스북 — SAP 내부 가공</Td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={section}>
        <h2 style={h2}>이 페이지에 들어갈 것 (계획)</h2>
        <ul style={list}>
          <li>SCM Hub로 송신 대기 중인 PO/BL 리스트 (status: pending / sent / acked / failed)</li>
          <li>SCM Hub가 들고 있는 PO와 우리 데이터의 매핑 상태</li>
          <li>매핑 누락/실패 항목 알림</li>
          <li>(선택) SCM Hub → SAP의 SHIF 인터페이스 카탈로그 (가시성만)</li>
        </ul>
      </section>

      <section style={section}>
        <h2 style={h2}>현재 미지수</h2>
        <ul style={list}>
          <li>SCM Hub PO API endpoint / 인증 방식 (사내)</li>
          <li>SCM Hub로 우리가 push하는 형태 vs SCM Hub가 우리를 pull하는 형태</li>
          <li>SHIF 인터페이스 정의서 시트 접근</li>
          <li>2026년 SCM Hub PO 단일화 진행률 — 우리 시스템 활성화 시점 결정</li>
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
const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 12.5 };
const tr: React.CSSProperties = { borderBottom: "1px solid #f3f4f6" };

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "8px 10px",
        textAlign: "left",
        fontWeight: 700,
        fontSize: 11,
        color: "#374151",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "8px 10px", verticalAlign: "top", color: "#1f2937" }}>{children}</td>;
}

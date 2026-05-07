/**
 * 해외지사 화물 흐름도 — 통관 제외, SAP 없음.
 * 대신 PLM PO + SCM Hub PO + (이론상) SAP PO 등 PO 연동이 다층적.
 * 모두 TBD 상태로 정리만.
 */

export default function OverseasFlowPage() {
  const STAGES = [
    {
      key: "po-source",
      label: "1. PO 발행 (출처 다중)",
      source: "PLM PO / SCM Hub PO / (SAP PO?)",
      description:
        "해외지사용 PO 발행 채널이 다층적 — PLM에서 시작해 SCM Hub로 전달되는지, 별도 경로인지 확정 필요",
      status: "TBD",
    },
    {
      key: "crd",
      label: "2. CRD 입력",
      source: "Forwarder (E2E)",
      description: "수입 흐름과 공통 — 공급사가 입력",
      status: "TBD",
    },
    {
      key: "booking",
      label: "3. Booking 확정",
      source: "Forwarder (E2E)",
      description: "Vessel / POL / POD / ETD / ETA",
      status: "TBD",
    },
    {
      key: "loaded",
      label: "4. 출항",
      source: "SeaVantage",
      description: "POL ATD / 적재 완료",
      status: "TBD",
    },
    {
      key: "transit",
      label: "5. 운송 중",
      source: "SeaVantage",
      description: "선박 위치 / 환적 정보",
      status: "TBD",
    },
    {
      key: "arrival",
      label: "6. 도착",
      source: "SeaVantage",
      description: "POD ATA — 한국 통관 단계 없음 (해외지사 도착으로 종료)",
      status: "TBD",
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>해외지사 화물 흐름도</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        해외지사로 직접 출하되는 화물 — 한국 통관/UNI-PASS/ReadyKorea 단계 <strong>제외</strong>.
        SAP가 없는 환경이라 SAP 송신도 없음. PO 출처는 다층적 (PLM / SCM Hub).
      </p>

      <Banner>
        🚧 <strong>전부 TBD</strong> — PO 연동 채널부터 정리 필요
      </Banner>

      {/* PO 연동 매트릭스 */}
      <section style={section}>
        <h2 style={h2}>PO 연동 매트릭스 (정리 필요)</h2>
        <table style={tbl}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <Th>PO 출처</Th>
              <Th>국내 수입 화물</Th>
              <Th>해외지사 화물</Th>
              <Th>비고</Th>
            </tr>
          </thead>
          <tbody>
            <tr style={tr}>
              <Td>
                <strong>SAP PO</strong>
              </Td>
              <Td>
                ✅ Data Mart → SCM Hub → SAP
              </Td>
              <Td>
                <Tbd>해외지사에 SAP 없음 → 송신 X</Tbd>
              </Td>
              <Td>해외지사 = SAP-less 환경</Td>
            </tr>
            <tr style={tr}>
              <Td>
                <strong>SCM Hub PO</strong>
              </Td>
              <Td>
                <Tbd>국내도 SCM Hub PO 사용 여부 TBD</Tbd>
              </Td>
              <Td>
                <Tbd>주 PO 채널 후보 1</Tbd>
              </Td>
              <Td>사내 사양 확인 필요</Td>
            </tr>
            <tr style={tr}>
              <Td>
                <strong>PLM PO</strong>
              </Td>
              <Td>
                <Tbd>병행 사용 가능성</Tbd>
              </Td>
              <Td>
                <Tbd>주 PO 채널 후보 2 — 우선 연동 대상</Tbd>
              </Td>
              <Td>해외지사 PO 발행 시작점일 가능성 큼</Td>
            </tr>
          </tbody>
        </table>
        <p style={{ ...p, marginTop: 12, color: "#374151" }}>
          → 위 3채널의 사용 시점/우선순위 정리 후 PLM PO 우선 연동 시작.
        </p>
      </section>

      <Section title="흐름 단계 (6단계 — 통관 제외)">
        <div style={{ display: "grid", gap: 8 }}>
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              style={{
                display: "grid",
                gridTemplateColumns: "30px 1fr 240px 100px",
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
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "right" }}>
                {s.status}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="국내 흐름과의 차이">
        <ul style={list}>
          <li>
            ❌ <strong>UNI-PASS 통관</strong> — 한국 입항 안 함
          </li>
          <li>
            ❌ <strong>ReadyKorea 관세사 입력</strong> — 한국 관세사 작업 없음
          </li>
          <li>
            ❌ <strong>SAP 송신</strong> — 해외지사에 SAP 없음
          </li>
          <li>
            ❌ <strong>Data Mart → SCM Hub → SAP</strong> 라인 — 해당 사항 없음
          </li>
          <li>
            ✅ <strong>Forwarder + SeaVantage</strong>는 동일하게 사용
          </li>
          <li>
            ❓ <strong>해외지사 자체 ERP/시스템</strong>이 있다면 그쪽으로 송신 필요할 수도 (TBD)
          </li>
        </ul>
      </Section>

      <Section title="다음 액션 (확인 필요)">
        <ol style={list}>
          <li>해외지사 화물 비중 — 전체 중 몇 %?</li>
          <li>현재 PO 발행 흐름 — PLM/SCM Hub 중 무엇이 출발점?</li>
          <li>해외지사 도착 후 데이터를 받아서 무엇을 해야 하나? (ERP 송신? 보고서? 두 곳?)</li>
          <li>PLM PO API 사양 (사내 시스템) 확인</li>
        </ol>
      </Section>
    </div>
  );
}

function Tbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        background: "#fef3c7",
        color: "#92400e",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
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

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

      {/* 배경 / 운영 컨텍스트 */}
      <section
        style={{
          ...section,
          background: "#f9fafb",
          border: "1px solid #d1d5db",
        }}
      >
        <h2 style={h2}>📍 배경 — 해외지사 FOB 운영 현황</h2>
        <ul style={{ ...list, fontSize: 12.5 }}>
          <li>
            무신사 협력 <strong>벤더 80+</strong>, <strong>공장 100+</strong> — 모든 곳을 직접
            컨트롤 불가
          </li>
          <li>
            중국·JV 같은 대규모는 자체 인력으로 관리 가능. 소규모 해외지사(일본/대만/베트남 등)는
            <strong> 무역조직(한국)이 생산직 관리를 대신</strong> 해줘야 함
          </li>
          <li>
            소규모 해외지사들은 <strong>FOB 거래</strong>를 원하는데, 직접 소싱·콘솔리데이션
            관리가 어려워 무역조직 의존
          </li>
          <li>
            운영 흐름: 베트남 등 출하지에서 화물 콘솔리데이션 → Forwarder와 비용 정산 →{" "}
            <strong>삼국거래</strong>(한국 무신사 ↔ 일본/대만 무신사) 일회성 결제 → 출하
          </li>
          <li>
            이 hub에서 해외지사용 화물에 해줄 수 있는 것 ={" "}
            <strong>화물 흐름의 가시화</strong> (PO/원가 회계는 SAP 부재로 불가)
          </li>
        </ul>
      </section>

      {/* 시스템 한계 */}
      <section
        style={{
          ...section,
          background: "#fef2f2",
          border: "1px solid #fecaca",
        }}
      >
        <h2 style={{ ...h2, color: "#991b1b" }}>🚧 시스템 한계 (현재 환경)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 8, fontSize: 12.5 }}>
          {[
            ["SAP MM", "❌ 사용 안 함 (전사 결정). 해외법인은 더더욱 SAP 자체가 없음"],
            [
              "PLM PO",
              "⚠️ 가정 단계 — PLM에서 오더가 올라온다는 합의/보장이 아직 없음. 본 것도 Mootan 일부 케이스",
            ],
            ["PLM PO ≠ SAP MM", "PLM PO는 PMM을 대체할 수 없음. 매입 추적/원가 회계 기능 부재"],
            ["일본 / 대만", "SAP 자체를 안 씀 → 해외법인 매입의 화물 추적 외 전산화 불가"],
            [
              "Mootan 외 매입",
              "Mootan 외의 일반 매입은 PLM에도 안 올라올 가능성 높음 — 추적 사각지대",
            ],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: "contents" }}>
              <div style={{ color: "#991b1b", fontWeight: 600, padding: "4px 0" }}>{k}</div>
              <div style={{ color: "#7f1d1d", padding: "4px 0" }}>{v}</div>
            </div>
          ))}
        </div>
        <p style={{ ...p, marginTop: 10, color: "#7f1d1d" }}>
          ⇒ 우리가 정직하게 할 수 있는 것은{" "}
          <strong>Forwarder + Shipment Tracking 기반 화물 흐름 가시화</strong>까지. PO 단위 통합/원가는
          시스템 환경이 갖춰지기 전엔 불가.
        </p>
      </section>

      {/* 가능한 범위 */}
      <section
        style={{
          ...section,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
        }}
      >
        <h2 style={{ ...h2, color: "#166534" }}>✅ 이 hub에서 가능한 것</h2>
        <ul style={list}>
          <li>
            <strong>FOB 콘솔리데이션 가시화</strong> — 베트남 등 출하지에서 화물 모이는 과정 추적
            (Forwarder PF)
          </li>
          <li>
            <strong>운송 중 추적</strong> — Shipment Tracking (SeaVantage)으로 출항 → 도착까지
            동일하게 사용
          </li>
          <li>
            <strong>도착 후 상태</strong> — 해외지사 도착 시점 가시화 (한국 통관 단계는 적용 안 됨)
          </li>
          <li>
            <strong>Forwarder 운임 수집</strong> — 비용 정산 자료로 활용 (SAP에 부킹 못 해도 보고서 가능)
          </li>
          <li>
            <strong>삼국거래 결제 추적</strong> (선택) — 일회성 결제 이벤트만 별도 기록
          </li>
        </ul>
      </section>

      {/* PO 연동 매트릭스 */}
      <section style={section}>
        <h2 style={h2}>PO 연동 매트릭스 (현실 반영)</h2>
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
                <strong>SCM Hub PO</strong>
              </Td>
              <Td>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 6px",
                    background: "#dcfce7",
                    color: "#166534",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ✅ 1순위 / 단일화
                </span>{" "}
                — 2026년 SCM Hub PO 단일화 목표. 우리 hub의 진실 source
              </Td>
              <Td>
                ❌ 해외지사 환경엔 SCM Hub 적용 X (현재)
              </Td>
              <Td>국내 데이터 모음의 종착지가 SCM Hub</Td>
            </tr>
            <tr style={tr}>
              <Td>
                <strong>SAP PO / SAP MM</strong>
              </Td>
              <Td>
                SCM Hub가 SAP에 push (start-point quantity 등). 우리는 직접 X.{" "}
                <strong>SAP MM은 전사적으로 미사용</strong>
              </Td>
              <Td>
                ❌ 해외법인은 SAP 자체 부재 (일본/대만 등). 매입 전산화 경로 없음
              </Td>
              <Td>SAP 단 가공(finance)은 SAP+개발사 책임</Td>
            </tr>
            <tr style={tr}>
              <Td>
                <strong>PLM PO</strong>
              </Td>
              <Td>
                <Tbd>국내 사용 여부 TBD</Tbd>
              </Td>
              <Td>
                <Tbd>가정 단계 — Mootan 일부만 PLM에 올라감. SAP MM 대체 불가</Tbd>
              </Td>
              <Td>전사적으로 PLM 오더 올라온다는 합의 미확정</Td>
            </tr>
            <tr style={tr}>
              <Td>
                <strong>실질적 진실 source</strong>
              </Td>
              <Td>SCM Hub PO + SAP (SCM Hub 경유)</Td>
              <Td>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 6px",
                    background: "#fef3c7",
                    color: "#92400e",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  🟡 Forwarder PF
                </span>{" "}
                — 출하 정보가 가장 먼저 잡히는 곳. PO 부재로 Forwarder 입력값을 임시 ID로 사용
              </Td>
              <Td>현실적 작업 단위는 Forwarder Booking 기준</Td>
            </tr>
          </tbody>
        </table>
        <p style={{ ...p, marginTop: 12, color: "#374151" }}>
          → <strong>국내</strong>: SCM Hub PO 단일화 → SCM Hub가 SAP로 송신.{" "}
          <strong>해외지사</strong>: PO 진실 source 부재 → Forwarder Booking을 임시 키로 사용,
          화물 흐름·운임 가시화에 집중.
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
            ❌ <strong>SAP 적재</strong> — 해외지사에 SAP 없음 (SCM Hub→SAP 라인 미적용)
          </li>
          <li>
            ❌ <strong>SCM Hub PO 단일화</strong> — 국내 전제. 해외지사는 PLM PO 우선
          </li>
          <li>
            ✅ <strong>Forwarder + SeaVantage</strong>는 동일하게 사용
          </li>
          <li>
            ❓ <strong>해외지사 자체 시스템 / 송신처</strong> — 도착 후 어디로 데이터 넘기는지 TBD
          </li>
        </ul>
      </Section>

      <Section title="다음 액션 (현실 반영 우선순위)">
        <ol style={list}>
          <li>
            <strong>1순위</strong>: Forwarder PF 연동으로 FOB 콘솔리데이션 가시화 → 해외지사
            담당자가 출하 진행 상황을 실시간 확인
          </li>
          <li>
            <strong>2순위</strong>: SeaVantage로 출항·운송·도착 추적 (국내와 동일)
          </li>
          <li>
            <strong>3순위</strong>: Forwarder 운임 데이터 수집 — 비용 정산 보고서 (SAP 미연동
            상태로도 엑셀/CSV로 활용)
          </li>
          <li>
            <strong>4순위 (선택)</strong>: 삼국거래 결제 이벤트 별도 기록
          </li>
          <li>
            <strong>대기</strong>: PLM PO 합의 진행 상황 모니터 — 가정이 아닌 합의로 굳어지면
            그때 PO 키 매핑 추가
          </li>
        </ol>
        <p
          style={{
            ...p,
            marginTop: 10,
            color: "#374151",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            padding: "8px 10px",
            borderRadius: 6,
          }}
        >
          💡 해외지사 운영의 핵심 가치는 "PO 통합"이 아니라 "
          <strong>화물·운임 가시성 + 정산 자료</strong>". SAP/PLM 가정에 매이지 말고 실현 가능한 것부터.
        </p>
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

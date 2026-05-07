/**
 * 데이터 모음 — 외부 5개 채널에서 수집한 데이터를 사내 SCM Hub로 송신할
 * 정제 형태로 정리하는 곳. 전산이 보는 "숨은 메인" 화면.
 *
 * 종착지는 SCM Hub. SAP는 SCM Hub가 책임. 이 hub는 SAP에 직접 push 안 함.
 */

export default function DataMartPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, fontFamily: "system-ui, sans-serif" }}>
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
        ★ MAIN (숨은 기능) — 전산 SCM Hub 송신용 데이터 정리
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>데이터 모음</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        External Channels 5곳(Customs / Shipment / ReadyKorea / Forwarder / Airplane)에서 수집된
        데이터를 PO/BL 단위로 통합·정제. <strong>종착지는 사내 SCM Hub</strong>. SAP는 SCM Hub
        측이 책임지므로 이 hub는 SAP에 직접 송신하지 않음.
      </p>

      <Banner>
        🚧 <strong>TBD</strong> — SCM Hub가 받을 필드 스키마(SHIF) 확정 후 본격 구현
      </Banner>

      <Section title="역할 정의 (정정 — SCM Hub 단일화 전제)">
        <Table
          rows={[
            ["사용자", "전산 (자동 cron) — 사람이 매일 보지 않음"],
            ["입력", "External Channels 5개 모듈 + 운영 입력 (PO/CRD/통관/문서)"],
            ["출력", "송신 큐 → 사내 SCM Hub로 push (또는 Hub가 pull)"],
            ["주기", "TBD — cron / 변경 이벤트 기반"],
            [
              "종착지",
              <>
                <strong>사내 SCM Hub</strong> (OCMP AWS, 사내망). SAP·WMS·재고 모두 SCM Hub가
                통합 관리.
              </>,
            ],
          ]}
        />
      </Section>

      <Section title="우리가 송신할 데이터 (2가지 카테고리)">
        <p style={p}>
          <strong>① 운영 데이터</strong> (PO 진행 추적용) +{" "}
          <strong>② 원가/Finance 데이터</strong> (실제 가격·세액·운임 — SAP 파이낸스 모듈 직결)
        </p>

        <h3 style={h3}>① 운영 데이터 — PO 진행/상태</h3>
        <Table
          rows={[
            ["PO 식별", "PO# / SKU# / Color / Size — Forwarder PF 기준 (또는 SCM Hub PO와 매칭)"],
            ["CRD", "Cargo Ready Date / 수량 / CBM / 중량 / 포장 — Forwarder"],
            ["Booking", "Vessel / Voyage / POL / POD / ETD / ETA — Forwarder + SeaVantage"],
            ["BL", "MBL / HBL / Carrier code — Forwarder Booking Confirmation"],
            ["통관 진행", "화물관리번호 / 진행상태 / 통관진행상태 / 입항일 — UNI-PASS"],
            ["관세사 진행", "신고번호 / 진행 단계 / 메모 — ReadyKorea"],
            ["문서", "INV / PKG / Export Decl URL 또는 binary — Forwarder"],
          ]}
        />

        <h3 style={{ ...h3, marginTop: 18 }}>
          🆕 ② 원가 / Finance 데이터 — 실제 가격 (SAP 파이낸스 모듈로 직결)
        </h3>
        <p style={p}>
          국내 수입 화물의 진짜 원가는{" "}
          <strong>운송료(Forwarder) + 신고가격·세액(ReadyKorea)</strong>이 합쳐져야 결정됨.
          이 데이터가 SAP 부킹 + 원가회계에 반영.
        </p>
        <Table
          rows={[
            [
              "운임 — BL 단위",
              "해상운임 / BAF / CAF / EBS / LSS / CFS / THC / 부대비 등 항목별",
            ],
            ["운임 — Container 분배", "여러 PO가 한 컨테이너 시 CBM/중량 비율 안분"],
            ["거래 조건", "FOB / CIF / DDP / DAP — 청구 항목 구성 결정"],
            ["Forwarder Invoice", "INV 번호 / 발행일 / 결제조건 / 통화 / 환율"],
            [
              "신고 가격 (라인별)",
              "PO/SKU 라인별 단가 / 수량 / USD / 환율 / KRW — ReadyKorea",
            ],
            ["세액", "관세 / 부가세 / 기타 (라인별 분리) — ReadyKorea"],
            ["HS code / FTA", "라인별 HS / 협정세율 적용 여부 — ReadyKorea"],
            ["원가 매칭", "공급사 INV vs Forwarder INV 차이 검증 — 케이스 대응"],
          ]}
        />
        <p style={{ ...p, marginTop: 10, color: "#374151" }}>
          → 이 두 카테고리가 합쳐서 SCM Hub로 송신 → SCM Hub가 SAP에 부킹.{" "}
          <strong>해외법인 화물</strong>은 현재 PO 채널 미정으로 별도 논의 (이 매트릭스 적용 보류).
        </p>

        <p style={{ ...p, marginTop: 8, color: "#6b7280", fontSize: 12 }}>
          ※ <strong>SCM Hub가 들고 있는 것 (우리 영역 밖)</strong>: SAP PO / WMS 입출고 / 재고 /
          최종 원가회계·finance 가공 — 이쪽 데이터는 SCM Hub와 join할 키만 맞춰주면 됨.
        </p>
      </Section>

      <Section title="흐름 (정정된 아키텍처)">
        <pre style={code}>
{`korea-import-hub (Vercel · 공용 인터넷)
  └─ External Channels 5개 + 운영 입력
        │
        │ 정제 → 송신 큐
        ▼
   Supabase (이 hub의 DB)
        │
        │ (사내 SCM Hub가 pull 또는 우리가 push)
        ▼
사내 SCM Hub (OCMP, 사내망)  ◀── 여기에 SAP PO + WMS + 재고 + 우리 데이터 모두 모임
        │
        │  start-point quantity 등 핵심만
        ▼
      SAP CPI ──▶ SAP
                  └─ Finance · 원가 회계는 SAP 단에서 키워나감
                     (시스템 개발사가 SAP→Finance 마지막 정리 담당)`}
        </pre>
      </Section>

      <Section title="송신 큐 (예정)">
        <Table
          rows={[
            ["pending", "수집은 됐으나 SCM Hub 송신 전 — 누락 필드 있으면 여기 보임"],
            ["ready", "필드 다 채워짐, 다음 송신 사이클에 push"],
            ["sent", "SCM Hub 송신 완료 (ack 미수신)"],
            ["acked", "SCM Hub가 정상 적재 ack"],
            ["failed", "송신/적재 실패 — 에러 reason 기록"],
          ]}
        />
      </Section>

      <Section title="다음 액션">
        <ol style={list}>
          <li>SCM Hub가 받을 SHIF 인터페이스 정의서 확보 → 우리 영역 필드 매핑 spec</li>
          <li>SCM Hub PO와 우리 PO 키 매칭 전략 (PO# 기준? 별도 mapping 테이블?)</li>
          <li>send queue 테이블 설계 (data_mart_send_queue + data_mart_send_log)</li>
          <li>매핑 완료/누락 표시 UI (이 페이지의 진짜 메인)</li>
          <li>SCM Hub와 합의 — push 방식 / pull 방식 / 둘 다</li>
        </ol>
      </Section>
    </div>
  );
}

const p: React.CSSProperties = { fontSize: 13, lineHeight: 1.7, color: "#374151", margin: 0 };
const h3: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: "#374151",
  margin: "10px 0 8px",
  paddingBottom: 4,
  borderBottom: "1px solid #f3f4f6",
};
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

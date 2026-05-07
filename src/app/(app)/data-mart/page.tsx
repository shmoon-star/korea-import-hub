/**
 * 데이터 모음 — 외부 5개 채널에서 수집한 데이터를 SAP/SCM Hub로 송신할
 * 정제 형태로 정리하는 곳. 전산이 보는 "숨은 메인" 화면.
 *
 * 현재 placeholder — 송신 대상 필드/스키마 합의 후 본격 구현.
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
        ★ MAIN (숨은 기능) — 전산 SAP/SCM Hub 전송용 데이터 정리
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>데이터 모음</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        External Channels 5곳(Customs/Shipment/ReadyKorea/Forwarder/Airplane)에서 수집된 데이터를
        BL/PO 단위로 통합·정제. 사내 SCM Hub 또는 SAP CPI로 송신할 최종 형태.
      </p>

      <Banner>
        🚧 <strong>TBD</strong> — SAP/SCM Hub가 받을 필드 스키마 확정 후 구현
      </Banner>

      <Section title="역할 정의">
        <Table
          rows={[
            ["사용자", "전산 (자동 cron) — 사람이 매일 보지 않음"],
            ["입력", "External Channels 5개 모듈의 watch 테이블"],
            ["출력", "송신 큐 (sent / pending / failed) + SCM Hub로 push"],
            ["주기", "TBD — cron 30분 / 1시간 / 변경 이벤트 기반"],
            ["연결", "Hub(공용 인터넷) → Supabase ← 사내 SCM Hub(OCMP, pull) → CPI → SAP"],
          ]}
        />
      </Section>

      <Section title="송신 대상 데이터 (가설)">
        <p style={p}>
          채널별로 어느 필드를 골라 SAP가 받을 단일 schema로 합치는지 합의 필요. 1차 가설:
        </p>
        <Table
          rows={[
            ["PO 식별", "PO# / SKU# / Color / Size — Forwarder PF 기준"],
            ["CRD", "Cargo Ready Date / 수량 / CBM / 중량 — Forwarder"],
            ["Booking", "Vessel / Voyage / POL / POD / ETD / ETA — Forwarder + SeaVantage"],
            ["BL", "MBL / HBL / Carrier code — Forwarder Booking Confirmation"],
            ["통관", "화물관리번호 / 진행상태 / 통관진행상태 / 입항일 — UNI-PASS"],
            ["관세사 입력", "신고번호 / 세액 / 메모 — ReadyKorea (TBD)"],
            ["문서", "INV / PKG / Export Decl URL 또는 binary — Forwarder"],
          ]}
        />
      </Section>

      <Section title="송신 큐 (예정)">
        <Table
          rows={[
            ["pending", "수집은 됐으나 SAP 송신 전 — 누락 필드 있으면 여기 보임"],
            ["ready", "필드 다 채워짐, 다음 송신 사이클에 push"],
            ["sent", "SCM Hub 송신 완료 (ack 미수신)"],
            ["acked", "사내 SCM Hub가 SAP에 정상 적재 ack"],
            ["failed", "송신/적재 실패 — 에러 reason 기록"],
          ]}
        />
      </Section>

      <Section title="다음 액션">
        <ol style={list}>
          <li>SAP/SCM Hub 측 SHIF 인터페이스 정의서에서 받을 필드 확정</li>
          <li>각 External Channel watch 테이블의 어느 컬럼이 어느 SAP 필드로 매핑되는지 spec</li>
          <li>send queue 테이블 설계 (data_mart_send_queue + data_mart_send_log)</li>
          <li>매핑 완료/누락 표시 UI (이 페이지의 진짜 메인)</li>
          <li>cron route — 사내 SCM Hub가 pull하는 endpoint 또는 우리가 push</li>
        </ol>
      </Section>
    </div>
  );
}

const p: React.CSSProperties = { fontSize: 13, lineHeight: 1.7, color: "#374151", margin: 0 };
const list: React.CSSProperties = {
  paddingLeft: 20,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#374151",
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

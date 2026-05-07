/**
 * Consolidator + Forwarder PF (E2E Logistics PO Management) 연동 — placeholder.
 *
 * 출처: "PO Management PF Supplier User Guide v.3.pdf" 분석.
 * 100+ 공급사가 직접 사용하는 CRD 입력 플랫폼. 우리 화물 흐름 중 가장 앞단.
 */

export default function ForwarderPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Forwarder · Consolidator (E2E Logistics PO Management PF)
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        100+ 공급사가 직접 CRD/문서를 입력하는 콘솔리데이터+포워더 통합 플랫폼. 우리 화물 흐름의
        가장 앞단 — 여기 데이터가 입항 후 UNI-PASS → ReadyKorea → SAP로 흐름.
      </p>

      <Banner>
        🚧 <strong>연동 준비 중</strong> — E2E 측 API/EDI 사양 확보 후 본격 구현
      </Banner>

      <Section title="이 시스템이 무엇인가 (PDF 분석)">
        <p style={p}>
          E2E Logistics가 운영하는 <strong>Supplier 전용 PO Management 플랫폼</strong>. 각 공급사가
          로그인해서 PO/SKU/Color/Size 단위로 출하 정보를 직접 입력. <strong>CRD 모듈</strong>이
          핵심 (Cargo Ready Date — 화물 준비일).
        </p>
        <Table
          rows={[
            ["사용자", "공급사 (Supplier) — 100+ 공장의 담당자가 직접 입력"],
            ["계정 발급", "공급사 리스트 제공 → E2E가 ID/PW 생성·전달"],
            ["주요 모듈", "PO Management → CRD"],
            ["입력 단위", "PO# / SKU# / Color / Size 조합 (1 row = 1 SKU)"],
            ["입력 방식", "수동 입력 (5건 이하) 또는 Excel Batch Upload (5건 이상 권장)"],
          ]}
        />
      </Section>

      <Section title="공급사가 입력하는 필드 (CRD 모듈)">
        <Table
          rows={[
            ["PCS Quantity *", "수량 (pieces 수)"],
            ["Production Start Date *", "생산 시작일"],
            ["Cargo Ready Date *", "화물 준비 완료 예정일 — 핵심 필드"],
            ["Number of Packages *", "총 포장 개수"],
            ["Package Unit *", "포장 단위 (box, pallet 등)"],
            ["CBM *", "부피 (m³)"],
            ["Weight *", "총 중량"],
            ["Supplier Comment", "(선택) 공급사 메모"],
          ]}
        />
        <p style={{ ...p, marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          * 표시 = 필수 7개 + 선택 1개
        </p>
      </Section>

      <Section title="CRD 라이프사이클">
        <ol style={list}>
          <li>
            공급사 입력 → <strong>CRD 노란색</strong> (편집 가능) → <strong>Save</strong>
          </li>
          <li>
            <strong>CRD Confirm</strong> 클릭 → 상태 확정 → 자동 알림 메일 발송{" "}
            <code>[Musinsa / E2E Origin / E2E HQ / Vendor]</code>
          </li>
          <li>
            출항 <strong>10일 전</strong> Booking Confirmation 자동 발송 (스케줄 + CFS/CY 정보, 첨부)
          </li>
          <li>
            Shipping Window 7일 전까지 미확정 시 → 리마인더 메일 자동 발송
          </li>
          <li>
            CRD가 <strong>Container Load Plan(CLP)</strong>에 들어가면 → CLP 필드 녹색, 직접 수정 불가
            → E2E에 release 요청 필요
          </li>
        </ol>
      </Section>

      <Section title="업로드 가능한 문서 (Shipping Document)">
        <ul style={list}>
          <li>INV (Commercial Invoice)</li>
          <li>PKG (Packing List)</li>
          <li>Export Declaration / Export Customs Clearance</li>
          <li>FTA CO (Certificate of Origin)</li>
          <li>CI / PL</li>
          <li>PO</li>
        </ul>
        <p style={{ ...p, marginTop: 8, color: "#374151" }}>
          → 입력된 문서는 이메일 없이 시스템에서 직접 다운로드 가능. 우리가 당겨오면 SAP/UNI-PASS
          연동 시 첨부 자동화 가능.
        </p>
      </Section>

      <Section title="Export Clearance 정보">
        <p style={p}>
          공급사는 CRD 외에도 <strong>Export Clearance Date</strong>를 별도 입력 →{" "}
          <strong>Confirm Export date</strong> 버튼 클릭. 해당 단계에서 수출 통관 관련 문서 일괄
          업로드.
        </p>
      </Section>

      <Section title="우리가 당겨와야 할 데이터 (가설)">
        <Table
          rows={[
            ["CRD 정보", "PO/SKU별 CRD/생산일/수량/CBM/중량/포장 — 입항 전 ETA 산정 핵심"],
            ["Booking Confirmation", "Vessel/CFS/CY/POL/POD/ETA 추정 — SeaVantage와 cross-check"],
            ["Export Clearance Date", "수출 통관 완료 시점 — UNI-PASS 입항 ETA 역산 가능"],
            ["Shipping Documents", "INV/PKG/CO/Export Declaration — SAP 첨부 자동화"],
            ["CRD/CLP 상태", "Yellow/Green/Confirm 등 진행 단계 — 워치리스트화"],
          ]}
        />
      </Section>

      <Section title="E2E에 문의해서 받아야 할 정보 (체크리스트)">
        <Checklist
          items={[
            "API 제공 여부 — REST/SOAP/EDI 중 무엇? 또는 SFTP CSV?",
            "인증 방식 (API Key / Basic / 인증서 / OAuth)",
            "PO 단위 조회 시 받을 수 있는 응답 schema (CRD/Booking/Documents 통합 또는 분리?)",
            "Booking Confirmation을 API로 받을 수 있나? (현재는 이메일 첨부 PDF로 수동 전달)",
            "공급사 업로드 문서 (INV/PKG 등)를 binary로 다운로드 가능한가? URL 형태? signed-url?",
            "Webhook / Push 지원 — CRD Confirm 이벤트 등 push 받을 수 있는지",
            "동일 PO에 split shipment 발생 시 식별 방법 (PO# + line + split seq?)",
            "테스트 환경(Sandbox) 발급 가능 여부",
            "Rate limit / 호출 한도",
            "데이터 retention — 과거 PO 얼마나 오래 조회 가능?",
            "공급사 PII 포함 여부 + 데이터 처리방침",
          ]}
        />
      </Section>

      <Section title="DB / 라우트 가설">
        <ul style={list}>
          <li>
            <strong>라우트</strong>: <code>/tools/forwarder</code> (현재 페이지)
          </li>
          <li>
            <strong>DB 테이블 가설</strong>: <code>forwarder_po</code> (PO 헤더) +{" "}
            <code>forwarder_po_line</code> (SKU 단위 CRD 정보) +{" "}
            <code>forwarder_po_document</code> (업로드 문서 메타) +{" "}
            <code>forwarder_po_snapshot</code> (상태 변화 이력)
          </li>
          <li>
            <strong>다른 모듈과의 연결</strong>: PO# 기준으로 ReadyKorea/UNI-PASS와 join. MBL/HBL은
            booking confirmation 단계에서 발급되므로 그 시점에 매핑.
          </li>
        </ul>
      </Section>

      <Section title="다음 액션">
        <ol style={list}>
          <li>E2E 담당자에게 위 체크리스트 11개 답변 요청</li>
          <li>API 사양 받으면 forwarder_po 테이블 + lib/forwarder.ts 구현</li>
          <li>UI: PO 리스트 / 상세(SKU별 CRD) / 문서 다운로드 / Booking 정보</li>
          <li>UNI-PASS, ReadyKorea, SeaVantage와 PO# 기준 통합 타임라인 (선택)</li>
        </ol>
      </Section>

      <Section title="영상(crd-user-guide-video_.mp4) 메모">
        <p style={p}>
          PDF와 같은 화면을 영상으로 시연하는 가이드일 가능성이 높습니다. 동영상은 직접 분석할
          수 없어서, PDF와 다른 내용(예: 특정 화면 동작, API 콜 시연 등)이 있으면 알려주세요.
          기능적 추가 사항이 있으면 위 가설에 반영하겠습니다.
        </p>
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
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 8, fontSize: 12.5 }}>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: "contents" }}>
          <div style={{ color: "#6b7280", fontWeight: 600, padding: "4px 0" }}>{k}</div>
          <div style={{ color: "#1f2937", padding: "4px 0" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
      {items.map((it, i) => (
        <li
          key={i}
          style={{
            padding: "4px 0",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 13,
            color: "#374151",
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: "#9ca3af" }}>☐</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

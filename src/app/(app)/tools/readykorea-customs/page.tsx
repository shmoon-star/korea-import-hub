/**
 * ReadyKorea xTrade 연동 — 계획 / placeholder 페이지.
 *
 * 현재는 연동 정보 미확보 상태라 페이지 자체는 비활성. 연동 계획과
 * 다음 액션을 노출해서 SaaS 담당자한테 받을 정보를 명확히 함.
 */

export default function ReadyKoreaCustomsPage() {
  return (
    <div style={{ padding: 24, maxWidth: 960, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        ReadyKorea 통관 (xTrade)
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        관세사가 입력하는 통관 행정 정보를 BL 단위로 받아서 UNI-PASS 데이터와 보완 표시.
        현재 연동 정보 미확보 상태 — 아래 정보 받은 후 활성화 예정.
      </p>

      <Banner>
        🚧 <strong>연동 준비 중</strong> — ReadyKorea / WiseTech Global 측 API 사양과 계정 발급 후 본격 구현
      </Banner>

      <Section title="기획 의도">
        <ul style={listStyle}>
          <li>
            <strong>UNI-PASS</strong>: 관세청 공식 데이터, 단 입항/수입신고 후에야 잡힘 (사후성)
          </li>
          <li>
            <strong>SeaVantage</strong>: 운송 중 화물의 선박 위치/항구 일정 (사전성, 입항 전까지 유효)
          </li>
          <li>
            <strong>ReadyKorea xTrade</strong>: 관세사가 운영 중 입력하는 통관 진행 — UNI-PASS보다 빠른
            정보 + 관세사 메모/보정 + 입항 전 사전 신고 데이터까지 추정 가능
          </li>
        </ul>
        <p style={{ marginTop: 8, color: "#374151" }}>
          → 같은 BL을 세 출처로 보완 (운송중 → 통관행정 → 관세청 확정)
        </p>
      </Section>

      <Section title="공개 페이지 분석 결과 (readykorea.co.kr/document/product/xtrade)">
        <Table
          rows={[
            ["서비스 정의", "수출입 업무 전반을 처리하는 전사적 무역관리 시스템 (WiseTech Global 자회사)"],
            ["핵심 키워드", "DATA INTERFACE ENGINE / 표준 전자문서(EDI/XML) 기본 탑재 / ERP 연계"],
            ["API 사양", "❌ REST/SOAP 등 구체적 사양은 공개 페이지에 명시 없음"],
            ["요금", "❌ 페이지에 명시 없음 — 영업 문의 필요"],
            ["개발 문서", "❌ 공개된 가이드 링크 없음"],
            ["UNI-PASS 비교", "❌ 페이지에 언급 없음"],
            [
              "연락처",
              <>
                전화 <strong>02-3466-5000</strong> · Fax 02-6455-5075 · 이메일{" "}
                <a
                  href="mailto:RKO-Registration@wisetechglobal.com"
                  style={{ color: "#2563eb" }}
                >
                  RKO-Registration@wisetechglobal.com
                </a>
              </>,
            ],
          ]}
        />
      </Section>

      <Section title="ReadyKorea에 문의해서 받아야 할 정보 (체크리스트)">
        <Checklist
          items={[
            "API 연동 가능 여부 (REST? SOAP? EDI?) — 또는 파일 다운로드 방식인지",
            "인증 방식 (API Key / OAuth / Basic / 인증서 등)",
            "BL 단위 조회 시 받을 수 있는 필드 목록 (가능하면 샘플 응답)",
            "관세사 입력 vs 자동 수집 항목 구분",
            "UNI-PASS 항목과 어디까지 겹치고 어디서 차별화되는지 (입항 전 데이터 유무)",
            "조회 시점 — 관세사 입력 직후 즉시 / 일배치 / 실시간",
            "Webhook / Push 지원 여부 (없으면 우리가 cron 폴링)",
            "Trial/PoC 계정 발급 가능 여부 + 발급 절차",
            "월 호출 한도 / Rate limit",
            "요금제 (건당 / 월정액 / 화물수 기준)",
            "데이터 보안 / 개인정보 처리방침 (수출입자명·송하인 등 PII 포함될 가능성)",
          ]}
        />
      </Section>

      <Section title="우리가 미리 정해둘 사항">
        <ul style={listStyle}>
          <li>
            <strong>라우트</strong>: <code>/tools/readykorea-customs</code> (현재 이 페이지)
          </li>
          <li>
            <strong>DB 테이블 가설</strong>: <code>readykorea_customs_watch</code> +{" "}
            <code>readykorea_customs_watch_snapshot</code> — UNI-PASS와 동일 패턴
          </li>
          <li>
            <strong>UNI-PASS와의 키 매핑</strong>: MBL/HBL/화물관리번호 중 무엇이 ReadyKorea에서 unique 키인지에
            따라 join 전략 결정
          </li>
          <li>
            <strong>UI</strong>: 현재 Customs Tracking과 같은 형태 — 즉시조회 + Watchlist + 이력
          </li>
        </ul>
      </Section>

      <Section title="다음 액션 (이 순서)">
        <ol style={listStyle}>
          <li>
            ReadyKorea 영업/기술 담당에게{" "}
            <a href="mailto:RKO-Registration@wisetechglobal.com" style={{ color: "#2563eb" }}>
              RKO-Registration@wisetechglobal.com
            </a>{" "}
            로 위 체크리스트 보내고 회신 받기
          </li>
          <li>API 사양 확보되면 — UNI-PASS Watchlist 코드 그대로 복제해서 모듈화 (작업량: 30분)</li>
          <li>Trial 키 받으면 Vercel env에 추가 + 첫 BL 조회 시도</li>
          <li>UNI-PASS와 응답 필드 비교 → 어떤 필드를 어느 화면에 둘지 결정</li>
          <li>
            (선택) 같은 BL이 UNI-PASS / ReadyKorea / SeaVantage 모두에 등록돼 있으면 통합 타임라인 페이지 추가
          </li>
        </ol>
      </Section>
    </div>
  );
}

// ──────── styling helpers ────────
const listStyle: React.CSSProperties = {
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 24,
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

function Checklist({ items }: { items: string[] }) {
  return (
    <ul style={{ ...listStyle, listStyle: "none", paddingLeft: 0 }}>
      {items.map((it, i) => (
        <li
          key={i}
          style={{
            padding: "4px 0",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: "#9ca3af" }}>☐</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

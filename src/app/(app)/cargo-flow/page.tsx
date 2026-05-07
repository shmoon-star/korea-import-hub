"use client";

import { useState } from "react";

/**
 * 수입 화물 흐름도 — 실무자 메인 화면.
 * 9단계 가로 stepper. 클릭 시 해당 단계 상세 데이터 표시.
 */

type StageStatus = "done" | "active" | "pending" | "error";
type StageBadge =
  | "scmhub"
  | "forwarder"
  | "seavantage"
  | "unipass"
  | "readykorea"
  | "wms"
  | "external";

type Stage = {
  num: number;
  shortLabel: string; // 가로 stepper용 짧은 라벨
  label: string;
  source: string;
  sourceBadge: StageBadge;
  description: string;
  status: StageStatus;
  data?: { key: string; value: string }[];
  link?: { label: string; href: string };
};

const STAGE_DEFS: Omit<Stage, "status" | "data" | "link">[] = [
  {
    num: 1,
    shortLabel: "PO",
    label: "PO 발행",
    source: "SCM Hub PO",
    sourceBadge: "scmhub",
    description: "SCM Hub가 모든 PO를 단일화 (2026년 목표). 우리 hub의 PO 진실 source",
  },
  {
    num: 2,
    shortLabel: "CRD",
    label: "CRD 입력",
    source: "Forwarder (E2E)",
    sourceBadge: "forwarder",
    description: "공급사가 PO/SKU별 CRD/생산일/수량/CBM/중량 입력",
  },
  {
    num: 3,
    shortLabel: "Booking",
    label: "Booking 확정",
    source: "Forwarder (E2E)",
    sourceBadge: "forwarder",
    description: "MBL/HBL 발급 + Vessel/POL/POD/ETD/ETA + Booking Confirmation",
  },
  {
    num: 4,
    shortLabel: "출항",
    label: "출항 (Loaded)",
    source: "SeaVantage",
    sourceBadge: "seavantage",
    description: "POL ATD / Container 적재 완료 / Vessel departure",
  },
  {
    num: 5,
    shortLabel: "운송",
    label: "운송 중",
    source: "SeaVantage",
    sourceBadge: "seavantage",
    description: "선박 위치 추적 / 환적 (TSL/TSD) 정보 / ETA 갱신",
  },
  {
    num: 6,
    shortLabel: "입항",
    label: "입항",
    source: "SeaVantage + UNI-PASS",
    sourceBadge: "external",
    description: "POD ATA / 입항보고 — 한국 도착 시점부터 UNI-PASS 데이터 시작",
  },
  {
    num: 7,
    shortLabel: "통관",
    label: "수입신고 / 통관",
    source: "ReadyKorea + UNI-PASS",
    sourceBadge: "external",
    description: "관세사 신고 입력 (ReadyKorea) → 관세청 처리 (UNI-PASS)",
  },
  {
    num: 8,
    shortLabel: "반출",
    label: "통관완료 / 반출",
    source: "UNI-PASS",
    sourceBadge: "unipass",
    description: "수입신고수리 → 반출완료. cargMtNo 기준 추적",
  },
  {
    num: 9,
    shortLabel: "입고",
    label: "입고 완료",
    source: "WMS / SCM Hub",
    sourceBadge: "wms",
    description: "SCM Hub의 WMS 모듈에 입고 등록 완료 — 화물의 종착",
  },
];

// 시연용 가상 데이터
const EXAMPLE = {
  po: "PO-2026-FW-001234",
  mbl: "WDFCGBF32332212",
  hbl: "ELCKTAO26030088",
  carrier: "MAEU",
  brand: "FW26 KF001",
  qty: "1,200 PCS",
  cbm: "8.5",
  weight: "707.9 KG",
  stages: [
    {
      data: [
        { key: "PO No", value: "PO-2026-FW-001234" },
        { key: "발행일", value: "2026-03-15" },
        { key: "Brand/Season", value: "FW26 KF001" },
        { key: "총 SKU", value: "12 SKU" },
      ],
    },
    {
      data: [
        { key: "Cargo Ready Date", value: "2026-04-10" },
        { key: "수량", value: "1,200 PCS" },
        { key: "CBM", value: "8.5" },
        { key: "중량", value: "707.9 KG" },
        { key: "포장", value: "45 GT" },
      ],
      link: { label: "Forwarder", href: "/tools/forwarder" },
    },
    {
      data: [
        { key: "MBL", value: "WDFCGBF32332212" },
        { key: "HBL", value: "ELCKTAO26030088" },
        { key: "Carrier", value: "MAEU" },
        { key: "Vessel/Voyage", value: "NEWGOLDENBRIDGE 5 / 3233" },
        { key: "POL → POD", value: "Qingdao(CNTAO) → Incheon(KRINC)" },
        { key: "ETD / ETA", value: "2026-04-25 / 2026-05-08" },
      ],
      link: { label: "Forwarder", href: "/tools/forwarder" },
    },
    {
      data: [
        { key: "POL ATD", value: "2026-04-25 14:30" },
        { key: "Container", value: "KEIU9700066" },
        { key: "Vessel", value: "NEWGOLDENBRIDGE 5" },
      ],
      link: { label: "SeaVantage", href: "/tools/shipment-tracking" },
    },
    {
      data: [
        { key: "현재 위치", value: "동중국해 (lat 33.2, lng 124.1)" },
        { key: "ETA 갱신", value: "2026-05-08 → 2026-05-07 (1일 빠름)" },
        { key: "환적", value: "없음 (직항)" },
      ],
      link: { label: "SeaVantage", href: "/tools/shipment-tracking" },
    },
    {
      data: [
        { key: "POD ATA", value: "2026-05-07 09:15" },
        { key: "입항세관", value: "인천세관" },
        { key: "선박국적", value: "파나마 (PA)" },
      ],
      link: { label: "UNI-PASS", href: "/tools/customs-tracking" },
    },
    {
      data: [
        { key: "수입신고", value: "ReadyKorea 입력 중 (TBD)" },
        { key: "진행상태 (UNI-PASS)", value: "반출완료" },
        { key: "통관진행상태", value: "수입신고수리" },
        { key: "화물관리번호", value: "26WDFCF233I07050006" },
      ],
      link: { label: "UNI-PASS", href: "/tools/customs-tracking" },
    },
    { data: [{ key: "예상", value: "수리 후 24~48시간 내 반출" }] },
    { data: [{ key: "예상", value: "반출 후 1~2일 내 mwms-lite 입고" }] },
  ],
};

// 현재 진행 (active) 단계 — 0-indexed로 6 (즉 7번째)
const ACTIVE_INDEX = 6;
const STATUSES: StageStatus[] = STAGE_DEFS.map((_, i) =>
  i < ACTIVE_INDEX ? "done" : i === ACTIVE_INDEX ? "active" : "pending",
);

const BADGE_COLORS: Record<StageBadge, { bg: string; fg: string }> = {
  scmhub: { bg: "#fef3c7", fg: "#92400e" },
  forwarder: { bg: "#dbeafe", fg: "#1e40af" },
  seavantage: { bg: "#dcfce7", fg: "#166534" },
  unipass: { bg: "#fce7f3", fg: "#9f1239" },
  readykorea: { bg: "#f3e8ff", fg: "#6b21a8" },
  wms: { bg: "#e0e7ff", fg: "#3730a3" },
  external: { bg: "#f1f5f9", fg: "#334155" },
};

const STATUS_COLORS: Record<StageStatus, string> = {
  done: "#10b981",
  active: "#f59e0b",
  pending: "#d1d5db",
  error: "#ef4444",
};

export default function CargoFlowPage() {
  const [selectedIndex, setSelectedIndex] = useState<number>(ACTIVE_INDEX);
  const completedCount = STATUSES.filter((s) => s === "done").length;
  const sel = STAGE_DEFS[selectedIndex];
  const selData = EXAMPLE.stages[selectedIndex];
  const selStatus = STATUSES[selectedIndex];
  const selBadge = BADGE_COLORS[sel.sourceBadge];

  return (
    <div style={{ padding: 24, maxWidth: 1280, fontFamily: "system-ui, sans-serif" }}>
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
        ★ MAIN — 실무자 통합 화면 (가장 중요)
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>수입 화물 흐름도</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        한 PO/BL의 9단계를 외부 5개 채널 + WMS 데이터로 통합. 단계 클릭 시 해당 단계 데이터 표시.
      </p>

      {/* 화물 조회 */}
      <section style={section}>
        <h2 style={h2}>화물 조회</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
          <input placeholder="PO #" style={input} disabled />
          <input placeholder="MBL 번호" style={input} disabled />
          <input placeholder="HBL 번호" style={input} disabled />
          <button style={btn} disabled>
            조회
          </button>
        </div>
        <p style={{ ...p, marginTop: 8, fontSize: 11.5, color: "#9ca3af" }}>
          (실제 조회는 외부 채널 연동 완료 후. 아래는 시연용 예시)
        </p>
      </section>

      {/* ─── 예시: 압축된 헤더 + 가로 stepper + 선택된 단계 상세 ─── */}
      <section style={{ ...section, padding: 20 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#92400e",
            background: "#fef3c7",
            padding: "2px 8px",
            borderRadius: 4,
            display: "inline-block",
            marginBottom: 10,
          }}
        >
          EXAMPLE · 시연용 가상 데이터
        </div>

        {/* 한 줄 요약 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "baseline",
            paddingBottom: 12,
            marginBottom: 18,
            borderBottom: "1px solid #e5e7eb",
            fontSize: 12.5,
          }}
        >
          <strong style={{ fontSize: 15 }}>{EXAMPLE.po}</strong>
          <Pill>{EXAMPLE.brand}</Pill>
          <Sep label="MBL" value={EXAMPLE.mbl} />
          <Sep label="HBL" value={EXAMPLE.hbl} />
          <Sep label="Carrier" value={EXAMPLE.carrier} />
          <Sep label="수량" value={EXAMPLE.qty} />
          <Sep label="CBM" value={EXAMPLE.cbm} />
          <Sep label="중량" value={EXAMPLE.weight} />
          <span
            style={{
              marginLeft: "auto",
              fontWeight: 700,
              color: "#f59e0b",
              fontSize: 13,
            }}
          >
            {completedCount}/{STAGE_DEFS.length} 완료 · 7단계 진행 중
          </span>
        </div>

        {/* 가로 Stepper */}
        <Stepper selected={selectedIndex} onSelect={setSelectedIndex} />

        {/* 선택된 단계 상세 */}
        <div
          style={{
            marginTop: 22,
            padding: 14,
            background: "#fafbfc",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: STATUS_COLORS[selStatus],
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {selStatus === "done" ? "✓" : selStatus === "active" ? "●" : "○"}
            </span>
            <strong style={{ fontSize: 14 }}>
              {sel.num}. {sel.label}
            </strong>
            <span
              style={{
                padding: "2px 8px",
                background: selBadge.bg,
                color: selBadge.fg,
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 999,
              }}
            >
              {sel.source}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: STATUS_COLORS[selStatus],
                marginLeft: "auto",
              }}
            >
              {selStatus === "done" ? "완료" : selStatus === "active" ? "진행 중" : "대기"}
            </span>
          </div>

          <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 10, lineHeight: 1.5 }}>
            {sel.description}
          </div>

          {/* 데이터 키-값 */}
          {selData.data && selData.data.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 4,
                fontSize: 12,
                background: "white",
                padding: 10,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
              }}
            >
              {selData.data.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <span style={{ color: "#9ca3af", minWidth: 110 }}>{d.key}</span>
                  <span style={{ fontWeight: 500 }}>{d.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: "#9ca3af" }}>데이터 없음</div>
          )}

          {selData.link && (
            <a
              href={selData.link.href}
              style={{
                display: "inline-block",
                marginTop: 10,
                fontSize: 11.5,
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              → {selData.link.label} 페이지에서 자세히 보기
            </a>
          )}
        </div>
      </section>

      {/* 흐름 단계 일반 설명 (참고) */}
      <Section title="흐름 단계 (전체 9단계 — 참고)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {STAGE_DEFS.map((s) => {
            const badge = BADGE_COLORS[s.sourceBadge];
            return (
              <div
                key={s.num}
                style={{
                  padding: 10,
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#e5e7eb",
                      color: "#374151",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {s.num}
                  </span>
                  <strong style={{ fontSize: 12.5 }}>{s.label}</strong>
                </div>
                <div style={{ fontSize: 10.5, color: "#6b7280", lineHeight: 1.4, marginBottom: 6 }}>
                  {s.description}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: badge.fg,
                    background: badge.bg,
                    padding: "2px 6px",
                    borderRadius: 3,
                    display: "inline-block",
                  }}
                >
                  {s.source}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="구현 우선순위">
        <ol style={list}>
          <li>먼저 1개 PO 단위 통합 view — UNI-PASS + SeaVantage 연결만 (이미 데이터 있음)</li>
          <li>Forwarder/ReadyKorea 연동되면 단계 2,3,7에 데이터 자동 채워짐</li>
          <li>SCM Hub PO + WMS 입고 정보 연동 — 1단계와 9단계 채워짐</li>
          <li>알림: 단계간 지연 발생 시 (예: ATD 후 7일 지나도 ATA 없음) 색상/배지</li>
          <li>(선택) 지도 view — SeaVantage 선박 위치 + UNI-PASS 입항지 마커</li>
        </ol>
      </Section>
    </div>
  );
}

// ─────────────── Stepper 컴포넌트 ───────────────
function Stepper({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${STAGE_DEFS.length}, 1fr)`,
        position: "relative",
        padding: "10px 0 4px",
      }}
    >
      {STAGE_DEFS.map((s, i) => {
        const status = STATUSES[i];
        const isSelected = i === selected;
        const color = STATUS_COLORS[status];
        const nextDone = i < STAGE_DEFS.length - 1 && STATUSES[i + 1] === "done";
        const isLast = i === STAGE_DEFS.length - 1;
        const lineColor = STATUSES[i] === "done" || nextDone ? "#10b981" : "#e5e7eb";
        return (
          <button
            key={s.num}
            onClick={() => onSelect(i)}
            style={{
              position: "relative",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* 연결선 (오른쪽) */}
            {!isLast && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  right: 0,
                  height: 2,
                  background: lineColor,
                  zIndex: 0,
                }}
              />
            )}
            {/* 연결선 (왼쪽) */}
            {i > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: "50%",
                  left: 0,
                  height: 2,
                  background:
                    STATUSES[i] === "done" || STATUSES[i - 1] === "done" ? "#10b981" : "#e5e7eb",
                  zIndex: 0,
                }}
              />
            )}
            {/* 노드 */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: color,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                outline: isSelected ? `3px solid ${color}55` : "none",
                outlineOffset: 2,
                transition: "outline 0.15s",
              }}
            >
              {status === "done" ? "✓" : status === "active" ? "●" : s.num}
            </div>
            {/* 라벨 */}
            <div
              style={{
                marginTop: 6,
                fontSize: 10.5,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? "#111827" : "#6b7280",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {s.shortLabel}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#9ca3af",
                marginTop: 1,
              }}
            >
              {status === "done" ? "완료" : status === "active" ? "진행" : "대기"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────── styling helpers ───────────────
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
const input: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "inherit",
};
const btn: React.CSSProperties = {
  padding: "8px 18px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  opacity: 0.5,
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        background: "#f3f4f6",
        color: "#374151",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function Sep({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span style={{ color: "#9ca3af", marginRight: 4 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </span>
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

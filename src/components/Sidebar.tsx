"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; sub?: string };
type Group = {
  label: string;
  items: Item[];
  highlight?: boolean;
  highlightHint?: string;
  /** TBD/미확정 상태로 시각적으로 약화시킬 그룹 */
  dim?: boolean;
};

// 실무 흐름 순서: SCM Hub PO 발행 → Forwarder → 해상/항공 운송 → ReadyKorea → 통관 → 흐름도 → 데이터모음 → SAP → 해외지사
const groups: Group[] = [
  {
    label: "External Channels (흐름 순)",
    items: [
      {
        href: "/tools/scm-hub",
        label: "SCM Hub",
        sub: "PO 발행 / 단일 진실 source (TBD)",
      },
      {
        href: "/tools/forwarder",
        label: "Forwarder",
        sub: "Consolidator + Forwarder PF (TBD)",
      },
      {
        href: "/tools/shipment-tracking",
        label: "Shipment Tracking",
        sub: "해상 사선사 트래킹 (SeaVantage)",
      },
      {
        href: "/tools/airplane-tracking",
        label: "Air Freight",
        sub: "항공 화물 추적 (TBD)",
      },
      {
        href: "/tools/readykorea-customs",
        label: "ReadyKorea 통관",
        sub: "관세사 입력 정보 (xTrade)",
      },
      {
        href: "/tools/customs-tracking",
        label: "Customs Tracking",
        sub: "수입 통관 진행 (UNI-PASS)",
      },
    ],
  },
  {
    label: "★ 실무 확인용",
    highlight: true,
    highlightHint: "표면적 메인 — 실무자가 매일 보는 통합 화면",
    items: [
      {
        href: "/cargo-flow",
        label: "수입 화물 흐름도",
        sub: "10단계 통합 view (TBD)",
      },
    ],
  },
  {
    label: "★ 데이터 모음",
    highlight: true,
    highlightHint: "숨은 메인 — 전산이 SCM Hub로 보내는 정제 데이터 (운영+원가)",
    items: [
      { href: "/data-mart", label: "데이터 모음", sub: "SCM Hub 송신용 정제 (TBD)" },
    ],
  },
  {
    label: "ERP — TBD",
    dim: true,
    items: [
      {
        href: "/tools/sap",
        label: "SAP",
        sub: "SCM Hub → SAP 경로 (Hub 직접 송신 X)",
      },
    ],
  },
  {
    label: "Overseas · 해외지사 — TBD",
    dim: true,
    items: [
      {
        href: "/overseas-flow",
        label: "해외지사 화물 흐름도",
        sub: "통관 제외 / PLM PO (TBD)",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    const moreSpecific = allHrefs.some(
      (h) => h !== href && h.startsWith(href + "/") && pathname.startsWith(h),
    );
    if (moreSpecific) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        background: "#f9fafb",
        borderRight: "1px solid #e5e7eb",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
      }}
    >
      {/* 로고 */}
      <div
        style={{
          padding: "18px 16px 12px",
          fontSize: 15,
          fontWeight: 800,
          color: "#111",
          letterSpacing: "-0.3px",
          borderBottom: "1px solid #e5e7eb",
          background: "#fff",
        }}
      >
        Korea Import Hub
      </div>

      {/* 메인 메뉴 */}
      <nav style={{ flex: 1, padding: "8px" }}>
        {groups.map((group, gIdx) => {
          const isHighlight = group.highlight;
          const isDim = group.dim;
          // ERP/Overseas 그룹 위에 시각적 분리선
          const prevGroup = gIdx > 0 ? groups[gIdx - 1] : null;
          const showDivider = isDim && (!prevGroup || !prevGroup.dim);
          return (
            <div
              key={group.label}
              style={{
                marginBottom: 4,
                ...(isHighlight
                  ? {
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 8,
                      padding: "4px 4px 6px",
                    }
                  : {}),
                ...(isDim
                  ? {
                      opacity: 0.55,
                    }
                  : {}),
                ...(showDivider
                  ? {
                      marginTop: 14,
                      paddingTop: 8,
                      borderTop: "1px dashed #d1d5db",
                    }
                  : {}),
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: isHighlight ? "#92400e" : isDim ? "#9ca3af" : "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: isHighlight ? "8px 8px 2px" : "10px 10px 4px",
                }}
              >
                {group.label}
              </div>
              {group.highlightHint && (
                <div
                  style={{
                    fontSize: 9.5,
                    color: "#b45309",
                    padding: "0 8px 4px",
                    lineHeight: 1.3,
                    fontStyle: "italic",
                  }}
                >
                  {group.highlightHint}
                </div>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "6px 10px 6px 18px",
                      borderRadius: 7,
                      textDecoration: "none",
                      marginBottom: 1,
                      borderLeft: active ? "3px solid #111827" : "3px solid transparent",
                      background: active ? "#e5e7eb" : "transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: active ? 700 : 500,
                        color: active ? "#111827" : "#374151",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.label}
                    </span>
                    {item.sub && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 400,
                          color: active ? "#6b7280" : "#9ca3af",
                          lineHeight: 1.3,
                          marginTop: 1,
                        }}
                      >
                        {item.sub}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

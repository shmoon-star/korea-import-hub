"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; sub?: string };
type Group = {
  label: string;
  items: Item[];
  /** true면 그룹 자체를 강조 (메인 채널) */
  highlight?: boolean;
  /** 하이라이트 그룹의 부제 */
  highlightHint?: string;
};

const groups: Group[] = [
  {
    label: "External Channels",
    items: [
      { href: "/tools/customs-tracking", label: "Customs Tracking", sub: "수입 통관 진행 (UNI-PASS)" },
      { href: "/tools/shipment-tracking", label: "Shipment Tracking", sub: "사선사 트래킹 (SeaVantage)" },
      { href: "/tools/readykorea-customs", label: "ReadyKorea 통관", sub: "관세사 입력 정보 (xTrade)" },
      { href: "/tools/forwarder", label: "Forwarder", sub: "Consolidator + Forwarder PF (TBD)" },
      { href: "/tools/airplane-tracking", label: "Airplane Tracking", sub: "항공 화물 추적 (TBD)" },
    ],
  },
  {
    label: "★ 데이터 모음",
    highlight: true,
    highlightHint: "숨은 메인 — 전산이 SCM Hub로 보내는 정제 데이터 (종착지: SCM Hub)",
    items: [
      { href: "/data-mart", label: "데이터 모음", sub: "SCM Hub 송신용 정제 (TBD)" },
    ],
  },
  {
    label: "★ 실무 확인용",
    highlight: true,
    highlightHint: "표면적 메인 — 실무자가 매일 보는 통합 화면",
    items: [
      { href: "/cargo-flow", label: "수입 화물 흐름도", sub: "Forwarder → 통관 통합 view (TBD)" },
    ],
  },
  {
    label: "Overseas · 해외지사",
    items: [
      { href: "/overseas-flow", label: "해외지사 화물 흐름도", sub: "통관 제외 / PLM PO (TBD)" },
    ],
  },
  {
    label: "ERP",
    items: [
      { href: "/tools/sap", label: "SAP", sub: "SCM Hub → SAP 경로 (Hub 직접 송신 X)" },
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
        position: "sticky",
        top: 0,
        background: "#f9fafb",
        borderRight: "1px solid #e5e7eb",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
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
        {groups.map((group) => {
          const isHighlight = group.highlight;
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
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: isHighlight ? "#92400e" : "#6b7280",
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

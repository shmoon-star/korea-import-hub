"use client";

import { useEffect, useState } from "react";

// Carrier code 4자리 — 추후 SeaVantage 전체 리스트 받으면 확장
const CARRIERS: { code: string; name: string }[] = [
  { code: "MAEU", name: "Maersk" },
  // TODO: SeaVantage 담당자에게 전체 리스트 받아서 추가
];

type WatchRow = {
  id: string;
  carrier_code: string;
  mbl_no: string | null;
  booking_no: string | null;
  container_no: string | null;
  document_id: string | null;
  memo: string | null;
  last_checked_at: string | null;
  last_bl_status: string | null;
  last_initial_eta: string | null;
  last_initial_etd: string | null;
  last_location_count: number | null;
  last_error: string | null;
  cargo_info: any;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
};

type SnapshotRow = {
  id: string;
  watch_id: string;
  checked_at: string;
  bl_status: string | null;
  initial_eta: string | null;
  initial_etd: string | null;
  location_count: number | null;
  change_summary: string | null;
  raw_response: any;
};

export default function ShipmentTrackingPage() {
  // 즉시 조회 상태
  const [qCarrier, setQCarrier] = useState(CARRIERS[0]?.code ?? "MAEU");
  const [qMbl, setQMbl] = useState("");
  const [qBooking, setQBooking] = useState("");
  const [qContainer, setQContainer] = useState("");
  const [qWithTrack, setQWithTrack] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [qResult, setQResult] = useState<any>(null);
  const [qError, setQError] = useState<string | null>(null);

  // Watchlist 등록 폼
  const [rCarrier, setRCarrier] = useState(CARRIERS[0]?.code ?? "MAEU");
  const [rMbl, setRMbl] = useState("");
  const [rBooking, setRBooking] = useState("");
  const [rContainer, setRContainer] = useState("");
  const [rMemo, setRMemo] = useState("");
  const [rSubmitting, setRSubmitting] = useState(false);
  const [rError, setRError] = useState<string | null>(null);

  // Watchlist 데이터
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshAllResult, setRefreshAllResult] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  // 이력 / 정보 모달
  const [historyFor, setHistoryFor] = useState<WatchRow | null>(null);
  const [historyData, setHistoryData] = useState<SnapshotRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [infoFor, setInfoFor] = useState<WatchRow | null>(null);

  // ─────────── Watchlist 로드 ───────────
  async function loadWatches() {
    const qs = new URLSearchParams();
    if (includeClosed) qs.set("includeClosed", "true");
    const resp = await fetch(`/api/seavantage/watch?${qs.toString()}`);
    const json = await resp.json();
    if (json?.ok) setWatches(json.data ?? []);
  }
  useEffect(() => {
    loadWatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeClosed]);

  // ─────────── 즉시 조회 ───────────
  async function onSearch() {
    setQError(null);
    setQResult(null);
    if (!qMbl && !qBooking && !qContainer) {
      setQError("MBL / Booking / Container 중 하나는 입력해야 합니다.");
      return;
    }
    setQLoading(true);
    try {
      const qs = new URLSearchParams();
      if (qMbl) qs.set("mblNo", qMbl);
      if (qBooking) qs.set("bookingNo", qBooking);
      if (qContainer) qs.set("containerNo", qContainer);
      if (qWithTrack) qs.set("withTrack", "true");
      const resp = await fetch(`/api/seavantage/cargo?${qs.toString()}`);
      const json = await resp.json();
      if (json?.ok) {
        setQResult(json.data);
      } else {
        setQError(json?.error || "조회 실패");
      }
    } catch (e: any) {
      setQError(e?.message || "조회 중 오류");
    } finally {
      setQLoading(false);
    }
  }

  // ─────────── Watchlist 등록 ───────────
  async function onRegister() {
    setRError(null);
    if (!rMbl && !rBooking && !rContainer) {
      setRError("MBL / Booking / Container 중 하나는 입력해야 합니다.");
      return;
    }
    setRSubmitting(true);
    try {
      const resp = await fetch("/api/seavantage/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrierCode: rCarrier,
          mblNo: rMbl || undefined,
          bookingNo: rBooking || undefined,
          containerNo: rContainer || undefined,
          memo: rMemo || undefined,
        }),
      });
      const json = await resp.json();
      if (json?.ok) {
        setRMbl("");
        setRBooking("");
        setRContainer("");
        setRMemo("");
        await loadWatches();
      } else {
        setRError(json?.error || "등록 실패");
      }
    } catch (e: any) {
      setRError(e?.message || "등록 중 오류");
    } finally {
      setRSubmitting(false);
    }
  }

  // ─────────── 단건 갱신 ───────────
  async function onRefresh(id: string) {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await fetch(`/api/seavantage/watch/${id}/refresh`, { method: "POST" });
      await loadWatches();
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  // ─────────── 전체 갱신 ───────────
  async function onRefreshAll() {
    setRefreshingAll(true);
    setRefreshAllResult(null);
    try {
      const resp = await fetch("/api/seavantage/watch/refresh-all", {
        method: "POST",
      });
      const json = await resp.json();
      if (json?.ok) {
        const d = json.data;
        setRefreshAllResult(
          `전체 갱신 완료 · 총 ${d.total}건 (변화 ${d.updated} / 동일 ${d.unchanged} / 에러 ${d.errors?.length ?? 0})`,
        );
        await loadWatches();
      } else {
        setRefreshAllResult(`갱신 실패: ${json?.error}`);
      }
    } finally {
      setRefreshingAll(false);
    }
  }

  // ─────────── 종료 / 재개 ───────────
  async function onToggleClosed(w: WatchRow) {
    setBusy((b) => ({ ...b, [w.id]: true }));
    try {
      await fetch(`/api/seavantage/watch/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_closed: !w.is_closed }),
      });
      await loadWatches();
    } finally {
      setBusy((b) => ({ ...b, [w.id]: false }));
    }
  }

  // ─────────── 삭제 ───────────
  async function onDelete(w: WatchRow) {
    if (!confirm(`삭제하시겠습니까?\nSeaVantage에서도 함께 삭제됩니다.`)) return;
    setBusy((b) => ({ ...b, [w.id]: true }));
    try {
      await fetch(`/api/seavantage/watch/${w.id}`, { method: "DELETE" });
      await loadWatches();
    } finally {
      setBusy((b) => ({ ...b, [w.id]: false }));
    }
  }

  // ─────────── 이력 모달 ───────────
  async function onOpenHistory(w: WatchRow) {
    setHistoryFor(w);
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const resp = await fetch(`/api/seavantage/watch/${w.id}/history`);
      const json = await resp.json();
      if (json?.ok) setHistoryData(json.data ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }

  // ─────────── 렌더 ───────────
  return (
    <div style={{ padding: 24, maxWidth: 1280, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>사선사 트래킹</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        SeaVantage Cargo Insight API 연동. MBL / Booking / Container 번호로 화물 등록 후 주기적으로
        상태 변화를 추적합니다.
      </p>

      {/* ─────── 즉시 조회 ─────── */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          ① 즉시 조회 (DB 저장 없음)
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 1fr 1fr",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Field label="Carrier *">
            <select
              value={qCarrier}
              onChange={(e) => setQCarrier(e.target.value)}
              style={selectStyle}
            >
              {CARRIERS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="MBL 번호">
            <input
              value={qMbl}
              onChange={(e) => setQMbl(e.target.value)}
              placeholder="예: SOMEBILL2025001"
              style={inputStyle}
            />
          </Field>
          <Field label="Booking 번호">
            <input
              value={qBooking}
              onChange={(e) => setQBooking(e.target.value)}
              placeholder="Booking No"
              style={inputStyle}
            />
          </Field>
          <Field label="Container 번호">
            <input
              value={qContainer}
              onChange={(e) => setQContainer(e.target.value)}
              placeholder="Container No"
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <label style={{ fontSize: 12, color: "#374151", display: "flex", gap: 4 }}>
            <input
              type="checkbox"
              checked={qWithTrack}
              onChange={(e) => setQWithTrack(e.target.checked)}
            />
            선박 위치 이력 포함 (past-track)
          </label>
          <button onClick={onSearch} disabled={qLoading} style={primaryBtn}>
            {qLoading ? "조회 중..." : "조회"}
          </button>
        </div>

        {qError && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
              borderRadius: 6,
            }}
          >
            <strong>조회 실패:</strong> {qError}
          </div>
        )}

        {qResult && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 12,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <strong>BL Status:</strong> {qResult.blStatus ?? "-"}
              {" / "}
              <strong>ETD:</strong> {qResult.initialEtd ?? "-"}
              {" / "}
              <strong>ETA:</strong> {qResult.initialEta ?? "-"}
              {" / "}
              <strong>Locations:</strong> {qResult.locations?.length ?? 0}
            </div>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {JSON.stringify(qResult, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* ─────── Watchlist 등록 ─────── */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          ② Watchlist (등록된 화물 주기적 감시 + 상태 변화 이력)
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 1fr 1fr",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Field label="Carrier *">
            <select
              value={rCarrier}
              onChange={(e) => setRCarrier(e.target.value)}
              style={selectStyle}
            >
              {CARRIERS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="MBL 번호">
            <input
              value={rMbl}
              onChange={(e) => setRMbl(e.target.value)}
              placeholder="MBL"
              style={inputStyle}
            />
          </Field>
          <Field label="Booking 번호">
            <input
              value={rBooking}
              onChange={(e) => setRBooking(e.target.value)}
              placeholder="Booking"
              style={inputStyle}
            />
          </Field>
          <Field label="Container 번호">
            <input
              value={rContainer}
              onChange={(e) => setRContainer(e.target.value)}
              placeholder="Container"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="메모 (선택)">
          <input
            value={rMemo}
            onChange={(e) => setRMemo(e.target.value)}
            placeholder="예: FW26 KF001"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={onRegister} disabled={rSubmitting} style={primaryBtn}>
            {rSubmitting ? "등록 중..." : "등록"}
          </button>
          <button onClick={onRefreshAll} disabled={refreshingAll} style={secondaryBtn}>
            {refreshingAll ? "갱신 중..." : "전체 갱신"}
          </button>
          <label
            style={{
              fontSize: 12,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginLeft: "auto",
            }}
          >
            <input
              type="checkbox"
              checked={includeClosed}
              onChange={(e) => setIncludeClosed(e.target.checked)}
            />
            종료된 항목 포함
          </label>
        </div>

        {rError && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
              borderRadius: 6,
            }}
          >
            <strong>등록 실패:</strong> {rError}
          </div>
        )}
        {refreshAllResult && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: "#eff6ff",
              color: "#1e40af",
              fontSize: 13,
              borderRadius: 6,
            }}
          >
            {refreshAllResult}
          </div>
        )}
      </section>

      {/* ─────── Watchlist 테이블 ─────── */}
      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <Th>Carrier / MBL / Booking / Container</Th>
              <Th>메모</Th>
              <Th>BL 상태</Th>
              <Th>ETD</Th>
              <Th>ETA</Th>
              <Th>로케이션</Th>
              <Th>마지막 조회</Th>
              <Th style={{ textAlign: "right" }}>동작</Th>
            </tr>
          </thead>
          <tbody>
            {watches.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 30, textAlign: "center", color: "#9ca3af" }}
                >
                  등록된 화물이 없습니다. 위에서 등록하세요.
                </td>
              </tr>
            )}
            {watches.map((w) => (
              <tr key={w.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <Td>
                  <div style={{ fontWeight: 600 }}>{w.carrier_code}</div>
                  {w.mbl_no && <div>MBL: {w.mbl_no}</div>}
                  {w.booking_no && <div>BK: {w.booking_no}</div>}
                  {w.container_no && <div>CT: {w.container_no}</div>}
                  {w.is_closed && (
                    <div style={{ color: "#9ca3af", fontSize: 10 }}>(종료됨)</div>
                  )}
                </Td>
                <Td>{w.memo || "-"}</Td>
                <Td>
                  {w.last_error ? (
                    <span style={{ color: "#b91c1c" }}>ERR: {w.last_error}</span>
                  ) : (
                    w.last_bl_status || "-"
                  )}
                </Td>
                <Td>{w.last_initial_etd || "-"}</Td>
                <Td>{w.last_initial_eta || "-"}</Td>
                <Td>{w.last_location_count ?? 0}</Td>
                <Td>{w.last_checked_at ? new Date(w.last_checked_at).toLocaleString() : "-"}</Td>
                <Td style={{ textAlign: "right" }}>
                  <button
                    onClick={() => onRefresh(w.id)}
                    disabled={busy[w.id]}
                    style={smallBtn}
                  >
                    갱신
                  </button>
                  <button onClick={() => onOpenHistory(w)} style={smallBtn}>
                    이력
                  </button>
                  <button onClick={() => setInfoFor(w)} style={smallBtn}>
                    정보
                  </button>
                  <button
                    onClick={() => onToggleClosed(w)}
                    disabled={busy[w.id]}
                    style={smallBtn}
                  >
                    {w.is_closed ? "재개" : "종료"}
                  </button>
                  <button
                    onClick={() => onDelete(w)}
                    disabled={busy[w.id]}
                    style={{ ...smallBtn, color: "#b91c1c" }}
                  >
                    삭제
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ─────── 이력 모달 ─────── */}
      {historyFor && (
        <Modal onClose={() => setHistoryFor(null)} title={`이력 — ${historyFor.carrier_code} / ${historyFor.mbl_no || historyFor.booking_no || historyFor.container_no}`}>
          {historyLoading ? (
            <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>로딩 중...</div>
          ) : historyData.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>
              스냅샷이 아직 없습니다 (최초 갱신 시 첫 스냅샷이 생성됩니다).
            </div>
          ) : (
            <ol style={{ paddingLeft: 20, fontSize: 12, lineHeight: 1.6 }}>
              {historyData.map((s) => (
                <li key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(s.checked_at).toLocaleString()}
                  </div>
                  <div style={{ color: "#6b7280" }}>{s.change_summary || "변화 기록"}</div>
                  <div style={{ marginTop: 4, color: "#374151" }}>
                    BL: {s.bl_status || "-"} / ETA: {s.initial_eta || "-"} / ETD:{" "}
                    {s.initial_etd || "-"} / Locations: {s.location_count ?? 0}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Modal>
      )}

      {/* ─────── 정보 모달 (cargo_info raw) ─────── */}
      {infoFor && (
        <Modal onClose={() => setInfoFor(null)} title={`상세 정보 — ${infoFor.carrier_code}`}>
          <pre
            style={{
              fontSize: 11,
              whiteSpace: "pre-wrap",
              background: "#f9fafb",
              padding: 12,
              borderRadius: 6,
              maxHeight: 500,
              overflow: "auto",
            }}
          >
            {JSON.stringify(infoFor.cargo_info ?? {}, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}

// ───────── styling helpers ─────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "inherit",
};
const selectStyle: React.CSSProperties = { ...inputStyle, height: 30 };
const primaryBtn: React.CSSProperties = {
  padding: "8px 18px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  padding: "8px 18px",
  background: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
const smallBtn: React.CSSProperties = {
  padding: "4px 8px",
  background: "white",
  border: "1px solid #d1d5db",
  borderRadius: 3,
  fontSize: 11,
  marginLeft: 4,
  cursor: "pointer",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      style={{
        padding: "8px 10px",
        textAlign: "left",
        fontWeight: 600,
        fontSize: 11,
        color: "#374151",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "8px 10px", verticalAlign: "top", ...style }}>{children}</td>;
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 8,
          padding: 20,
          minWidth: 600,
          maxWidth: 900,
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

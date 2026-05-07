/**
 * SeaVantage Cargo Insight 응답을 구조화해서 보여주는 컴포넌트.
 * /cargo/search, /cargo/search/past-track 응답 모두 호환.
 *
 * 입력 data shape (Swagger CargoSearchClientResponse 기준):
 *   { documentId, carrierCode, referenceType, mblNo, bookingNo, containerNo,
 *     blStatus, initialEtd, initialEta, bookingRegno, srNo,
 *     customColumn1/2/3,
 *     locations: [{ locationType, port, carrierEta/Atb/Atd, ata/atb/atd, pta,
 *                   carrierShipName, carrierVoyageNo, ... }],
 *     hbls: [{ hblNo, shipperName, consigneeName, ownerName,
 *              containers: [{ containerNo, size, type, commodity, hscode,
 *                             qty, gw, sealNo1/2/3,
 *                             trackings: [{ eventCode, eventStatus,
 *                                           eventDescription1/2,
 *                                           carrierEventTime, carrierLocationName,
 *                                           unlocode, locationType }] }] }],
 *     pastTrack: [{ shipName, imoNo, mmsi, shipType, nationCode,
 *                   positions: [{ latitude, longitude, timestamp, ... }] }]
 *   }
 */

const LOCATION_TYPE_LABELS: Record<string, string> = {
  POR: "Place of Receipt",
  POL: "Port of Loading",
  TSD: "Transshipment Discharge",
  TSL: "Transshipment Loading",
  POD: "Port of Discharge",
  PVY: "Place of Delivery",
};

const BL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  BEFORE: { label: "출발 전", color: "#6b7280" },
  PROCESSING: { label: "처리 중", color: "#0ea5e9" },
  ON: { label: "운송 중", color: "#10b981" },
  PENDING: { label: "대기", color: "#f59e0b" },
  END: { label: "종료", color: "#374151" },
  NOT_FOUND: { label: "미확인", color: "#ef4444" },
};

export default function CargoDetail({ data }: { data: any }) {
  if (!data || typeof data !== "object") {
    return (
      <div style={{ padding: 16, color: "#9ca3af", fontSize: 12 }}>
        표시할 데이터가 없습니다.
      </div>
    );
  }

  const blStatus = data.blStatus as string | undefined;
  const blStyle = blStatus ? BL_STATUS_LABELS[blStatus] : undefined;

  const insightUrl = data.documentId
    ? `https://insight.seavantage.com/cargo/${encodeURIComponent(data.documentId)}`
    : null;

  return (
    <div style={{ fontSize: 12, color: "#1f2937" }}>
      {/* ─────── 헤더 카드 ─────── */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{data.carrierCode || "-"}</strong>
              <span style={{ color: "#9ca3af" }}>·</span>
              <span style={{ color: "#6b7280" }}>{data.referenceType || "-"}</span>
              {blStyle && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: "2px 8px",
                    background: blStyle.color,
                    color: "white",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {blStyle.label} ({blStatus})
                </span>
              )}
            </div>
            <KV label="MBL" value={data.mblNo} />
            <KV label="Booking" value={data.bookingNo} />
            <KV label="Container" value={data.containerNo} />
            {data.bookingRegno && <KV label="Booking RegNo" value={data.bookingRegno} />}
            {data.srNo && <KV label="SR No" value={data.srNo} />}
            {data.documentId && (
              <KV
                label="DocumentId"
                value={
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>{data.documentId}</span>
                }
              />
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Initial ETD → ETA</div>
              <div style={{ fontWeight: 600 }}>
                {data.initialEtd || "-"}
                <span style={{ margin: "0 6px", color: "#9ca3af" }}>→</span>
                {data.initialEta || "-"}
              </div>
            </div>
            {insightUrl && (
              <a
                href={insightUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  background: "#111827",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                SeaVantage에서 보기 ↗
              </a>
            )}
          </div>
        </div>

        {(data.customColumn1 || data.customColumn2 || data.customColumn3) && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>Custom</div>
            {data.customColumn1 && <KV label="Col1" value={data.customColumn1} />}
            {data.customColumn2 && <KV label="Col2" value={data.customColumn2} />}
            {data.customColumn3 && <KV label="Col3" value={data.customColumn3} />}
          </div>
        )}
      </div>

      {/* ─────── 운송 경로 (locations) ─────── */}
      {Array.isArray(data.locations) && data.locations.length > 0 && (
        <Section title={`운송 경로 (${data.locations.length})`}>
          <div style={{ display: "grid", gap: 8 }}>
            {data.locations.map((loc: any, i: number) => {
              const portName =
                loc.port?.portName || loc.carrierLocationName || loc.carrierLocationCode || "-";
              const unlocode = loc.port?.unlocode || loc.carrierLocationCode || "";
              const nation = loc.port?.nationCode || "";
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 1fr",
                    gap: 10,
                    padding: 10,
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#111827" }}>
                      {loc.locationType || "-"}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>
                      {LOCATION_TYPE_LABELS[loc.locationType || ""] || ""}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      <strong>{portName}</strong>
                      {unlocode && (
                        <span style={{ color: "#6b7280" }}> ({unlocode})</span>
                      )}
                      {nation && <span style={{ color: "#9ca3af" }}> · {nation}</span>}
                    </div>
                    {loc.carrierTerminalName && (
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                        Terminal: {loc.carrierTerminalName}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
                      Carrier 일정
                    </div>
                    <KV label="ETB" value={loc.carrierEtb} compact />
                    <KV label="ETD" value={loc.carrierEtd} compact />
                    <KV label="ETA" value={loc.carrierEta} compact />
                    <KV label="ATB" value={loc.carrierAtb} compact />
                    <KV label="ATD" value={loc.carrierAtd} compact />
                    <KV label="ATA" value={loc.carrierAta} compact />
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
                      실측 / Vessel
                    </div>
                    <KV label="ATB" value={loc.atb} compact />
                    <KV label="ATD" value={loc.atd} compact />
                    <KV label="ATA" value={loc.ata} compact />
                    <KV label="PTA" value={loc.pta} compact />
                    <KV label="Vessel" value={loc.carrierShipName} compact />
                    <KV label="Voyage" value={loc.carrierVoyageNo} compact />
                    <KV label="IMO" value={loc.imoNo} compact />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ─────── HBL / 컨테이너 / 이벤트 ─────── */}
      {Array.isArray(data.hbls) && data.hbls.length > 0 && (
        <Section title={`HBL (${data.hbls.length})`}>
          <div style={{ display: "grid", gap: 10 }}>
            {data.hbls.map((hbl: any, i: number) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: 10,
                  background: "white",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  HBL: {hbl.hblNo || "-"}
                  {hbl.ciNo && (
                    <span style={{ marginLeft: 8, color: "#6b7280", fontWeight: 400 }}>
                      CI: {hbl.ciNo}
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <KV label="Shipper" value={hbl.shipperName || hbl.shipperCode} compact />
                  <KV label="Consignee" value={hbl.consigneeName || hbl.consigneeCode} compact />
                  <KV label="Owner" value={hbl.ownerName || hbl.ownerCode} compact />
                </div>

                {Array.isArray(hbl.containers) && hbl.containers.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>
                      Containers ({hbl.containers.length})
                    </div>
                    {hbl.containers.map((c: any, j: number) => (
                      <ContainerCard key={j} container={c} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─────── Past Track (vessel positions) ─────── */}
      {Array.isArray(data.pastTrack) && data.pastTrack.length > 0 && (
        <Section title={`선박 위치 이력 (${data.pastTrack.length}대)`}>
          <div style={{ display: "grid", gap: 8 }}>
            {data.pastTrack.map((ship: any, i: number) => {
              const positions = Array.isArray(ship.positions) ? ship.positions : [];
              const latest = positions[positions.length - 1];
              return (
                <div
                  key={i}
                  style={{
                    padding: 10,
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    background: "white",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {ship.shipName || "-"}
                    <span style={{ marginLeft: 8, color: "#6b7280", fontWeight: 400 }}>
                      IMO {ship.imoNo} · MMSI {ship.mmsi || "-"} · {ship.shipType || "-"} · {ship.nationCode || "-"}
                    </span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <KV label="포지션 수" value={String(positions.length)} compact />
                    {latest && (
                      <>
                        <KV
                          label="최근 위치"
                          value={`${latest.latitude}, ${latest.longitude}`}
                          compact
                        />
                        <KV label="최근 시각" value={latest.timestamp} compact />
                        <KV label="속도" value={latest.speedOverGround} compact />
                        <KV label="방향" value={latest.courseOverGround} compact />
                        <KV label="목적지" value={latest.aisDestination} compact />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ─────── Raw JSON (접힘) ─────── */}
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontSize: 11, color: "#6b7280" }}>
          Raw JSON 보기
        </summary>
        <pre
          style={{
            fontSize: 10,
            background: "#0f172a",
            color: "#e2e8f0",
            padding: 12,
            borderRadius: 6,
            marginTop: 6,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function ContainerCard({ container: c }: { container: any }) {
  return (
    <div
      style={{
        marginTop: 6,
        padding: 8,
        background: "#fafbfc",
        border: "1px solid #e5e7eb",
        borderRadius: 4,
      }}
    >
      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
        <strong>{c.containerNo || "-"}</strong>
        {c.size && (
          <span>
            {c.size}{c.type || ""}
          </span>
        )}
        {c.commodity && <span style={{ color: "#6b7280" }}>· {c.commodity}</span>}
        {c.hscode && <span style={{ color: "#6b7280" }}>· HS {c.hscode}</span>}
        {c.qty != null && <span style={{ color: "#6b7280" }}>· Qty {c.qty}</span>}
        {c.gw != null && <span style={{ color: "#6b7280" }}>· GW {c.gw}</span>}
        {(c.sealNo1 || c.sealNo2 || c.sealNo3) && (
          <span style={{ color: "#6b7280" }}>
            · Seal {[c.sealNo1, c.sealNo2, c.sealNo3].filter(Boolean).join("/")}
          </span>
        )}
      </div>

      {Array.isArray(c.trackings) && c.trackings.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>
            이벤트 ({c.trackings.length})
          </div>
          <ol style={{ margin: 0, paddingLeft: 16, fontSize: 10.5 }}>
            {c.trackings.map((t: any, k: number) => (
              <li key={k} style={{ marginBottom: 3 }}>
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 60,
                    color: t.eventStatus === "Actual" ? "#10b981" : "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  [{t.eventStatus || "?"}]
                </span>
                <span style={{ marginRight: 6 }}>
                  {t.carrierEventTime || "-"}
                </span>
                <span style={{ color: "#374151" }}>
                  {t.eventCode}{" "}
                  {t.eventDescription1 || t.eventDescription2 || ""}
                </span>
                {t.carrierLocationName && (
                  <span style={{ color: "#6b7280" }}>
                    {" "}@ {t.carrierLocationName}
                    {t.unlocode ? ` (${t.unlocode})` : ""}
                  </span>
                )}
                {t.shipName && (
                  <span style={{ color: "#9ca3af" }}> · {t.shipName}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#374151",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function KV({
  label,
  value,
  compact,
}: {
  label: string;
  value?: string | number | React.ReactNode;
  compact?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  if (compact) {
    return (
      <div style={{ fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: "#6b7280", marginRight: 4 }}>{label}:</span>
        <span>{value}</span>
      </div>
    );
  }
  return (
    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
      <span style={{ color: "#6b7280", marginRight: 6, minWidth: 80, display: "inline-block" }}>
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

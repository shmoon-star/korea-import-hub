import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: 40, maxWidth: 720, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>korea-import-hub</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
        한국 수입 운영 데이터 허브 — 외부 API에서 데이터를 수집해 Supabase에 적재합니다.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <Link
          href="/customs"
          style={{
            display: "block",
            padding: "16px 20px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            textDecoration: "none",
            color: "#111827",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            수입 통관 진행정보 →
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            관세청 UNI-PASS — BL 등록, 주기 갱신, 상태 변화 이력
          </div>
        </Link>
      </div>
    </div>
  );
}

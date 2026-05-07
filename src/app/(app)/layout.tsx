import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 240, // 고정 사이드바 폭만큼 본문 들여쓰기
          minWidth: 0,
          overflowX: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}

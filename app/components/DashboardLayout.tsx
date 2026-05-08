import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* <Header /> */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

import { Sidebar } from "@/layout/Sidebar";
import { Topbar } from "@/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1 pr-[38.5px] pl-[39.5px]">
        <Topbar />
        <main id="main" tabIndex={-1} className="pb-10 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

import Sidebar from "@/app/components/sidebar";
import MobileNav from "@/app/components/mobile-nav";

/*
 * The authenticated console shell. Only routes inside this group get the
 * sidebar, so Sidebar no longer has to inspect the pathname and hide itself.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <MobileNav />
        <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}

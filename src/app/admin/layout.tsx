import { checkAdmin } from "./actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Map, CalendarClock, LogOut, Bus } from "lucide-react";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await checkAdmin();
  } catch (err) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A3055] text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-50">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            unoptimized
          />
          <span className="font-semibold text-lg">CNT Admin</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm">
            <LayoutDashboard className="w-4 h-4" />
            Tableau de bord
          </Link>
          <Link
            href="/admin/routes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm">
            <Map className="w-4 h-4" />
            Trajets
          </Link>
          <Link
            href="/admin/buses"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm">
            <Image src="/icons/bus.png" alt="Bus" width={16} height={16} className="brightness-0 invert opacity-70" />
            Gestion de Bus
          </Link>
          <Link
            href="/admin/schedules"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm">
            <CalendarClock className="w-4 h-4" />
            Départs & Horaires
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-cnt-yellow/20 border border-cnt-yellow/30 flex items-center justify-center text-cnt-yellow font-semibold text-sm">
              {user.prenom ? user.prenom[0].toUpperCase() : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-white/40">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-w-0">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

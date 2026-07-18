import { getDashboardStats, getSchedulesCapacity } from "./actions";
import {
  Ticket,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  // Capacités pour la date du jour
  const today = new Date().toISOString().split("T")[0];
  const capacities = await getSchedulesCapacity(today);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-gray-500 mt-1">
          Aperçu général des ventes et de la capacité du jour.
        </p>
      </div>

      {/* KPI CARDS - FORMAT COMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Total Billets
            </p>
            <p className="text-xl font-bold text-gray-900">
              {stats.totalTickets}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50/50 text-blue-600 flex items-center justify-center">
            <Image
              src="/icons/ticket.png"
              alt="Ticket"
              width={24}
              height={24}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Revenu (FCFA)
            </p>
            <p className="text-xl font-bold text-gray-900">
              {stats.revenue.toLocaleString("fr-FR")}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50/50 text-emerald-600 flex items-center justify-center">
            <Image
              src="/icons/revenue.png"
              alt="Revenue"
              width={24}
              height={24}
              className="w-5 h-5"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Répartition
            </p>
            <Image
              src="/icons/bar.png"
              alt="Bar"
              width={24}
              height={24}
              className="w-4 h-4 text-purple-400"
            />
          </div>
          <div className="flex gap-3 text-sm font-semibold text-gray-700">
            {stats.salesByClass.map((s) => (
              <div
                key={s.classe}
                className="flex gap-1.5 items-center bg-gray-50 px-2 py-0.5 rounded-md">
                <span className="capitalize text-xs text-gray-500">
                  {s.classe.substring(0, 3)}:
                </span>
                <span>{s.count}</span>
              </div>
            ))}
            {stats.salesByClass.length === 0 && (
              <span className="text-xs text-gray-400">Aucune vente</span>
            )}
          </div>
        </div>
      </div>

      {/* CAPACITES DU JOUR */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Capacités & Remplissage (Prochains Départs)
          </h2>
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-semibold uppercase">
            À partir d'aujourd'hui
          </div>
        </div>

        {capacities.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-gray-200">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">
              Aucun départ prévu aujourd'hui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tl-lg">
                    Trajet
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Jour
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Départ
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    Remplissage
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    Restantes
                  </th>
                  <th className="py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right rounded-tr-lg">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {capacities.map((c) => {
                  const percent =
                    c.capacity > 0 ? (c.booked / c.capacity) * 100 : 0;
                  const isFull = c.restantes <= 0;
                  const isAlmostFull = c.restantes <= 5 && !isFull;

                  return (
                    <tr
                      key={c.scheduleId}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800 text-sm">
                        {c.route}
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-600 text-sm capitalize">
                        {c.dateVoyage ? format(new Date(c.dateVoyage), "EEE d MMM", { locale: fr }) : "Inconnu"}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-600 text-sm">
                        {c.heureDepart}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-sm">
                          <span className="font-bold text-gray-900">
                            {c.booked}
                          </span>
                          <span className="text-gray-400 text-xs">
                            / {c.capacity}
                          </span>
                        </div>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full mx-auto mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isFull ? "bg-red-500" : isAlmostFull ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-gray-700 text-sm">
                        {c.restantes}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isFull ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" /> COMPLET
                          </span>
                        ) : isAlmostFull ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" /> PRESQUE
                            COMPLET
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> DISPONIBLE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

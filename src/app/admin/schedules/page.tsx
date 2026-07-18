import { getSchedulesCapacity } from "../actions";
import { Clock, Users, ArrowRight, Bus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";

export default async function AdminSchedulesPage() {
  const today = new Date().toISOString().split('T')[0];
  const schedulesList = await getSchedulesCapacity(today);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Départs Programmés</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tableau de suivi des départs d'aujourd'hui ({format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-left w-16">Itinéraire</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Départ</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Bus</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Capacité</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Places Vendues</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Places Restantes</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Taux Remplissage</th>
              </tr>
            </thead>
            <tbody>
              {schedulesList.map((s, idx) => {
                const fillRate = s.capacity > 0 ? (s.booked / s.capacity) * 100 : 0;
                
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                        {s.route}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 font-bold text-cnt-blue bg-blue-50 px-2 py-1 rounded-md text-xs">
                        <Image src="/icons/clock.png" alt="Clock" width={10} height={10} className="w-3.5 h-3.5" /> {s.heureDepart}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium text-gray-600 text-sm flex items-center justify-center gap-1">
                        <Bus className="w-3.5 h-3.5 text-gray-400" />
                        {s.bus?.matricule || "Non assigné"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-gray-900 text-sm">{s.capacity}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-gray-900 text-sm">{s.booked}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold text-sm ${s.restantes < 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {s.restantes}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${fillRate > 90 ? 'bg-red-500' : fillRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, fillRate)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 w-8 text-right">
                          {Math.round(fillRate)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {schedulesList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500 text-sm font-medium">
                    Aucun départ programmé pour aujourd'hui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Loading() {
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
              {[...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <Skeleton className="w-32 h-5 rounded bg-gray-100" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="w-20 h-6 rounded-md mx-auto bg-gray-100" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="w-24 h-4 rounded mx-auto bg-gray-100" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="w-8 h-4 rounded mx-auto bg-gray-100" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="w-8 h-4 rounded mx-auto bg-gray-100" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Skeleton className="w-8 h-5 rounded mx-auto bg-gray-100" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <Skeleton className="w-16 h-2 rounded-full bg-gray-100" />
                      <Skeleton className="w-8 h-3 rounded bg-gray-100" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

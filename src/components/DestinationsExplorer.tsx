// src/components/DestinationsExplorer.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Search,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bus,
} from "lucide-react";
import RouteScheduleViewer from "@/components/RouteScheduleViewer";

const PAGE_SIZE = 4; // 2 colonnes x 2 lignes

type Destination = {
  name: string;
  routes: any[];
  image: string | null;
};

export default function DestinationsExplorer({
  destinations,
}: {
  destinations: Destination[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter((d) => {
      if (d.name.toLowerCase().includes(q)) return true;
      return d.routes.some(
        (r) =>
          r.cityDepart.nom.toLowerCase().includes(q) ||
          r.cityArrivee.nom.toLowerCase().includes(q),
      );
    });
  }, [destinations, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1); // reset pagination à chaque nouvelle recherche
  };

  return (
    <div>
      {/* Barre de recherche */}
      <div className="mb-8 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 max-w-md focus-within:border-cnt-blue/40 transition-colors">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Rechercher une ville ou une destination..."
          className="w-full text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <MapPin
            className="w-10 h-10 text-gray-300 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-gray-500 text-sm">
            {query
              ? `Aucun résultat pour "${query}"`
              : "Aucune destination disponible pour le moment."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pageItems.map((dest) => (
              <DestinationCard key={dest.name} destination={dest} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-1.5 mt-12"
              aria-label="Pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none transition-all"
                aria-label="Page précédente">
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? "bg-cnt-blue text-white shadow-sm shadow-cnt-blue/30"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      }`}>
                      {pageNum}
                    </button>
                  );
                },
              )}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none transition-all"
                aria-label="Page suivante">
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors flex flex-col sm:flex-row">
      {/* Image ou placeholder */}
      <div className="sm:w-2/5 relative h-40 sm:h-auto bg-gray-100 shrink-0">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cnt-blue/5 to-cnt-blue/10">
            <Bus className="w-8 h-8 text-cnt-blue/30" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <h2 className="text-lg font-bold drop-shadow">{destination.name}</h2>
        </div>
      </div>

      {/* Trajets */}
      <div className="p-5 sm:w-3/5 flex flex-col justify-center gap-5">
        {destination.routes.map((route) => (
          <div key={route.id}>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                {route.cityDepart.nom}
                <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                {route.cityArrivee.nom}
              </h3>
              <span className="text-cnt-green text-xs font-semibold">
                {route.prixStandard} FCFA
              </span>
            </div>

            {route.schedules.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Aucun horaire défini
              </p>
            ) : (
              <RouteScheduleViewer route={route} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

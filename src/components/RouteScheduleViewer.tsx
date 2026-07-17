"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { Clock, ArrowRight, CalendarDays, Check, Loader2 } from "lucide-react";
import { getAvailableSchedules } from "@/app/actions/tickets";
import { fr } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RouteScheduleViewer({ route }: { route: any }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const activeDates = new Set(route.schedules.map((s: any) => s.dateVoyage));

  const formatDateForSearch = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  const selectedDateStr = selectedDate
    ? formatDateForSearch(selectedDate)
    : null;

  useEffect(() => {
    if (selectedDateStr && activeDates.has(selectedDateStr)) {
      setLoadingSchedules(true);
      getAvailableSchedules(
        route.cityDepart.nom,
        route.cityArrivee.nom,
        selectedDateStr,
      )
        .then(setAvailableSchedules)
        .catch(console.error)
        .finally(() => setLoadingSchedules(false));
    } else {
      setAvailableSchedules([]);
    }
  }, [selectedDateStr, route.cityDepart.nom, route.cityArrivee.nom]);

  const selectedSchedule = availableSchedules.find(
    (s: any) => s.id.toString() === selectedScheduleId?.toString(),
  );

  // Réinitialise l'horaire choisi si on change de date
  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedScheduleId(null);
  };

  const handleConfirm = () => {
    if (!selectedSchedule || !selectedDateStr) return;
    const params = new URLSearchParams({
      depart: route.cityDepart.nom,
      arrivee: route.cityArrivee.nom,
      date: selectedDateStr,
      heureDepart: selectedSchedule.heureDepart,
    });
    router.push(`/achat-billet?${params.toString()}`);
  };

  return (
    <Dialog>
      <DialogTrigger className="w-full sm:w-auto bg-cnt-green hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
        Réserver / Voir les créneaux
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            {route.cityDepart.nom}
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            {route.cityArrivee.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[auto_1fr] gap-0 md:divide-x divide-gray-100">
          {/* Calendrier */}
          <div className="p-4 flex justify-center md:justify-start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              locale={fr}
              disabled={(date) => {
                const dateStr = formatDateForSearch(date);
                const todayStr = formatDateForSearch(new Date());
                return dateStr < todayStr || !activeDates.has(dateStr);
              }}
              className="rounded-md"
            />
          </div>

          {/* Horaires du jour + confirmation */}
          <div className="p-6 min-h-[300px] flex flex-col">
            {selectedDate ? (
              <>
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                  {selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h4>

                {loadingSchedules ? (
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50/80 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gray-200 rounded-full" />
                          <div className="flex flex-col gap-1.5">
                            <div className="w-16 h-4 bg-gray-200 rounded" />
                            <div className="w-24 h-3 bg-gray-100 rounded" />
                          </div>
                        </div>
                        <div className="w-20 h-4 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : availableSchedules.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                    <CalendarDays className="w-8 h-8" strokeWidth={1.5} />
                    <p className="text-sm text-gray-400">
                      Aucun créneau ce jour-là
                    </p>
                    <p className="text-xs text-gray-300">
                      Choisissez une autre date
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {availableSchedules.map((s: any) => {
                      const isSelected =
                        s.id.toString() === selectedScheduleId?.toString();
                      const isDisabled =
                        s.isPast || s.isFull || s.isMaintenance;
                      let statusText = `${s.restantes} place${s.restantes > 1 ? "s" : ""} restante${s.restantes > 1 ? "s" : ""}`;
                      if (s.isPast) statusText = "Départ passé";
                      else if (s.isMaintenance) statusText = "Bus indisponible";
                      else if (s.isFull) statusText = "Complet";

                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedScheduleId(s.id.toString())}
                          className={`group flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-left ${
                            isSelected
                              ? "border-cnt-blue bg-cnt-blue/[0.04]"
                              : isDisabled
                                ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                : "border-gray-100 hover:border-cnt-blue/40 hover:bg-cnt-blue/[0.03]"
                          }`}>
                          <div className="flex items-center gap-3">
                            <Clock
                              className={`w-4 h-4 transition-colors ${
                                isSelected
                                  ? "text-cnt-blue"
                                  : "text-gray-300 group-hover:text-cnt-blue"
                              }`}
                            />
                            <div>
                              <span className="font-semibold text-gray-900 text-sm">
                                {s.heureDepart}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                arrivée ~{s.heureArriveeEstimee}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-medium ${isDisabled ? "text-red-500" : "text-cnt-green"}`}>
                              {statusText}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-cnt-blue" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Bouton de confirmation */}
                {availableSchedules.length > 0 && !loadingSchedules && (
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={!selectedSchedule}
                      className="w-full bg-cnt-green hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors">
                      {selectedSchedule
                        ? `Réserver le départ de ${selectedSchedule.heureDepart}`
                        : "Choisissez un horaire"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                <Clock className="w-8 h-8" strokeWidth={1.5} />
                <p className="text-sm text-gray-400">Sélectionnez une date</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Clock, CalendarDays, Check, ArrowRight } from "lucide-react";
import { getAvailableSchedules } from "@/app/actions/tickets";
import { fr } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HeroSchedulePickerProps {
  route: any;
  customTrigger: React.ReactNode;
  onScheduleSelect: (schedule: any, dateStr: string) => void;
}

export default function HeroSchedulePicker({ route, customTrigger, onScheduleSelect }: HeroSchedulePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const activeDates = new Set(route.schedules?.map((s: any) => s.dateVoyage) || []);

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
  }, [selectedDateStr, route.cityDepart?.nom, route.cityArrivee?.nom]);

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedScheduleId(null);
  };

  const handleScheduleClick = (s: any) => {
    setSelectedScheduleId(s.id.toString());
    if (selectedDateStr) {
      onScheduleSelect(s, selectedDateStr);
      setOpen(false); // Close the dialog after selection
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        {customTrigger}
      </div>

      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            {route?.cityDepart?.nom}
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            {route?.cityArrivee?.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[auto_1fr] gap-0 md:divide-x divide-gray-100">
          {/* Section Calendrier (Gauche) */}
          <div className="p-4 flex justify-center md:justify-start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              locale={fr}
              className="rounded-md"
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isBeforeToday = date < today;
                const dStr = formatDateForSearch(date);
                return isBeforeToday || !activeDates.has(dStr);
              }}
            />
          </div>

          {/* Section Horaires (Droite) */}
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
                  <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
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
                          onClick={() => handleScheduleClick(s)}
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
                                {s.bus?.immatriculation || "Bus assigné"}
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

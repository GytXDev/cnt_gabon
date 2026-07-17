"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HeroSchedulePicker from "@/components/HeroSchedulePicker";

import { getAllRoutes } from "@/app/actions/tickets";
import { Loader2 } from "lucide-react";

export default function HeroBookingWidget() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  useEffect(() => {
    getAllRoutes()
      .then((data) => {
        setRoutes(data);
        setLoadingRoutes(false);
      })
      .catch(console.error);
  }, []);

  const [transportMode, setTransportMode] = useState("bus");
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<{
    schedule: any;
    dateStr: string;
  } | null>(null);
  const router = useRouter();

  const GRAND_LIBREVILLE_CITIES = ["Libreville", "Akanda", "Owendo", "Ntoum"];

  const getRouteCategory = (r: any) => {
    if (!r) return "";
    const isGL =
      GRAND_LIBREVILLE_CITIES.includes(r.cityDepart?.nom) &&
      GRAND_LIBREVILLE_CITIES.includes(r.cityArrivee?.nom);
    return isGL ? "Grand Libreville" : "Intérieur du Pays";
  };

  // La route exacte sélectionnée
  const selectedRoute = routes.find((r) => r.id.toString() === selectedRouteId);

  const routesGL = routes.filter(
    (r) => getRouteCategory(r) === "Grand Libreville",
  );
  const routesInterieur = routes.filter(
    (r) => getRouteCategory(r) === "Intérieur du Pays",
  );

  // Gérer le changement de route
  const handleRouteChange = (val: string) => {
    setSelectedRouteId(val);
    setSelectedSchedule(null);
  };

  const handleBooking = () => {
    if (!selectedRoute || !selectedSchedule) return;
    const params = new URLSearchParams({
      depart: selectedRoute.cityDepart.nom,
      arrivee: selectedRoute.cityArrivee.nom,
      date: selectedSchedule.dateStr,
      heureDepart: selectedSchedule.schedule.heureDepart,
      type: getRouteCategory(selectedRoute),
      montant: selectedRoute.prixStandard.toString(),
    });
    router.push(`/achat-billet?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* TRANSPORT MODES TABS */}
      <div className="flex justify-center mb-6 max-w-full overflow-hidden">
        <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex items-center space-x-1.5 sm:space-x-2 border border-white/20 shadow-lg max-w-full overflow-x-auto overflow-y-hidden scrollbar-none">
          {[
            { mode: "bus", icon: "/icons/bus.png", label: "Bus" },
            { mode: "train", icon: "/icons/transport.png", label: "Train" },
            { mode: "bateau", icon: "/icons/yatch.png", label: "Bateau" },
            { mode: "avion", icon: "/icons/plane.png", label: "Avion" },
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setTransportMode(mode)}
              className={cn(
                "flex items-center px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all",
                transportMode === mode
                  ? "bg-cnt-green text-white shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/20",
              )}>
              <Image
                src={icon}
                alt={label}
                width={18}
                height={18}
                className="mr-1.5 sm:mr-2 object-contain brightness-0 invert"
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH FORM */}
      <div className="bg-white/95 rounded-2xl shadow-2xl p-4 md:p-5 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="space-y-1 relative md:col-span-4">
            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Type de trajet
            </Label>
            <div className="relative">
              <Image
                src="/icons/tickets.png"
                alt="Billet"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-90 object-contain"
                style={{
                  filter:
                    "invert(82%) sepia(63%) saturate(1312%) hue-rotate(355deg) brightness(101%) contrast(95%)",
                }}
              />
              <Select
                value={selectedRouteId}
                onValueChange={handleRouteChange}
                disabled={loadingRoutes}>
                <SelectTrigger
                  className={cn(
                    "w-full overflow-hidden pl-10 bg-gray-50/50 hover:bg-white focus:bg-white !h-[46px] border-gray-200 rounded-xl focus:ring-2 focus:ring-cnt-green/30 focus:border-cnt-green transition-all text-sm",
                    !selectedRouteId && "text-gray-400",
                  )}>
                  {loadingRoutes ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cnt-green" />
                      <span>Chargement...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Sélectionner un trajet">
                      {selectedRoute
                        ? getRouteCategory(selectedRoute)
                        : "Sélectionner un trajet"}
                    </SelectValue>
                  )}
                </SelectTrigger>

                <SelectContent
                  alignItemWithTrigger={false}
                  side="bottom"
                  className="max-h-72 p-1.5 rounded-2xl border border-gray-100 shadow-xl shadow-black/10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                  {routes.length === 0 && !loadingRoutes ? (
                    <div className="p-4 text-sm text-gray-400 text-center">
                      Aucun trajet disponible
                    </div>
                  ) : (
                    <>
                      {routesGL.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm font-bold text-cnt-blue sticky top-0 z-10 uppercase text-[10px] tracking-wider py-2 px-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cnt-blue" />
                            Grand Libreville
                          </SelectLabel>
                          {routesGL.map((r: any) => {
                            const hasSchedules =
                              r.schedules && r.schedules.length > 0;
                            return (
                              <SelectItem
                                key={r.id}
                                value={r.id.toString()}
                                disabled={!hasSchedules}
                                className={cn(
                                  "group relative mx-1 my-0.5 rounded-lg pl-7 pr-3 py-2.5 text-sm transition-colors cursor-pointer",
                                  "focus:bg-cnt-blue/10 focus:text-cnt-blue data-[state=checked]:bg-cnt-blue/10 data-[state=checked]:text-cnt-blue data-[state=checked]:font-medium",
                                  hasSchedules
                                    ? "text-gray-700 hover:bg-gray-50"
                                    : "text-gray-300 cursor-not-allowed opacity-70",
                                )}>
                                <span className="flex items-center justify-between w-full">
                                  <span className="truncate">
                                    {r.cityDepart?.nom}{" "}
                                    <span className="text-gray-300 mx-1">
                                      →
                                    </span>{" "}
                                    {r.cityArrivee?.nom}
                                  </span>
                                  {!hasSchedules && (
                                    <span className="ml-2 shrink-0 text-[9px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                                      Non disponible
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      )}

                      {routesInterieur.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm font-bold text-cnt-green sticky top-0 z-10 uppercase text-[10px] tracking-wider py-2 px-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cnt-green" />
                            Intérieur du pays
                          </SelectLabel>
                          {routesInterieur.map((r: any) => {
                            const hasSchedules =
                              r.schedules && r.schedules.length > 0;
                            return (
                              <SelectItem
                                key={r.id}
                                value={r.id.toString()}
                                disabled={!hasSchedules}
                                className={cn(
                                  "group relative mx-1 my-0.5 rounded-lg pl-7 pr-3 py-2.5 text-sm transition-colors cursor-pointer",
                                  "focus:bg-cnt-green/10 focus:text-cnt-green data-[state=checked]:bg-cnt-green/10 data-[state=checked]:text-cnt-green data-[state=checked]:font-medium",
                                  hasSchedules
                                    ? "text-gray-700 hover:bg-gray-50"
                                    : "text-gray-300 cursor-not-allowed opacity-70",
                                )}>
                                <span className="flex items-center justify-between w-full">
                                  <span className="truncate">
                                    {r.cityDepart?.nom}{" "}
                                    <span className="text-gray-300 mx-1">
                                      →
                                    </span>{" "}
                                    {r.cityArrivee?.nom}
                                  </span>
                                  {!hasSchedules && (
                                    <span className="ml-2 shrink-0 text-[9px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                                      Non disponible
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── DÉPART (Readonly) ── */}
          <div className="space-y-1 relative md:col-span-2">
            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Départ
            </Label>
            <div className="relative">
              <Image
                src="/icons/origin.png"
                alt="Départ"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-90 object-contain"
                style={{
                  filter:
                    "invert(37%) sepia(51%) saturate(651%) hue-rotate(101deg) brightness(96%) contrast(88%)",
                }}
              />
              <div
                className={cn(
                  "w-full flex items-center pl-10 pr-3 bg-gray-50/50 h-[46px] border border-gray-200 rounded-xl text-sm transition-colors cursor-not-allowed overflow-hidden",
                  selectedRoute ? "text-gray-900" : "text-gray-400",
                )}>
                <span className="truncate w-full">
                  {selectedRoute ? selectedRoute.cityDepart?.nom : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* ── ARRIVÉE (Readonly) ── */}
          <div className="space-y-1 relative md:col-span-2">
            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Arrivée
            </Label>
            <div className="relative">
              <Image
                src="/icons/destination.png"
                alt="Lieu"
                width={20}
                height={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-90 object-contain"
                style={{
                  filter:
                    "invert(15%) sepia(35%) saturate(3000%) hue-rotate(188deg) brightness(90%) contrast(100%)",
                }}
              />
              <div
                className={cn(
                  "w-full flex items-center pl-10 pr-3 bg-gray-50/50 h-[46px] border border-gray-200 rounded-xl text-sm transition-colors cursor-not-allowed overflow-hidden",
                  selectedRoute ? "text-gray-900" : "text-gray-400",
                )}>
                <span className="truncate w-full">
                  {selectedRoute ? selectedRoute.cityArrivee?.nom : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* ── DATE & HEURE ── */}
          <div className="space-y-1 relative md:col-span-2">
            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Date
            </Label>
            <div className="relative">
              {selectedRoute ? (
                <HeroSchedulePicker
                  route={selectedRoute}
                  onScheduleSelect={(s, d) =>
                    setSelectedSchedule({ schedule: s, dateStr: d })
                  }
                  customTrigger={
                    <button
                      className={cn(
                        "w-full flex items-center bg-gray-50/50 hover:bg-white focus:bg-white h-[46px] border border-gray-200 rounded-xl justify-start text-left font-normal transition-colors text-sm pl-3 pr-3",
                        !selectedSchedule && "text-gray-400",
                      )}>
                      <Image
                        src="/icons/calendar.png"
                        alt="Date"
                        width={20}
                        height={20}
                        className="mr-2.5 h-5 w-5 text-gray-500 opacity-80"
                      />
                      <span className="truncate">
                        {selectedSchedule
                          ? `${new Date(selectedSchedule.dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} à ${selectedSchedule.schedule.heureDepart}`
                          : "Choisir date et heure"}
                      </span>
                    </button>
                  }
                />
              ) : (
                <div className="w-full flex items-center bg-gray-50/50 h-[46px] border border-gray-200 rounded-xl text-left font-normal text-sm pl-3 text-gray-400 opacity-60 cursor-not-allowed">
                  <Image
                    src="/icons/calendar.png"
                    alt="Date"
                    width={20}
                    height={20}
                    className="mr-2.5 h-5 w-5 text-gray-500 opacity-80"
                  />
                  <span>Choisir date et heure</span>
                </div>
              )}
            </div>
          </div>

          {/* ── ACTION ── */}
          <div className="flex items-end md:col-span-2">
            <button
              onClick={handleBooking}
              disabled={!selectedSchedule}
              className={cn(
                "w-full font-semibold text-sm rounded-xl shadow-md h-[46px] flex items-center justify-center gap-2 transition-all",
                selectedSchedule
                  ? "bg-cnt-green hover:bg-[#15673a] text-white hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              )}>
              Réserver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

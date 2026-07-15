'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Navigation, Bus, Clock, Wifi, WifiOff,
  ArrowLeft, RefreshCw, Route, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

// BUS ID DE DÉMONSTRATION — correspond à l'UUID inséré en DB via seed-bus.ts
const DEMO_BUS_ID = '00000000-0000-4000-8000-000000000001';


// Coordonnées de simulation : Libreville → Lambaréné
const ROUTE_WAYPOINTS = [
  { lat: 0.3924, lng: 9.4536, label: 'Libreville (départ)', dist: 0 },
  { lat: 0.2, lng: 9.8, label: 'Ntoum', dist: 45 },
  { lat: 0.0, lng: 10.0, label: 'Bifoun', dist: 100 },
  { lat: -0.3, lng: 10.1, label: 'Abanga', dist: 160 },
  { lat: -0.7, lng: 10.2333, label: 'Lambaréné (arrivée)', dist: 253 },
];

interface BusPosition {
  lat: number;
  lng: number;
  speedKmh: number | null;
  timestamp: string;
}

function formatTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Calcule la distance parcourue simulée en %
function getSimulatedProgress() {
  const now = new Date();
  const sec = now.getSeconds() + now.getMinutes() * 60;
  return (sec % 600) / 600; // 10 min pour "faire" le trajet
}

export default function SuiviPage() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const [position, setPosition] = useState<BusPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const [isMounted, setIsMounted] = useState(false);
  const mapIframeRef = useRef<HTMLIFrameElement>(null);
  
  const [isArrived, setIsArrived] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Simulation GPS en l'absence de vrai bus
  useEffect(() => {
    if (isArrived) {
      // Set to final point exactly
      const finalPos: BusPosition = {
        lat: ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lat,
        lng: ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lng,
        speedKmh: 0,
        timestamp: new Date().toISOString(),
      };
      setPosition(finalPos);
      setLastRefresh(new Date());
      setLoading(false);
      return;
    }

    const simulate = () => {
      setProgress((prev) => {
        const next = prev + 0.05; // 5% per step
        const currentProgress = next >= 1.0 ? 1.0 : next;
        
        if (currentProgress === 1.0) {
          setIsArrived(true);
        }

        const totalWaypoints = ROUTE_WAYPOINTS.length - 1;
        const waypointIdx = Math.min(Math.floor(currentProgress * totalWaypoints), totalWaypoints - 1);
        setCurrentWaypoint(waypointIdx);

        const start = ROUTE_WAYPOINTS[waypointIdx];
        const end = ROUTE_WAYPOINTS[Math.min(waypointIdx + 1, totalWaypoints)];
        const localProgress = (currentProgress * totalWaypoints) - waypointIdx;

        const lat = start.lat + (end.lat - start.lat) * localProgress;
        const lng = start.lng + (end.lng - start.lng) * localProgress;

        const simPos: BusPosition = {
          lat: parseFloat(lat.toFixed(4)),
          lng: parseFloat(lng.toFixed(4)),
          speedKmh: currentProgress === 1.0 ? 0 : Math.round(60 + Math.random() * 20),
          timestamp: new Date().toISOString(),
        };
        setPosition(simPos);
        setLastRefresh(new Date());

        // Poster la position en DB
        fetch(`/api/buses/${DEMO_BUS_ID}/position`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: simPos.lat, lng: simPos.lng, speedKmh: simPos.speedKmh }),
        }).catch(() => {});

        return currentProgress;
      });
    };

    simulate();
    setLoading(false);
    const interval = setInterval(simulate, 3000);
    return () => clearInterval(interval);
  }, [isArrived]);

  const handleResetSimulation = () => {
    setProgress(0);
    setIsArrived(false);
    setCurrentWaypoint(0);
    setLoading(true);
  };

  const distanceParcourue = Math.round(253 * progress);
  const distanceRestante = 253 - distanceParcourue;
  const heureEstimeeArrivee = isArrived ? "Arrivé" : (isMounted && position
    ? new Date(Date.now() + (distanceRestante / 70) * 3600000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—');

  useEffect(() => {
    if (isMounted && position && mapIframeRef.current?.contentWindow && iframeLoaded) {
      try {
        const iframeWin = mapIframeRef.current.contentWindow as any;
        if (iframeWin.updateBusPosition) {
          iframeWin.updateBusPosition(position.lat, position.lng, position.speedKmh || 0);
        }
      } catch (e) {
        console.warn("Iframe update deferred:", e);
      }
    }
  }, [isMounted, position, iframeLoaded]);



  return (
    <div className="min-h-screen bg-gray-50 font-sans">



      {/* BREADCRUMB / HEADER */}
      <div className="bg-cnt-blue shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push("/")}>Accueil</span>
            <span className="text-white/40">/</span>
            <span className="text-[#F1C40F] font-semibold">Suivi GPS</span>
          </div>
          {isLoaded && isSignedIn && (
            <a href="/mon-espace" className="flex items-center gap-2 text-sm text-white font-medium hover:text-[#F1C40F] transition-colors">
              <div className="w-7 h-7 rounded-full bg-[#F1C40F]/20 border border-[#F1C40F] flex items-center justify-center text-[#F1C40F] text-[10px] font-bold">
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
              <span>Mon Espace</span>
            </a>
          )}
        </div>
      </div>

      {/* PAGE TITLE */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Suivi GPS en direct
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Libreville → Lambaréné (démonstration)
          </p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${online ? 'bg-[#1E824C]/25 text-[#1E824C]' : 'bg-red-500/20 text-red-600'}`}>
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {online ? 'En direct' : 'Hors ligne'}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* STATS RAPIDES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Distance parcourue',
              value: `${distanceParcourue} km`,
              sub: `sur 253 km`,
              color: 'text-cnt-blue',
              icon: <Route className="w-5 h-5 text-cnt-blue" />,
            },
            {
              label: 'Distance restante',
              value: `${distanceRestante} km`,
              sub: `estimée`,
              color: 'text-cnt-green',
              icon: <Image src="/icons/distance-travelled.png" alt="Distance" width={24} height={24} className="w-5 h-5 text-cnt-green" />,
            },
            {
              label: 'Vitesse actuelle',
              value: isArrived ? '0 km/h (À l\'arrêt)' : (position ? `${Math.round(position.speedKmh || 0)} km/h` : '—'),
              sub: isArrived ? 'Trajet terminé' : 'moyenne',
              color: 'text-[#F1C40F]',
              icon: <Image src="/icons/speedometer.png" alt="Speedometer" width={24} height={24} className="w-5 h-5" />,
            },
            {
              label: 'Arrivée estimée',
              value: isArrived ? 'Arrivé' : heureEstimeeArrivee,
              sub: 'à Lambaréné',
              color: 'text-cnt-blue',
              icon: <Image src="/icons/clock.png" alt="Clock" width={24} height={24} className="w-5 h-5" />,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">{s.icon}</div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-gray-300">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* BARRE DE PROGRESSION */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Progression du trajet</span>
            <span className="text-sm font-bold text-cnt-blue">{Math.round(progress * 100)}%</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cnt-blue to-cnt-green rounded-full transition-all duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
            {/* Points d'étape */}
            {ROUTE_WAYPOINTS.map((wp, i) => (
              <div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                  i <= currentWaypoint ? 'bg-cnt-green' : 'bg-gray-300'
                }`}
                style={{ left: `${(wp.dist / 253) * 100}%`, transform: 'translate(-50%, -50%)' }}
                title={wp.label}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>Libreville</span>
            <span>Ntoum</span>
            <span>Bifoun</span>
            <span>Abanga</span>
            <span>Lambaréné</span>
          </div>
        </div>

        {/* CARTE + INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

          {/* CARTE OSM */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/icons/bus.png" alt="Bus" width={24} height={24} className="w-5 h-5 text-cnt-blue" />
                <span className="font-semibold text-sm text-gray-700">Position GPS du bus</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <RefreshCw className="w-3 h-3" />
                MàJ: {isMounted ? formatTime(lastRefresh.toISOString()) : '—'}
              </div>
            </div>
            {loading ? (
              <div className="h-80 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-cnt-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Chargement de la carte…</p>
                </div>
              </div>
            ) : (
              <div className="relative h-96 w-full">
                <iframe
                  ref={mapIframeRef}
                  onLoad={() => setIframeLoaded(true)}
                  title="Carte GPS Live Bus CNT"
                  src="/map.html"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
                {/* Overlay bus marker */}
                <div className="absolute top-3 right-3 bg-cnt-blue text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg flex items-center gap-1.5 z-[1000]">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isArrived ? 'bg-[#F1C40F]' : 'bg-[#1E824C]'}`} />
                  {isArrived ? 'Trajet terminé' : 'En direct'}
                </div>
              </div>
            )}
          </div>

          {/* INFOS LATÉRALES */}
          <div className="space-y-4">
            {/* Position courante */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
           Position actuelle
              </h3>
              {position ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Latitude</span>
                    <span className="font-mono text-gray-800">{position.lat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Longitude</span>
                    <span className="font-mono text-gray-800">{position.lng}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vitesse</span>
                    <span className="font-semibold text-cnt-green">{Math.round(position.speedKmh || 0)} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Maj</span>
                    <span className="text-gray-600">{isMounted ? formatTime(position.timestamp) : '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">En attente de données GPS…</p>
              )}
            </div>

            {isArrived ? (
              <div className="bg-gradient-to-br from-[#1E824C] to-[#166534] rounded-2xl p-4 text-white shadow-md">
                <h3 className="font-semibold text-sm mb-2 opacity-95 flex items-center gap-1.5">
                  Voyage terminé
                </h3>
                <p className="font-bold text-base">Arrivé à Lambaréné</p>
                <p className="text-xs opacity-85 mt-1">Le bus est stationné au terminus.</p>
                <Button 
                  onClick={handleResetSimulation}
                  className="w-full mt-3 bg-white text-[#1E824C] hover:bg-white/90 font-bold h-9 rounded-xl text-xs transition"
                >
                  Relancer la simulation
                </Button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-cnt-blue to-blue-800 rounded-2xl p-4 text-white">
                <h3 className="font-semibold text-sm mb-2 opacity-80">Prochaine étape</h3>
                <p className="font-bold text-base">{ROUTE_WAYPOINTS[Math.min(currentWaypoint + 1, ROUTE_WAYPOINTS.length - 1)].label}</p>
                <p className="text-xs opacity-70 mt-1">
                  dans ~{Math.round((ROUTE_WAYPOINTS[Math.min(currentWaypoint + 1, ROUTE_WAYPOINTS.length - 1)].dist - distanceParcourue))} km
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

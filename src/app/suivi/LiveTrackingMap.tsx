'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface BusPosition {
  lat: number;
  lng: number;
  speedKmh: number | null;
  timestamp: string;
}

interface LiveTrackingMapProps {
  busId: string;
  scheduleId: number;
  routeName: string;
  departureTime: string;
  distanceTotal: number;
  departure: { lat: number; lng: number; name: string };
  arrival: { lat: number; lng: number; name: string };
}

export default function LiveTrackingMap({ 
  busId, 
  scheduleId, 
  routeName, 
  departureTime,
  distanceTotal,
  departure,
  arrival
}: LiveTrackingMapProps) {
  
  const [position, setPosition] = useState<BusPosition | null>(null);
  const [loading, setLoading] = useState(true); // iframe loading state
  const [online, setOnline] = useState(false); // Do we have a GPS signal?
  const [waitingForSignal, setWaitingForSignal] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  const mapIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Polling function
    const fetchPosition = async () => {
      try {
        const res = await fetch(`/api/buses/${busId}/position`);
        if (res.status === 404) {
          // Pas encore de position
          setOnline(false);
          setWaitingForSignal(true);
          return;
        }

        const data = await res.json();
        if (data.success && data.position) {
          setPosition(data.position);
          setLastRefresh(new Date(data.position.timestamp));
          setOnline(true);
          setWaitingForSignal(false);
        } else {
          setOnline(false);
        }
      } catch (error) {
        console.error("Error fetching bus position", error);
        setOnline(false);
      }
    };

    // Initial fetch
    fetchPosition();

    // Poll every 10 seconds
    const interval = setInterval(fetchPosition, 10000);
    return () => clearInterval(interval);
  }, [busId]);

  // Update map iframe when position changes
  useEffect(() => {
    if (mapIframeRef.current?.contentWindow && iframeLoaded) {
      try {
        const iframeWin = mapIframeRef.current.contentWindow as any;
        
        // Initialize route if method exists
        if (iframeWin.initRoute) {
          const waypoints = [
            [departure.lat, departure.lng],
            [arrival.lat, arrival.lng]
          ];
          iframeWin.initRoute(waypoints, departure.name, arrival.name);
        }

        // Update position if available
        if (position && iframeWin.updateBusPosition) {
          iframeWin.updateBusPosition(position.lat, position.lng, position.speedKmh || 0);
        }
      } catch (e) {
        console.warn("Iframe update deferred:", e);
      }
    }
  }, [position, iframeLoaded, departure, arrival]);

  function formatTime(d: Date | null) {
    if (!d) return '—';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  return (
    <div className="w-full h-full relative bg-gray-100">
      
      {/* MAP IFRAME */}
      <iframe
        ref={mapIframeRef}
        onLoad={() => {
          setIframeLoaded(true);
          setLoading(false);
        }}
        title="Carte GPS Live Bus CNT"
        src="/map.html"
        className="w-full h-full border-0 absolute inset-0"
        loading="lazy"
      />
      
      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-cnt-blue border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-cnt-blue font-medium shadow-sm">Chargement de la carte…</p>
          </div>
        </div>
      )}

      {/* NO SIGNAL OVERLAY */}
      {!loading && waitingForSignal && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] bg-white/95 backdrop-blur-md px-6 py-5 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-sm border border-gray-100">
          <AlertCircle className="w-10 h-10 text-cnt-yellow mb-3" />
          <h3 className="font-bold text-gray-800 text-lg mb-1">En attente de signal</h3>
          <p className="text-sm text-gray-500">
            Le système GPS du bus n'a pas encore émis de position. Veuillez patienter, l'affichage se mettra à jour automatiquement.
          </p>
        </div>
      )}

      {/* FLOATING HEADER OVERLAY */}
      <div className="absolute top-4 left-4 right-4 md:left-6 md:top-6 z-[40] pointer-events-none">
        <div className="max-w-md bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4 pointer-events-auto">
          
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-xl font-bold text-cnt-blue leading-tight">{routeName}</h2>
              <p className="text-sm text-gray-500 font-medium">Départ : {departureTime}</p>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {online ? 'En direct' : 'Hors ligne'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-0.5">Vitesse</p>
              <p className="text-xl font-semibold text-gray-800">
                {position ? Math.round(position.speedKmh || 0) : '—'} <span className="text-sm text-gray-400 font-medium">km/h</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-0.5 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Dernière MàJ
              </p>
              <p className="text-base font-semibold text-gray-700 mt-1">
                {formatTime(lastRefresh)}
              </p>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}

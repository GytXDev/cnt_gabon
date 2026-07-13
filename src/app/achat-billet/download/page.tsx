'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  ArrowLeft, Download, CheckCircle2, MapPin, Calendar, Bus, Train, Ship, Plane,
  Printer, Loader2, Share2, Mail
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';

// ---------- HELPERS ----------

function getModeIcon(mode: string, className: string = "w-5 h-5 object-contain", style: React.CSSProperties = {}) {
  switch (mode) {
    case "train":
      return <img src="/icons/transport.png" alt="Train" className={className} style={style} width={20} height={20} />;
    case "bateau":
      return <img src="/icons/yatch.png" alt="Bateau" className={className} style={style} width={20} height={20} />;
    case "avion":
      return <img src="/icons/plane.png" alt="Avion" className={className} style={style} width={20} height={20} />;
    default:
      return <img src="/icons/bus.png" alt="Bus" className={className} style={style} width={20} height={20} />;
  }
}

function getModeLabel(mode: string) {
  switch (mode) {
    case 'train': return 'Train';
    case 'bateau': return 'Bateau';
    case 'avion': return 'Avion';
    default: return 'Bus';
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ---------- MAIN COMPONENT ----------

function DownloadTicketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const ref = searchParams.get('ref');
  const depart = searchParams.get('depart');
  const arrivee = searchParams.get('arrivee');
  const mode = searchParams.get('mode') || 'bus';
  const date = searchParams.get('date');
  const type = searchParams.get('type');
  const montant = searchParams.get('montant');
  const passager = searchParams.get('passager');
  const tid = searchParams.get('tid'); // Transaction ID for QR code mapping

  // Protect route if no ticket data
  useEffect(() => {
    if (!ref || !depart) {
      router.replace('/');
    }
  }, [ref, depart, router]);

  if (!ref || !depart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cnt-blue" />
      </div>
    );
  }

  const handleDownloadImage = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);

    try {
      // Temporarily remove shadow for better export
      const originalClass = ticketRef.current.className;
      ticketRef.current.className = originalClass.replace('shadow-2xl', '');

      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Restore class
      ticketRef.current.className = originalClass;

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `CNT_Billet_${ref}.png`;
      link.click();
    } catch (error) {
      console.error("Erreur lors de la génération de l'image:", error);
      alert("Une erreur est survenue lors du téléchargement.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16 print:bg-white print:pb-0">

      {/* BREADCRUMB */}
      <div className="bg-cnt-blue shadow-md print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push("/")}>Accueil</span>
            <span className="text-white/40">/</span>
            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push(`/achat-billet?depart=${depart}&arrivee=${arrivee}&type=${type}&mode=${mode}&date=${date}&montant=${montant}`)}>Achat de billet</span>
            <span className="text-white/40">/</span>
            <span className="text-cnt-yellow font-semibold">Votre Billet</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:pt-0 print:px-0">

        {/* SUCCESS MESSAGE - Hidden when printing */}
        <div className="text-center mb-10 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement validé !</h1>
          <p className="text-gray-500">
            Votre réservation a été confirmée avec succès. Voici votre billet.
          </p>
        </div>

        {/* ACTIONS - Hidden when printing */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 print:hidden">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 rounded-xl h-11 px-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Button>

          <Button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="bg-cnt-blue hover:bg-blue-900 text-white gap-2 rounded-xl h-11 px-6 shadow-md"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Génération..." : "Télécharger (Image)"}
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 rounded-xl h-11 px-6"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
          
          <Button
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 rounded-xl h-11 px-4"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 rounded-xl h-11 px-4"
          >
            <Mail className="w-4 h-4" />
          </Button>
        </div>

        {/* TICKET WRAPPER (This part is printed/downloaded) */}
        <div className="flex justify-center print:block">
          <div className="w-full max-w-[360px] print:max-w-none print:w-[9cm] print:mx-auto">
            
            {/* ACTUAL TICKET */}
            <div
              ref={ticketRef}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:border print:border-gray-300"
            >
              {/* Header */}
              <div className="bg-cnt-blue px-5 py-4 print:bg-[#0a2342] print:text-white" style={{ backgroundColor: '#0a2342', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* Using a standard img tag instead of Next/Image for better html2canvas compatibility */}
                    <img src="/logo.png" alt="CNT" className="w-7 h-7 object-contain" />
                    <div>
                      <p className="font-bold text-xs leading-tight text-white">CNT Gabon</p>
                      <p className="text-white/70 text-[9px] uppercase tracking-widest">Billet de Transport</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-[9px] uppercase tracking-widest">Réf.</p>
                    <p className="text-[#f1c40f] font-mono text-xs font-bold">{ref}</p>
                  </div>
                </div>

                {/* Trajet */}
                <div className="flex items-center justify-between mt-4">
                  <div className="w-[42%]">
                    <p className="text-white/60 text-[9px] uppercase tracking-widest">Départ</p>
                    <p className="font-bold text-lg leading-tight text-white">{depart}</p>
                  </div>
                  
                  <div className="flex flex-col items-center w-[16%]">
                    <div className="text-[#f1c40f]">
                      {getModeIcon(mode, "w-5 h-5 object-contain", { filter: 'invert(82%) sepia(55%) saturate(1394%) hue-rotate(345deg) brightness(100%) contrast(98%)' })}
                    </div>
                    <div className="w-full h-px bg-white/30 my-1 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#f1c40f]"></div>
                    </div>
                    <p className="text-white/60 text-[8px] uppercase">{getModeLabel(mode)}</p>
                  </div>
                  
                  <div className="text-right w-[42%]">
                    <p className="text-white/60 text-[9px] uppercase tracking-widest">Arrivée</p>
                    <p className="font-bold text-lg leading-tight text-white">{arrivee}</p>
                  </div>
                </div>
              </div>

              {/* Perforation */}
              <div className="relative flex items-center bg-white">
                <div className="w-4 h-4 rounded-full bg-gray-50 print:bg-white -ml-2 shrink-0 border-r border-gray-200"></div>
                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1"></div>
                <div className="w-4 h-4 rounded-full bg-gray-50 print:bg-white -mr-2 shrink-0 border-l border-gray-200"></div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 bg-white">
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Passager
                    </p>
                    <p className="font-bold text-sm text-gray-800">{passager}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> Départ
                    </p>
                    <p className="font-bold text-sm text-gray-800">{formatDate(date || '')}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5">Type</p>
                    <p className="font-semibold text-xs text-gray-800 bg-gray-100 inline-block px-1.5 py-0.5 rounded">{type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5">Montant</p>
                    <p className="font-bold text-base text-cnt-green">{parseInt(montant || '0').toLocaleString('fr-FR')} FCFA</p>
                  </div>
                </div>

                {/* QR Code generator placeholder */}
                <div className="mt-4 flex flex-col items-center justify-center pt-4 border-t border-gray-100">
                  <div className="w-24 h-24 bg-white p-1 border border-gray-200 rounded-lg relative flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${ref}`} 
                      alt="QR Code" 
                      className="w-22 h-22 object-contain" 
                      crossOrigin="anonymous"
                    />
                  </div>
                  <p className="text-[9px] font-mono text-gray-500 mt-2 tracking-widest">TID: {tid || 'N/A'}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5 uppercase text-center max-w-[200px]">
                    Présentez ce QR Code à l'embarquement
                  </p>
                </div>
              </div>
              
              {/* Footer text */}
              <div className="bg-gray-50 px-5 py-2.5 text-center print:bg-white print:border-t print:border-gray-200" style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                 <p className="text-[8px] text-gray-400">
                   Billet non remboursable. Présentez-vous 30 min avant le départ.
                 </p>
                 <p className="text-[8px] text-gray-400 mt-0.5">
                   Émis le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                 </p>
              </div>
            </div>

          </div>
        </div>
        
        {/* Help box */}
        <div className="text-center mt-8 text-xs text-gray-500 flex items-center justify-center gap-1.5 print:hidden">
          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
          <span>Besoin d'aide ? Contactez le support au <strong className="text-cnt-blue">011 00 00 00</strong></span>
        </div>

      </div>
    </div>
  );
}

export default function DownloadTicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cnt-blue" />
      </div>
    }>
      <DownloadTicketContent />
    </Suspense>
  );
}

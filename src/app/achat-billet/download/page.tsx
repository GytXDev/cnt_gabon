'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  ArrowLeft, Download, CheckCircle2, MapPin, Calendar,
  Printer, Loader2, Share2, MessageCircle, QrCode
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

function getModeIcon(mode: string, cls = 'w-5 h-5 object-contain', style: React.CSSProperties = {}) {
  const src = mode === 'train' ? '/icons/transport.png' : mode === 'bateau' ? '/icons/yatch.png' : mode === 'avion' ? '/icons/plane.png' : '/icons/bus.png';
  return <img src={src} alt={mode} className={cls} style={style} />;
}

function getModeLabel(mode: string) {
  return mode === 'train' ? 'Train' : mode === 'bateau' ? 'Bateau' : mode === 'avion' ? 'Avion' : 'Bus';
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StatusBadge({ statut }: { statut: string }) {
  const config: Record<string, { color: string; label: string }> = {
    valide: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '✓ Valide' },
    utilise: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: '✓ Utilisé' },
    annule: { color: 'bg-red-100 text-red-600 border-red-200', label: '✗ Annulé' },
    invalide: { color: 'bg-orange-100 text-orange-600 border-orange-200', label: '⚠ Invalide' },
  };
  const s = config[statut] || config['invalide'];
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${s.color}`}>
      {s.label}
    </span>
  );
}

function DownloadTicketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [ticketSaved, setTicketSaved] = useState(false);
  const [ticketStatut, setTicketStatut] = useState('valide');

  const ref = searchParams.get('ref');
  const depart = searchParams.get('depart');
  const arrivee = searchParams.get('arrivee');
  const mode = searchParams.get('mode') || 'bus';
  const date = searchParams.get('date');
  const type = searchParams.get('type');
  const montant = searchParams.get('montant');
  const passager = searchParams.get('passager') || '';
  const tid = searchParams.get('tid');
  const { user, isSignedIn, isLoaded } = useUser();

  const [passagerPrenom, passagerNom] = passager.split(' ') as [string, string?];

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk to load
    if (!ref || !depart) {
      router.replace('/');
      return;
    }
    // Sauvegarder le ticket en DB et obtenir le vrai QR code
    const saveTicket = async () => {
      try {
        let dbId: string | null = null;
        if (isSignedIn && user) {
          // Sync user to get DB user ID
          const syncRes = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              prenom: user.firstName,
              nom: user.lastName,
            }),
          });
          const syncData = await syncRes.json();
          if (syncData.success) {
            dbId = syncData.user.id;
          }
        }

        const res = await fetch('/api/tickets/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: tid,
            ticketRef: ref,
            depart,
            arrivee,
            mode,
            date,
            type,
            montant,
            passagerPrenom: passagerPrenom || passager,
            passagerNom: passagerNom || '',
            passagerTelephone: null,
            userId: dbId,
          }),
        });
        const data = await res.json();
        if (data.success && data.qrCodeBase64) {
          setQrCodeBase64(data.qrCodeBase64);
          setTicketSaved(true);
        }
      } catch (err) {
        console.error('Erreur sauvegarde ticket:', err);
      }
    };
    saveTicket();
  }, [isLoaded, isSignedIn, user, ref, depart]);

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
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `CNT_Billet_${ref}.png`;
      link.click();
      toast.success('Billet téléchargé !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/api/tickets/verify?ref=${ref}`;
    if (navigator.share) {
      await navigator.share({ title: `Billet CNT — ${ref}`, text: `Mon billet CNT Gabon: ${depart} → ${arrivee}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien de partage copié !');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans pb-16 print:bg-white print:pb-0">

      {/* BREADCRUMB / HEADER */}
      <div className="bg-cnt-blue shadow-md print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push("/")}>Accueil</span>
            <span className="text-white/40">/</span>
            <span className="text-[#F1C40F] font-semibold">Votre Billet</span>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 print:pt-0 print:px-0">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center print:block">

          {/* COLONNE GAUCHE : STATUT & ACTIONS */}
          <div className="flex-1 w-full max-w-md space-y-6 print:hidden">
            {/* SUCCESS BANNER */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-full text-xs font-semibold mb-2">
                Paiement validé — Billet émis
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Votre billet est prêt !</h1>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                {ticketSaved ? 'Billet enregistré avec succès. Le QR code ci-contre est actif et prêt pour l\'embarquement.' : 'Enregistrement de la réservation en cours...'}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Options disponibles</h3>
              <Button onClick={handleDownloadImage} disabled={downloading} className="w-full bg-cnt-blue hover:bg-blue-900 text-white gap-2 rounded-xl h-11 px-5 shadow-sm justify-center font-semibold">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? 'Génération...' : 'Télécharger le billet (Image)'}
              </Button>
              <Button onClick={() => window.print()} variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 rounded-xl h-11 px-5 justify-center">
                <Printer className="w-4 h-4" /> Imprimer le billet PDF
              </Button>
              <Button onClick={handleShare} variant="outline" className="w-full border-cnt-green/30 text-cnt-green hover:bg-emerald-50 gap-2 rounded-xl h-11 px-5 justify-center">
                <Share2 className="w-4 h-4" /> Partager la référence
              </Button>
              <Button
                onClick={() => {
                  const roomId = `${ref?.split('-')[1] || 'r'}_${date}`;
                  router.push(`/chat/${roomId}?passager=${encodeURIComponent(passager)}&ref=${ref}&date=${date}`);
                }}
                className="w-full bg-cnt-green hover:bg-emerald-700 text-white gap-2 rounded-xl h-11 px-5 shadow-sm justify-center font-semibold"
              >
                <Image src="/icons/chat_passager.png" alt="Chat" width={24} height={24} className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} /> Accéder au tchat passagers
              </Button>
            </div>
            
            <div className="text-center text-xs text-gray-400">
              Support technique : <strong className="text-cnt-blue">011 00 00 00</strong>
            </div>
          </div>

          {/* COLONNE DROITE : LE BILLET */}
          <div className="w-full max-w-[380px] print:max-w-none print:w-[9cm] print:mx-auto">
            <div
              ref={ticketRef}
              className="bg-white rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:border print:border-gray-300"
            >
              {/* Header bleu */}
              <div
                className="px-6 py-5"
                style={{ backgroundColor: '#0A3055', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
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

                <div className="flex items-center justify-between mt-4">
                  <div className="w-[42%]">
                    <p className="text-white/60 text-[9px] uppercase tracking-widest">Départ</p>
                    <p className="font-bold text-lg leading-tight text-white">{depart}</p>
                  </div>
                  <div className="flex flex-col items-center w-[16%]">
                    <div style={{ filter: 'invert(82%) sepia(55%) saturate(1394%) hue-rotate(345deg) brightness(100%) contrast(98%)' }}>
                      {getModeIcon(mode, 'w-5 h-5 object-contain')}
                    </div>
                    <div className="w-full h-px bg-white/30 my-1 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#f1c40f]" />
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
                <div className="w-4 h-4 rounded-full bg-gray-50 -ml-2 shrink-0 border-r border-gray-200" />
                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
                <div className="w-4 h-4 rounded-full bg-gray-50 -mr-2 shrink-0 border-l border-gray-200" />
              </div>

              {/* Body */}
              <div className="px-6 py-5 bg-white">
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-5">
                  <div>
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Passager
                    </p>
                    <p className="font-bold text-sm text-gray-800">{passager || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> Date départ
                    </p>
                    <p className="font-bold text-sm text-gray-800">{formatDate(date || '')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5">Type</p>
                    <p className="font-semibold text-xs text-gray-700 bg-gray-100 inline-block px-2 py-0.5 rounded">{type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5">Montant</p>
                    <p className="font-bold text-base text-cnt-green">{parseInt(montant || '0').toLocaleString('fr-FR')} FCFA</p>
                  </div>
                </div>

                {/* Statut */}
                <div className="flex justify-center mb-4">
                  <StatusBadge statut={ticketStatut} />
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center pt-4 border-t border-gray-100">
                  {qrCodeBase64 ? (
                    <div className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <img
                        src={qrCodeBase64}
                        alt="QR Code"
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                      {ticketSaved ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${ref}&color=0A3055`}
                          alt="QR Code"
                          className="w-24 h-24 object-contain"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      )}
                    </div>
                  )}
                  <p className="text-[9px] font-mono text-gray-500 mt-2 tracking-widest">{ref}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5 uppercase text-center max-w-[220px]">
                    Présentez ce QR Code à l'embarquement
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-5 py-3 text-center border-t border-gray-100"
                style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <p className="text-[8px] text-gray-400">Billet non remboursable. Présentez-vous 30 min avant le départ.</p>
                <p className="text-[8px] text-gray-400 mt-0.5">
                  Émis le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
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

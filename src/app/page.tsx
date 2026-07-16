'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import { MapPin, Calendar as CalendarIcon, Ticket, Lock, ArrowRight, Menu, X } from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Villes ────────────────────────────────────────────────────────────────
const DESTINATIONS_GL = ["Libreville", "Owendo", "Akanda"];
const DESTINATIONS_INTERIEUR = ["Lambaréné", "Mouila", "Lebamba", "Tchibanga", "Makokou", "Oyem", "Bitam"];
const ALL_DESTINATIONS = [...DESTINATIONS_GL, ...DESTINATIONS_INTERIEUR];

// ─── Tarification officielle CDC ───────────────────────────────────────────

// Catégorie 1 : Pass Grand Libreville (pas de route fixe)
const PASS_GL: Record<string, number> = {
  'Trajet simple (Grand Libreville)': 200,
  'Passe journalier': 1000,
  'Passe élève': 5000,
  'Passe étudiant': 8000,
  'Passe mensuel': 17000,
  'Passe familial': 35000,
};

// Catégorie 2 : Trajets intérieur (route fixe Libreville → ville)
// Format : { label, montant, arrivee }
const TRAJETS_INTERIEUR: { label: string; montant: number; arrivee: string }[] = [
  { label: 'Libreville–Lambaréné', montant: 5000, arrivee: 'Lambaréné' },
  { label: 'Libreville–Mouila', montant: 8000, arrivee: 'Mouila' },
  { label: 'Libreville–Lebamba', montant: 10000, arrivee: 'Lebamba' },
  { label: 'Libreville–Tchibanga', montant: 12000, arrivee: 'Tchibanga' },
  { label: 'Libreville–Makokou', montant: 12000, arrivee: 'Makokou' },
  { label: 'Libreville–Oyem', montant: 12000, arrivee: 'Oyem' },
  { label: 'Libreville–Bitam', montant: 13000, arrivee: 'Bitam' },
];

function getMontant(type: string): number {
  if (type in PASS_GL) return PASS_GL[type];
  const t = TRAJETS_INTERIEUR.find(t => t.label === type);
  return t ? t.montant : 200;
}

function isTrajetInterieur(type: string): boolean {
  return TRAJETS_INTERIEUR.some(t => t.label === type);
}

export default function Home() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { openSignUp, openSignIn } = useClerk();

  const handleSuiviClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      openSignIn();
    } else {
      router.push('/suivi');
    }
  };

  const [transportMode, setTransportMode] = useState('bus');
  const [departure, setDeparture] = useState('Libreville');
  const [arrival, setArrival] = useState('');
  const [ticketType, setTicketType] = useState(''); // vide = placeholder affiché
  const [date, setDate] = useState<Date>();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Quand on choisit un trajet intérieur ou pass GL → auto-fill + lock
  const handleTicketTypeChange = (value: string) => {
    setTicketType(value);
    if (isTrajetInterieur(value)) {
      const trajet = TRAJETS_INTERIEUR.find(t => t.label === value)!;
      setDeparture('Libreville');
      setArrival(trajet.arrivee);
    } else if (value in PASS_GL) {
      setDeparture('Libreville');
      setArrival('Libreville');
    } else {
      setArrival('');
    }
  };

  const routeLocked = isTrajetInterieur(ticketType) || ticketType in PASS_GL;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticketType) {
      toast.error("Veuillez sélectionner un type de billet.");
      return;
    }
    if (!date) {
      toast.error("Veuillez sélectionner une date de départ.");
      return;
    }
    if (!arrival && !routeLocked) {
      toast.error("Veuillez sélectionner une ville d'arrivée.");
      return;
    }



    const params = new URLSearchParams({
      depart: departure,
      arrivee: arrival || departure,
      type: ticketType,
      mode: transportMode,
      date: format(date, 'yyyy-MM-dd'),
      montant: getMontant(ticketType).toString(),
    });
    router.push(`/achat-billet?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-cnt-bg font-sans text-cnt-text">

      {/* NAVBAR STICKY */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled || mobileMenuOpen ? 'bg-cnt-blue/95 backdrop-blur-md shadow-lg border-b border-white/10 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="Logo" width={42} height={42} className="object-contain mr-2.5 sm:mr-3" unoptimized />
              <span className="font-bold text-xl sm:text-2xl text-white tracking-tight drop-shadow-md">CNT Gabon</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Accueil</a>
              <a href="#" className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Trajets &amp; Horaires</a>
              <a href="/suivi" onClick={handleSuiviClick} className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Suivi GPS</a>
              <div className="flex items-center space-x-4 ml-4 border-l border-white/20 pl-6">
                {isLoaded && isSignedIn ? (
                  <a href="/mon-espace" className="flex items-center gap-2 text-white font-medium hover:text-cnt-yellow transition-colors">
                    <div className="w-7 h-7 rounded-full bg-cnt-yellow/20 border border-cnt-yellow flex items-center justify-center text-cnt-yellow text-xs font-bold">
                      {user.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    Mon Espace
                  </a>
                ) : (
                  <>
                    <button
                      onClick={() => openSignIn()}
                      className="text-white font-medium hover:text-cnt-yellow transition-colors drop-shadow"
                    >
                      Se connecter
                    </button>
                    <Button
                      onClick={() => openSignUp()}
                      className="bg-cnt-yellow hover:bg-yellow-500 text-cnt-blue font-bold px-6 shadow-lg hover:shadow-xl transition-all"
                    >
                      Créer un compte
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Hamburger Button for Mobile */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-cnt-yellow focus:outline-none p-1 transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-cnt-blue/95 backdrop-blur-md border-t border-white/10 px-4 pt-3 pb-6 space-y-3 absolute top-16 left-0 w-full shadow-2xl z-40 transition-all duration-300">
            <a href="#" className="block text-white hover:text-cnt-yellow font-semibold transition-colors py-2.5 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Accueil</a>
            <a href="#" className="block text-white hover:text-cnt-yellow font-semibold transition-colors py-2.5 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Trajets &amp; Horaires</a>
            <a href="/suivi" className="block text-white hover:text-cnt-yellow font-semibold transition-colors py-2.5 border-b border-white/5" onClick={(e) => { setMobileMenuOpen(false); handleSuiviClick(e); }}>Suivi GPS</a>
            <div className="pt-4 space-y-3">
              {isLoaded && isSignedIn ? (
                <a href="/mon-espace" className="flex items-center gap-3 text-white font-semibold hover:text-cnt-yellow transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-8 h-8 rounded-full bg-cnt-yellow/20 border-2 border-cnt-yellow flex items-center justify-center text-cnt-yellow text-sm font-bold">
                    {user.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span>Mon Espace</span>
                </a>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); openSignIn(); }}
                    className="w-full text-white font-semibold hover:text-cnt-yellow text-left py-2.5"
                  >
                    Se connecter
                  </button>
                  <Button
                    onClick={() => { setMobileMenuOpen(false); openSignUp(); }}
                    className="w-full bg-cnt-yellow hover:bg-yellow-500 text-cnt-blue font-bold py-3 rounded-xl shadow-lg transition-all text-center text-sm"
                  >
                    Créer un compte
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[680px] flex flex-col justify-center pt-24 sm:pt-28 md:pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/hero_gabon_landscape.png")' }} />
        <div className="absolute inset-0 z-0 bg-cnt-blue/80 mix-blend-multiply" />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight text-white drop-shadow-lg">
              Voyager à travers le Gabon en toute <span className="text-cnt-yellow">sécurité</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 font-light drop-shadow">
              Achetez vos billets en ligne pour vos déplacements terrestres, maritimes et aériens.
            </p>
          </div>

          {/* SEARCH WIDGET */}
          <div className="max-w-5xl mx-auto">
            {/* TRANSPORT MODES TABS */}
            <div className="flex justify-center mb-6 max-w-full overflow-hidden">
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex items-center space-x-1.5 sm:space-x-2 border border-white/20 shadow-lg max-w-full overflow-x-auto overflow-y-hidden scrollbar-none">
                {[
                  { mode: 'bus', icon: '/icons/bus.png', label: 'Bus' },
                  { mode: 'train', icon: '/icons/transport.png', label: 'Train' },
                  { mode: 'bateau', icon: '/icons/yatch.png', label: 'Bateau' },
                  { mode: 'avion', icon: '/icons/plane.png', label: 'Avion' },
                ].map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setTransportMode(mode)}
                    className={cn(
                      "flex items-center px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all",
                      transportMode === mode
                        ? "bg-cnt-green text-white shadow-md"
                        : "text-white/80 hover:text-white hover:bg-white/20"
                    )}
                  >
                    <Image src={icon} alt={label} width={18} height={18} className="mr-1.5 sm:mr-2 object-contain brightness-0 invert" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* SEARCH FORM */}
            <div className="bg-white/95 rounded-2xl shadow-2xl p-4 md:p-5 border border-white/20">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3">

                {/* ── DÉPART ── */}
                <div className="space-y-1 relative md:col-span-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Départ</Label>
                  <div className="relative">
                    <Image src="/icons/origin.png" alt="Départ" width={20} height={20} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-90 object-contain" style={{ filter: 'invert(37%) sepia(51%) saturate(651%) hue-rotate(101deg) brightness(96%) contrast(88%)' }} />
                    {routeLocked ? (
                      // Champ verrouillé pour les trajets intérieur
                      <div className="pl-10 pr-8 flex items-center h-[46px] border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 font-medium select-none relative">
                        Libreville
                        <Lock className="w-3.5 h-3.5 text-gray-300 absolute right-3" />
                      </div>
                    ) : (
                      <Select value={departure} onValueChange={setDeparture}>
                        <SelectTrigger className="w-full overflow-hidden pl-10 bg-gray-50/50 hover:bg-white focus:bg-white !h-[46px] border-gray-200 rounded-xl focus:ring-cnt-blue transition-colors text-sm">
                          <SelectValue placeholder="Ville de départ" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grand Libreville</div>
                          {DESTINATIONS_GL.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 border-t border-gray-100 pt-2">Intérieur du pays</div>
                          {DESTINATIONS_INTERIEUR.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* ── ARRIVÉE ── */}
                <div className="space-y-1 relative md:col-span-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Arrivée</Label>
                  <div className="relative">
                    <Image src="/icons/destination.png" alt="Lieu" width={20} height={20} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-90 object-contain" style={{ filter: 'invert(15%) sepia(35%) saturate(3000%) hue-rotate(188deg) brightness(90%) contrast(100%)' }} />
                    {routeLocked ? (
                      // Champ verrouillé
                      <div className="pl-10 pr-8 flex items-center h-[46px] border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 font-medium select-none relative">
                        {arrival}
                        <Lock className="w-3.5 h-3.5 text-gray-300 absolute right-3" />
                      </div>
                    ) : (
                      <Select value={arrival} onValueChange={setArrival}>
                        <SelectTrigger className={cn(
                          "w-full overflow-hidden pl-10 bg-gray-50/50 hover:bg-white focus:bg-white !h-[46px] border-gray-200 rounded-xl focus:ring-cnt-blue transition-colors text-sm",
                          !arrival && "text-gray-400"
                        )}>
                          <SelectValue placeholder="Ville d'arrivée" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grand Libreville</div>
                          {DESTINATIONS_GL.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 border-t border-gray-100 pt-2">Intérieur du pays</div>
                          {DESTINATIONS_INTERIEUR.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* ── TYPE DE PASS ── */}
                <div className="space-y-1 relative md:col-span-3">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type de billet</Label>
                  <div className="relative">
                    <Image src="/icons/tickets.png" alt="Billet" width={20} height={20} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-90 object-contain" style={{ filter: 'invert(82%) sepia(63%) saturate(1312%) hue-rotate(355deg) brightness(101%) contrast(95%)' }} />
                    <Select value={ticketType} onValueChange={handleTicketTypeChange}>
                      <SelectTrigger className={cn(
                        "w-full overflow-hidden pl-10 bg-gray-50/50 hover:bg-white focus:bg-white !h-[46px] border-gray-200 rounded-xl focus:ring-cnt-blue transition-colors text-sm",
                        !ticketType && "text-gray-400"
                      )}>
                        <SelectValue placeholder="Choisir un billet…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {/* GRAND LIBREVILLE */}
                        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Grand Libreville
                        </div>
                        {Object.entries(PASS_GL).map(([label]) => (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        ))}
                        {/* INTÉRIEUR */}
                        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 border-t border-gray-100 pt-2">
                          Intérieur du pays
                        </div>
                        {TRAJETS_INTERIEUR.map(({ label }) => (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── DATE ── */}
                <div className="space-y-1 relative flex flex-col md:col-span-3">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</Label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "inline-flex items-center whitespace-nowrap border font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                        "w-full bg-gray-50/50 hover:bg-white focus:bg-white h-[46px] border-gray-200 rounded-xl justify-start text-left font-normal transition-colors text-sm pl-3",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Image src="/icons/calendar.png" alt="Date" width={20} height={20} className="mr-2.5 h-5 w-5 text-gray-500 opacity-80" />
                      {date ? format(date, "P", { locale: fr }) : <span>Choisir une date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100] rounded-xl overflow-hidden shadow-2xl">
                      <Calendar
                         mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={fr}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* ── BOUTON RÉSERVER ── */}
                <div className="flex items-end md:col-span-2">
                  <Button
                    type="submit"
                    disabled={!ticketType}
                    className={cn(
                      "w-full font-semibold text-sm rounded-xl shadow-md h-[46px] flex items-center justify-center gap-2 transition-all",
                      ticketType
                        ? "bg-cnt-green hover:bg-[#15673a] text-white hover:shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Réserver
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-cnt-blue mb-4">Pourquoi choisir la CNT ?</h2>
            <div className="w-24 h-1 bg-cnt-yellow mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto mt-12">
            <div className="flex flex-col items-center text-center group">
              <Image src="/icons/ticket.png" alt="Billet" width={48} height={48} className="object-contain mb-5 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-cnt-blue text-xl font-bold mb-3">Billetterie Digitale</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Achetez votre billet en quelques clics et recevez un QR code instantané. Fini les files d'attente.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <Image src="/icons/mobile_money.png" alt="Paiement Mobile" width={88} height={88} className="object-contain mb-5 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-cnt-blue text-xl font-bold mb-3">Paiement Mobile</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Payez facilement et en toute sécurité avec Airtel Money et Moov Money.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <Image src="/icons/fee.png" alt="Tarif" width={48} height={48} className="object-contain mb-5 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-cnt-blue text-xl font-bold mb-3">Tarifs Réduits</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bénéficiez de tarifs préférentiels (étudiants, retraités) sur l'ensemble de nos lignes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-cnt-blue rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-cnt-green/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 md:w-2/3 text-center md:text-left mb-6 md:mb-0 md:pr-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Prêt à voyager autrement ?</h2>
              <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
                Gagnez du temps en réservant vos billets en ligne. Rapide, sécurisé et disponible 24h/24 pour tous vos trajets au Gabon.
              </p>
            </div>
            <div className="relative z-10 flex flex-row gap-3 justify-center md:justify-end w-full md:w-auto">
              <Button
                onClick={() => isSignedIn ? router.push('/achat-billet') : openSignIn()}
                className="bg-cnt-yellow hover:bg-[#f3cc30] text-cnt-blue font-bold px-4 md:px-5 h-10 md:h-11 rounded-lg shadow-[0_0_15px_rgba(241,196,15,0.3)] transition-all hover:scale-105 active:scale-95 text-xs md:text-sm w-1/2 sm:w-auto group"
              >
                <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 group-hover:-rotate-12 transition-transform duration-300" />
                Réserver
              </Button>
              <Button
                onClick={() => openSignUp()}
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/15 hover:border-white/40 hover:text-white px-4 md:px-5 h-10 md:h-11 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-xs md:text-sm w-1/2 sm:w-auto bg-white/5 backdrop-blur-md"
              >
                S'inscrire
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain mr-3" unoptimized />
              <span className="font-bold text-xl text-white">CNT Gabon</span>
            </div>
            <p className="text-sm opacity-80">La Compagnie Nationale de Transport s'engage à révolutionner la mobilité au Gabon à travers l'innovation numérique.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-cnt-yellow transition">Acheter un billet</a></li>
              <li><a href="#" className="hover:text-cnt-yellow transition">Nos Destinations</a></li>
              <li><a href="/suivi" onClick={handleSuiviClick} className="hover:text-cnt-yellow transition">Suivre mon bus</a></li>
              <li><a href="/mon-espace" className="hover:text-cnt-yellow transition">Mon Espace</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Application Mobile</h3>
            <p className="text-sm opacity-80 mb-4">Téléchargez notre application pour une expérience optimale.</p>
            <div className="flex space-x-3">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Image src="/icons/play_store.png" alt="Google Play" width={135} height={40} className="object-contain h-10 w-auto" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Image src="/icons/app-store.png" alt="App Store" width={135} height={40} className="object-contain h-10 w-auto" />
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-sm text-center opacity-60">
          &copy; {new Date().getFullYear()} Compagnie Nationale de Transport (CNT) Gabon. Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}

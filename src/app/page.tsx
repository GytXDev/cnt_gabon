'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Calendar as CalendarIcon, Ticket } from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DESTINATIONS = [
  "Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda",
  "Mouila", "Lambaréné", "Tchibanga", "Koulamoutou", "Makokou",
  "Bitam", "Gamba", "Ntoum", "Ndjolé", "Mitzic",
  "Mayumba", "Omboué", "Cocobeach"
];

const TICKET_TYPES: Record<string, number> = {
  'Tarif simple': 1500,
  'Passe Etudiant': 1000,
  'Passe Eleve': 500,
  'Tarif Retraité': 1000,
  'Passe Journalier': 3000,
  'Passe Mensuel': 25000,
  'Passe Familial (3 pers.)': 4000
};

export default function Home() {
  const router = useRouter();
  const [transportMode, setTransportMode] = useState('bus');
  const [departure, setDeparture] = useState('Libreville');
  const [arrival, setArrival] = useState('Oyem');
  const [ticketType, setTicketType] = useState('Tarif simple');
  const [date, setDate] = useState<Date>();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Veuillez sélectionner une date de départ.");
      return;
    }
    const params = new URLSearchParams({
      depart: departure,
      arrivee: arrival,
      type: ticketType,
      mode: transportMode,
      date: format(date, 'yyyy-MM-dd'),
      montant: TICKET_TYPES[ticketType].toString(),
    });
    router.push(`/achat-billet?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-cnt-bg font-sans text-cnt-text">

      {/* NAVBAR STICKY */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-cnt-blue/95 backdrop-blur-md shadow-lg border-b border-white/10 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="Logo CNT" width={50} height={50} className="object-contain mr-3" unoptimized />
              <span className="font-bold text-2xl text-white tracking-tight drop-shadow-md">CNT Gabon</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Accueil</a>
              <a href="#" className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Trajets & Horaires</a>
              <div className="flex items-center space-x-6 ml-4 border-l border-white/20 pl-6">
                <a href="#" className="text-white font-medium hover:text-cnt-yellow transition-colors drop-shadow">Se connecter</a>
                <Button className="bg-cnt-yellow hover:bg-yellow-500 text-cnt-blue font-bold px-6 shadow-lg hover:shadow-xl transition-all">
                  Créer un compte
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[680px] flex flex-col justify-center pt-20 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/hero_gabon_landscape.png")' }}
        ></div>
        <div className="absolute inset-0 z-0 bg-cnt-blue/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/50 via-transparent to-black/30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight text-white drop-shadow-lg">
              Voyager à travers le Gabon en toute <span className="text-cnt-yellow">sécurité</span>
            </h1>
            <p className="text-base md:text-xl text-white/90 mb-8 font-light drop-shadow">
              Achetez vos billets en ligne pour vos déplacements terrestres, maritimes et aériens.
            </p>
          </div>

          {/* SEARCH WIDGET */}
          <div className="max-w-5xl mx-auto">
            {/* TRANSPORT MODES TABS */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex space-x-2 border border-white/20 shadow-lg">
                {[
                  { mode: 'bus', icon: '/icons/bus.png', label: 'Bus' },
                  { mode: 'train', icon: '/icons/transport.png', label: 'Train' },
                  { mode: 'bateau', icon: '/icons/yatch.png', label: 'Bateau' },
                  { mode: 'avion', icon: '/icons/plane.png', label: 'Avion' },
                ].map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setTransportMode(mode)}
                    className={`flex items-center px-5 py-2.5 rounded-xl font-medium transition-all ${transportMode === mode ? 'bg-cnt-green text-white shadow-md' : 'text-white/80 hover:text-white hover:bg-white/20'}`}
                  >
                    <Image src={icon} alt={label} width={20} height={20} className="mr-2 object-contain brightness-0 invert" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* SEARCH FORM */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 md:p-5 border border-white/20">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-3">

                {/* DÉPART */}
                <div className="space-y-1 relative">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Départ</Label>
                  <div className="relative">
                    <Image src="/icons/origin.png" alt="Départ" width={16} height={16} className="absolute left-3 top-3.5 z-10 opacity-80 object-contain" />
                    <Select value={departure} onValueChange={setDeparture}>
                      <SelectTrigger className="pl-9 bg-gray-50/50 hover:bg-white focus:bg-white h-[46px] border-gray-200 rounded-xl focus:ring-cnt-blue transition-colors text-sm">
                        <SelectValue placeholder="Départ" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {DESTINATIONS.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ARRIVÉE */}
                <div className="space-y-1 relative">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Arrivée</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-cnt-blue absolute left-3 top-3 z-10 opacity-80" />
                    <Select value={arrival} onValueChange={setArrival}>
                      <SelectTrigger className="pl-9 bg-gray-50/50 hover:bg-white focus:bg-white h-[46px] border-gray-200 rounded-xl focus:ring-cnt-blue transition-colors text-sm">
                        <SelectValue placeholder="Arrivée" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {DESTINATIONS.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* TYPE DE PASS */}
                <div className="space-y-1 relative">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type de Pass</Label>
                  <div className="relative">
                    <Ticket className="w-4 h-4 text-cnt-yellow absolute left-3 top-3 z-10 opacity-80" />
                    <Select value={ticketType} onValueChange={setTicketType}>
                      <SelectTrigger className="pl-9 bg-gray-50/50 hover:bg-white focus:bg-white h-[46px] border-gray-200 rounded-xl focus:ring-cnt-blue transition-colors text-sm">
                        <SelectValue placeholder="Pass" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(TICKET_TYPES).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* DATE */}
                <div className="space-y-1 relative flex flex-col">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</Label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "inline-flex items-center whitespace-nowrap border font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                        "w-full bg-gray-50/50 hover:bg-white focus:bg-white h-[46px] border-gray-200 rounded-xl justify-start text-left font-normal transition-colors text-sm pl-3",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 opacity-80" />
                      {date ? format(date, "P", { locale: fr }) : <span>Date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100] rounded-xl overflow-hidden shadow-2xl">
                      <Calendar mode="single" selected={date} onSelect={setDate} locale={fr} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* BOUTON */}
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-cnt-green hover:bg-[#15673a] text-white font-medium text-sm rounded-xl shadow-md hover:shadow-lg h-[46px]">
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
            <div className="w-24 h-1 bg-cnt-yellow mx-auto rounded-full"></div>
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

      {/* CALL TO ACTION SECTION */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-cnt-blue rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-cnt-green/10 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 md:w-2/3 text-center md:text-left mb-6 md:mb-0 md:pr-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Prêt à voyager autrement ?</h2>
              <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
                Gagnez du temps en réservant vos billets en ligne. Rapide, sécurisé et disponible 24h/24 pour tous vos trajets au Gabon.
              </p>
            </div>
            <div className="relative z-10 flex flex-row gap-3 justify-center md:justify-end w-full md:w-auto">
              <Button
                onClick={() => router.push('/achat-billet')}
                className="bg-cnt-yellow hover:bg-[#f3cc30] text-cnt-blue font-bold px-4 md:px-5 h-10 md:h-11 rounded-lg shadow-[0_0_15px_rgba(241,196,15,0.3)] transition-all hover:scale-105 active:scale-95 text-xs md:text-sm w-1/2 sm:w-auto group"
              >
                <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 group-hover:-rotate-12 transition-transform duration-300" />
                Réserver
              </Button>
              <Button variant="outline" className="border-2 border-white/20 text-white hover:bg-white/15 hover:border-white/40 hover:text-white px-4 md:px-5 h-10 md:h-11 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-xs md:text-sm w-1/2 sm:w-auto bg-white/5 backdrop-blur-md">
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
              <li><a href="#" className="hover:text-cnt-yellow transition">Acheter un billet</a></li>
              <li><a href="#" className="hover:text-cnt-yellow transition">Nos Destinations</a></li>
              <li><a href="#" className="hover:text-cnt-yellow transition">Suivre mon bus</a></li>
              <li><a href="#" className="hover:text-cnt-yellow transition">Espace Chauffeur</a></li>
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

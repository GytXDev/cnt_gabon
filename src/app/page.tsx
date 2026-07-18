"use client";

import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { checkIsAdmin } from "@/app/actions/user";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import {
  MapPin,
  Ticket,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import HeroBookingWidget from "@/components/HeroBookingWidget";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignUp, openSignIn } = useClerk();

  const handleSuiviClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      openSignIn();
    } else {
      router.push("/suivi");
    }
  };

  return (
    <main className="min-h-screen bg-cnt-bg font-sans text-cnt-text">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[680px] flex flex-col justify-center pt-24 sm:pt-28 md:pt-20 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/hero_gabon_landscape.png")' }}
        />
        <div className="absolute inset-0 z-0 bg-cnt-blue/80 mix-blend-multiply" />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight text-white drop-shadow-lg">
              Voyager à travers le Gabon en toute{" "}
              <span className="text-cnt-yellow">sécurité</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 font-light drop-shadow">
              Achetez vos billets en ligne pour vos déplacements terrestres,
              maritimes et aériens.
            </p>
          </div>

          {/* SEARCH WIDGET */}
          <div className="max-w-5xl mx-auto">
            <HeroBookingWidget />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-cnt-blue mb-4">
              Pourquoi choisir la CNT ?
            </h2>
            <div className="w-24 h-1 bg-cnt-yellow mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto mt-12">
            <div className="flex flex-col items-center text-center group">
              <Image
                src="/icons/ticket.png"
                alt="Billet"
                width={48}
                height={48}
                className="object-contain mb-5 group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-cnt-blue text-xl font-bold mb-3">
                Billetterie Digitale
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Achetez votre billet en quelques clics et recevez un QR code
                instantané. Fini les files d'attente.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <Image
                src="/icons/mobile_money.png"
                alt="Paiement Mobile"
                width={88}
                height={88}
                className="object-contain mb-5 group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-cnt-blue text-xl font-bold mb-3">
                Paiement Mobile
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Payez facilement et en toute sécurité avec Airtel Money et Moov
                Money.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <Image
                src="/icons/fee.png"
                alt="Tarif"
                width={48}
                height={48}
                className="object-contain mb-5 group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="text-cnt-blue text-xl font-bold mb-3">
                Tarifs Réduits
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bénéficiez de tarifs préférentiels (étudiants, retraités) sur
                l'ensemble de nos lignes.
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
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                Prêt à voyager autrement ?
              </h2>
              <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
                Gagnez du temps en réservant vos billets en ligne. Rapide,
                sécurisé et disponible 24h/24 pour tous vos trajets au Gabon.
              </p>
            </div>
            <div className="relative z-10 flex flex-row gap-3 justify-center md:justify-end w-full md:w-auto">
              <Button
                onClick={() =>
                  isSignedIn ? router.push("/achat-billet") : openSignIn()
                }
                className="bg-cnt-yellow hover:bg-[#f3cc30] text-cnt-blue font-bold px-4 md:px-5 h-10 md:h-11 rounded-lg shadow-[0_0_15px_rgba(241,196,15,0.3)] transition-all hover:scale-105 active:scale-95 text-xs md:text-sm w-1/2 sm:w-auto group">
                <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 group-hover:-rotate-12 transition-transform duration-300" />
                Réserver
              </Button>
              <Button
                onClick={() => openSignUp()}
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/15 hover:border-white/40 hover:text-white px-4 md:px-5 h-10 md:h-11 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-xs md:text-sm w-1/2 sm:w-auto bg-white/5 backdrop-blur-md">
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
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain mr-3"
                unoptimized
              />
              <span className="font-bold text-xl text-white">CNT</span>
            </div>
            <p className="text-sm opacity-80">
              La Compagnie Nationale de Transport s'engage à révolutionner la
              mobilité au Gabon à travers l'innovation numérique.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Liens Rapides
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-cnt-yellow transition">
                  Acheter un billet
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cnt-yellow transition">
                  Nos Destinations
                </a>
              </li>
              <li>
                <a
                  href="/suivi"
                  onClick={handleSuiviClick}
                  className="hover:text-cnt-yellow transition">
                  Suivre mon bus
                </a>
              </li>
              <li>
                <a
                  href="/mon-espace"
                  className="hover:text-cnt-yellow transition">
                  Mon Espace
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Application Mobile
            </h3>
            <p className="text-sm opacity-80 mb-4">
              Téléchargez notre application pour une expérience optimale.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/icons/play_store.png"
                  alt="Google Play"
                  width={135}
                  height={40}
                  className="object-contain h-10 w-auto"
                />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/icons/app-store.png"
                  alt="App Store"
                  width={135}
                  height={40}
                  className="object-contain h-10 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-sm text-center opacity-60">
          &copy; {new Date().getFullYear()} Compagnie Nationale de Transport
          (CNT) Gabon. Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}

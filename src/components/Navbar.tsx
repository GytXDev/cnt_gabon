"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { checkIsAdmin } from '@/app/actions/user';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface NavbarProps {
  alwaysSolid?: boolean;
}

export default function Navbar({ alwaysSolid = false }: NavbarProps) {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { openSignUp, openSignIn } = useClerk();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) {
      checkIsAdmin().then(admin => setIsAdmin(admin));
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSuiviClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      openSignIn();
    } else {
      router.push('/suivi');
    }
  };

  return (
    <>
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${alwaysSolid || isScrolled || mobileMenuOpen ? 'bg-cnt-blue/95 backdrop-blur-md shadow-lg border-b border-white/10 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center cursor-pointer transition-transform hover:scale-105">
              <Image src="/logo.png" alt="Logo" width={42} height={42} className="object-contain mr-2.5 sm:mr-3" unoptimized />
              <span className="font-bold text-xl sm:text-2xl text-white tracking-tight drop-shadow-md">CNT</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Accueil</a>
              <a href="/horaires" className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Trajets &amp; Horaires</a>
              <a href="/suivi" onClick={handleSuiviClick} className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Suivi GPS</a>
              {isLoaded && isSignedIn && (
                <a href="/chats" className="text-white/90 hover:text-cnt-yellow font-medium transition-colors drop-shadow">Mes Chats</a>
              )}
              <div className="flex items-center space-x-4 ml-4 border-l border-white/20 pl-6 h-10">
                {!isLoaded ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-5 bg-white/10 animate-pulse rounded" />
                    <div className="w-32 h-10 bg-white/10 animate-pulse rounded-md" />
                  </div>
                ) : isSignedIn ? (
                  <a href={isAdmin ? "/admin" : "/mon-espace"} className="flex items-center gap-2 text-white font-medium hover:text-cnt-yellow transition-colors">
                    <div className="w-7 h-7 rounded-full bg-cnt-yellow/20 border border-cnt-yellow flex items-center justify-center text-cnt-yellow text-xs font-bold">
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {isAdmin ? "Administration" : "Mon Espace"}
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
            <a href="/" className="block text-white hover:text-cnt-yellow font-semibold transition-colors py-2.5 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Accueil</a>
            <a href="/horaires" className="block text-white hover:text-cnt-yellow font-semibold transition-colors py-2.5 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Trajets &amp; Horaires</a>
            <a href="/suivi" className="block text-white hover:text-cnt-yellow font-semibold transition-colors py-2.5 border-b border-white/5" onClick={(e) => { setMobileMenuOpen(false); handleSuiviClick(e); }}>Suivi GPS</a>
            {isLoaded && isSignedIn && (
              <a href="/chats" className="block text-white hover:text-cnt-yellow font-semibold transition-colors py-2.5 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>Mes Chats</a>
            )}
            <div className="pt-4 space-y-3 min-h-[120px]">
              {!isLoaded ? (
                <div className="flex flex-col gap-3 pt-2">
                  <div className="w-1/3 h-6 bg-white/10 animate-pulse rounded" />
                  <div className="w-full h-12 bg-white/10 animate-pulse rounded-xl" />
                </div>
              ) : isSignedIn ? (
                <a href={isAdmin ? "/admin" : "/mon-espace"} className="flex items-center gap-3 text-white font-semibold hover:text-cnt-yellow transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-8 h-8 rounded-full bg-cnt-yellow/20 border-2 border-cnt-yellow flex items-center justify-center text-cnt-yellow text-sm font-bold">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span>{isAdmin ? "Administration" : "Mon Espace"}</span>
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
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Download,
  MessageCircle,
  MapPin,
  QrCode,
  Search,
  ChevronRight,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface TicketData {
  id: string;
  ref: string;
  passager: string;
  depart: string;
  arrivee: string;
  mode: string;
  date: string;
  type: string;
  montant: number;
  statut: "valide" | "utilise" | "annule" | "invalide";
  classe: string;
  createdAt: string;
  transactionId: string;
}

function StatusBadge({ statut }: { statut: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    valide: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Valide",
    },
    utilise: {
      cls: "bg-gray-100 text-gray-600 border-gray-200",
      label: "Utilisé",
    },
    annule: {
      cls: "bg-red-50 text-red-600 border-red-200",
      label: "Annulé",
    },
    invalide: {
      cls: "bg-orange-50 text-orange-600 border-orange-200",
      label: "Invalide",
    },
  };
  const s = cfg[statut] || cfg["invalide"];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MonEspacePage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  // Synchronisation utilisateur Clerk → DB
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/");
      return;
    }
    const syncUser = async () => {
      try {
        const res = await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            prenom: user.firstName,
            nom: user.lastName,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setDbUserId(data.user.id);
          // Charger les tickets
          await loadTickets(data.user.id);
        }
      } catch (err) {
        console.error("Erreur sync user:", err);
      } finally {
        setLoading(false);
      }
    };
    syncUser();
  }, [isLoaded, isSignedIn]);

  const loadTickets = async (userId: string) => {
    try {
      const res = await fetch(`/api/tickets/user/${userId}`);
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch (err) {
      console.error("Erreur chargement tickets:", err);
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.ref?.toLowerCase().includes(search.toLowerCase()) ||
      t.depart?.toLowerCase().includes(search.toLowerCase()) ||
      t.arrivee?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: tickets.length,
    valides: tickets.filter((t) => t.statut === "valide").length,
    utilises: tickets.filter((t) => t.statut === "utilise").length,
    annules: tickets.filter((t) => t.statut === "annule").length,
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cnt-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 font-sans">
      {/* HEADER */}
      <div className="bg-cnt-blue shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push("/")}>
              <Image
                src="/logo.png"
                alt="CNT"
                width={36}
                height={36}
                className="object-contain"
                unoptimized
              />
              <span className="font-bold text-white text-lg">CNT</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-white/60 text-xs">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              <div className="w-9 h-9 flex items-center justify-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* WELCOME */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.firstName || "Passager"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenue dans votre espace personnel CNT
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total billets",
              value: stats.total,
              color: "from-cnt-blue to-blue-700",
              icon: <Ticket className="w-5 h-5" />,
            },
            {
              label: "Valides",
              value: stats.valides,
              color: "from-emerald-600 to-emerald-700",
              icon: <CheckCircle2 className="w-5 h-5" />,
            },
            {
              label: "Utilisés",
              value: stats.utilises,
              color: "from-gray-600 to-gray-700",
              icon: <Clock className="w-5 h-5" />,
            },
            {
              label: "Annulés",
              value: stats.annules,
              color: "from-red-500 to-red-700",
              icon: <XCircle className="w-5 h-5" />,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-md`}>
              <div className="flex items-center justify-between mb-2 opacity-80"></div>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs opacity-80 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/")}
            className="bg-cnt-green hover:bg-emerald-700 text-white rounded-2xl p-4 text-left transition-all hover:shadow-lg group">
            <Ticket className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-semibold">Acheter un billet</p>
            <p className="text-xs opacity-80 mt-0.5">
              Réserver votre prochain trajet
            </p>
          </button>
          <button
            onClick={() => router.push("/suivi")}
            className="bg-white border border-gray-200 hover:border-cnt-blue text-gray-700 rounded-2xl p-4 text-left transition-all hover:shadow-md group">
            <Image
              src="/icons/bus_tracking.png"
              alt="Suivi"
              width={24}
              height={24}
              className="w-6 h-6 mb-2 object-contain group-hover:scale-110 transition-transform"
              unoptimized
            />
            <p className="font-semibold text-gray-800">Suivre mon bus</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Position GPS en direct
            </p>
          </button>
          <button
            onClick={() =>
              router.push(`/api/tickets/verify?ref=${tickets[0]?.ref}`)
            }
            className="bg-white border border-gray-200 hover:border-cnt-yellow text-gray-700 rounded-2xl p-4 text-left transition-all hover:shadow-md group">
            <QrCode className="w-6 h-6 mb-2 text-cnt-yellow group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-800">Vérifier un billet</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Scanner ou saisir une référence
            </p>
          </button>
        </div>

        {/* TICKET LIST */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              Historique de mes billets
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par ref, ville..."
                className="pl-9 h-9 text-sm rounded-xl border-gray-200 w-64"
              />
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="py-16 text-center">
              <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">
                {tickets.length === 0
                  ? "Aucun billet acheté pour le moment"
                  : "Aucun résultat pour cette recherche"}
              </p>
              {tickets.length === 0 && (
                <Button
                  onClick={() => router.push("/")}
                  className="mt-4 bg-cnt-green hover:bg-emerald-700 text-white rounded-xl">
                  Acheter mon premier billet
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  onClick={() =>
                    router.push(`/mon-espace/ticket/${ticket.ref}`)
                  }>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-cnt-blue bg-blue-50 px-2 py-0.5 rounded">
                          {ticket.ref}
                        </span>
                        <StatusBadge statut={ticket.statut} />
                        <span className="text-xs text-gray-400 capitalize">
                          {ticket.classe}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-800 font-semibold">
                        <span>{ticket.depart || "—"}</span>
                        <span className="text-gray-300">→</span>
                        <span>{ticket.arrivee || "—"}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Image
                            src="/icons/calendar.png"
                            alt="Date"
                            width={16}
                            height={16}
                            className="w-3 h-3"
                          />{" "}
                          {formatDate(ticket.date)}
                        </span>
                        <span>{ticket.type}</span>
                        <span className="font-semibold text-cnt-green">
                          {ticket.montant?.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.statut === "valide" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const roomId = `${ticket.ref.split("-")[1] || "r"}_${ticket.date}`;
                            router.push(
                              `/chat/${roomId}?passager=${encodeURIComponent(ticket.passager)}&ref=${ticket.ref}&date=${ticket.date}`,
                            );
                          }}
                          className="p-2 rounded-xl bg-emerald-50 text-cnt-green hover:bg-emerald-100 transition-colors"
                          title="Tchat passagers">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cnt-blue transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

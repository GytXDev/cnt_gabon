"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Bus,
  Train,
  Ship,
  Plane,
  Ticket,
  AlertCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ---------- HELPERS ----------

function showCustomToast(
  type: "error" | "info" | "success" | "warning",
  title: string,
  description?: string,
  action?: { label: string; onClick: () => void }
) {
  toast.custom((t) => {
    const bgTextClass = 
      type === "error" ? "bg-red-50 text-red-600 border-red-100" :
      type === "info" ? "bg-blue-50 text-blue-600 border-blue-100" :
      type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
      "bg-amber-50 text-amber-600 border-amber-100";

    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 max-w-sm w-full font-sans">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${bgTextClass}`}>
            {type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm">{title}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1 leading-normal">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && (
          <button
            onClick={(e) => {
              e.preventDefault();
              action.onClick();
              toast.dismiss(t);
            }}
            className="bg-[#0A3055] hover:bg-blue-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 transition-colors shadow-sm"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }, { duration: 8000 });
}

function getModeIcon(
  mode: string,
  className: string = "w-5 h-5 object-contain",
  style: React.CSSProperties = {},
) {
  switch (mode) {
    case "train":
      return (
        <Image
          src="/icons/transport.png"
          alt="Train"
          width={20}
          height={20}
          className={className}
          style={style}
          unoptimized
        />
      );
    case "bateau":
      return (
        <Image
          src="/icons/yatch.png"
          alt="Bateau"
          width={20}
          height={20}
          className={className}
          style={style}
          unoptimized
        />
      );
    case "avion":
      return (
        <Image
          src="/icons/plane.png"
          alt="Avion"
          width={20}
          height={20}
          className={className}
          style={style}
          unoptimized
        />
      );
    default:
      return (
        <Image
          src="/icons/bus.png"
          alt="Bus"
          width={20}
          height={20}
          className={className}
          style={style}
          unoptimized
        />
      );
  }
}

function getModeLabel(mode: string) {
  switch (mode) {
    case "train":
      return "Train";
    case "bateau":
      return "Bateau";
    case "avion":
      return "Avion";
    default:
      return "Bus";
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function generateTicketRef() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "CNT-";
  for (let i = 0; i < 8; i++)
    ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

// ---------- TICKET PREVIEW ----------

interface TicketPreviewProps {
  prenom: string;
  nom: string;
  depart: string;
  arrivee: string;
  mode: string;
  date: string;
  type: string;
  montant: string;
  ticketRef: string;
}

function TicketPreview({
  prenom,
  nom,
  depart,
  arrivee,
  mode,
  date,
  type,
  montant,
  ticketRef,
}: TicketPreviewProps) {
  const passengerName = [prenom, nom].filter(Boolean).join(" ") || "— — —";
  const isComplete = prenom && nom && depart && arrivee && date;

  return (
    <div className="relative">
      {/* Ticket card */}
      <div
        id="ticket-preview"
        className={`relative bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${isComplete ? "ring-2 ring-cnt-green/30" : ""}`}>
        {/* Header bande */}
        <div className="bg-cnt-blue px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="CNT"
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
              <div>
                <p className="text-white font-bold text-sm leading-tight">
                  CNT Gabon
                </p>
                <p className="text-white/60 text-[10px] uppercase tracking-widest">
                  Billet de Transport
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[10px] uppercase tracking-widest">
                Réf.
              </p>
              <p className="text-cnt-yellow font-mono text-xs font-bold">
                {ticketRef}
              </p>
            </div>
          </div>

          {/* Trajet */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-widest">
                De
              </p>
              <p className="text-white font-bold text-xl leading-tight">
                {depart || "—"}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-cnt-yellow/80">
                {getModeIcon(mode, "w-5 h-5 object-contain", {
                  filter:
                    "invert(82%) sepia(55%) saturate(1394%) hue-rotate(345deg) brightness(100%) contrast(98%)",
                })}
              </div>
              <div className="w-20 h-px bg-white/20 my-1 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cnt-yellow"></div>
              </div>
              <p className="text-white/50 text-[9px] uppercase">
                {getModeLabel(mode)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-widest">
                À
              </p>
              <p className="text-white font-bold text-xl leading-tight">
                {arrivee || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Perforation */}
        <div className="relative flex items-center">
          <div className="w-5 h-5 rounded-full bg-gray-100 -ml-2.5 shrink-0 border-r border-gray-200"></div>
          <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1"></div>
          <div className="w-5 h-5 rounded-full bg-gray-100 -mr-2.5 shrink-0 border-l border-gray-200"></div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-0.5">
                Passager
              </p>
              <p
                className={`font-semibold text-sm ${passengerName === "— — —" ? "text-gray-300 italic" : "text-gray-800"}`}>
                {passengerName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-0.5">
                Date
              </p>
              <p className="font-semibold text-sm text-gray-800 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3 text-cnt-blue" />
                {formatDate(date)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-0.5">
                Type de billet
              </p>
              <p className="font-semibold text-sm text-gray-800">
                {type || "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-0.5">
                Montant
              </p>
              <p className="font-bold text-lg text-cnt-green">
                {montant
                  ? `${parseInt(montant).toLocaleString("fr-FR")} FCFA`
                  : "—"}
              </p>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="flex items-center justify-center py-3 border border-gray-100 rounded-xl bg-gray-50">
            {isComplete ? (
              <div className="text-center">
                <Image
                  src="/icons/qr-code.png"
                  alt="QR Code"
                  width={80}
                  height={80}
                  className="mx-auto mb-2 object-contain"
                  unoptimized
                />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                  QR Code généré à la validation
                </p>
              </div>
            ) : (
              <div className="text-center py-2">
                <Ticket className="w-8 h-8 text-gray-200 mx-auto mb-1" />
                <p className="text-[10px] text-gray-300 italic">
                  Complétez le formulaire pour voir votre billet
                </p>
              </div>
            )}
          </div>

          {/* Footer sécurité */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-gray-300">
            <Image
              src="/icons/secure.png"
              alt="mobile money"
              width={15}
              height={15}
              className="object-contain"
              unoptimized
            />{" "}
            <span>Paiement sécurisé via Singpay</span>
            <span>•</span>
            <Image
              src="/icons/mobile_money.png"
              alt="mobile money"
              width={25}
              height={25}
              className="object-contain"
              unoptimized
            />
            <span>Airtel Money / Moov Money</span>
          </div>
        </div>
      </div>

      {/* Badge complet */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 bg-cnt-green text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-bounce">
          <CheckCircle2 className="w-3 h-3" />
          Prêt
        </div>
      )}
    </div>
  );
}

// ---------- MAIN PAGE ----------

function AchatBilletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const depart = searchParams.get("depart") || "";
  const arrivee = searchParams.get("arrivee") || "";
  const type = searchParams.get("type") || "Tarif simple";
  const mode = searchParams.get("mode") || "bus";
  const date = searchParams.get("date") || "";
  const montant = searchParams.get("montant") || "1500";

  const [ticketRef, setTicketRef] = useState("");

  useEffect(() => {
    setTicketRef(generateTicketRef());
  }, []);

  // Formulaire — pré-rempli depuis Clerk si disponible
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [numero, setNumero] = useState("");

  // Pré-remplissage depuis le compte Clerk
  useEffect(() => {
    if (user) {
      if (user.firstName) setPrenom(user.firstName);
      if (user.lastName) setNom(user.lastName);
    }
  }, [user]);

  // Paiement
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<"form" | "paying" | "success" | "error">(
    "form",
  );

  const isFormValid = prenom.trim() && nom.trim() && numero.trim().length >= 8;

  // Polling amélioré avec setTimeout récursif (évite l'empilement des requêtes lentes)
  const pollStatus = (transId: string) => {
    let attempts = 0;
    const maxAttempts = 12;

    const executePoll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/singpay/status/${transId}`);
        const data = await res.json();

        if (data.success && data.statusMessage) {
          const raw = data.statusMessage;
          const msg = raw.toLowerCase();

          // Cas d'ERREUR : mots-clés élargi pour couvrir tous les messages Singpay
          const isError =
            msg.includes("insuffisant") ||
            msg.includes("insufficient") ||
            msg.includes("solde") ||
            msg.includes("not accepted") ||
            msg.includes("erreur") ||
            msg.includes("error") ||
            msg.includes("failed") ||
            msg.includes("failure") ||
            msg.includes("échec") ||
            msg.includes("echeance") ||
            msg.includes("rejeté") ||
            msg.includes("rejet") ||
            msg.includes("annulé") ||
            msg.includes("annulation") ||
            msg.includes("declined") ||
            msg.includes("refus") ||
            msg.includes("timeout") ||
            msg.includes("expiré") ||
            msg.includes("expire");

          // Cas de SUCCÈS
          const isSuccess =
            msg.includes("succès") ||
            msg.includes("success") ||
            msg.includes("approved") ||
            msg.includes("approuvé") ||
            msg.includes("validé") ||
            msg.includes("payé") ||
            msg.includes("completed");

          if (isError) {
            setMessage({ type: "error", text: raw });
            showCustomToast("error", "Erreur de paiement", raw);
            setStep("error");
            setLoading(false);
            return;
          } else if (isSuccess) {
            setStep("success");
            showCustomToast("success", "Paiement validé", "Votre billet a été réservé avec succès !");
            setLoading(false);
            // Rediriger vers la page de téléchargement
            const params = new URLSearchParams({
              ref: ticketRef,
              depart,
              arrivee,
              mode,
              date,
              type,
              montant,
              passager: `${prenom} ${nom}`,
              tid: transId,
            });
            setTimeout(
              () => router.push(`/achat-billet/download?${params.toString()}`),
              1500,
            );
            return;
          } else {
            // Statut intermédiaire
            setMessage({
              type: "info",
              text: `En attente de validation… (${raw})`,
            });
          }
        } else if (data.errorType === "gateway_error") {
          // Singpay est déconnecté ou met trop de temps (ex: 504)
          setMessage({
            type: "info",
            text: "Réseau Singpay ralenti. Nouvelle tentative en cours...",
          });
        }
      } catch (err) {
        console.error("Erreur polling:", err);
      }

      // Planification de la tentative suivante ou échec final
      if (attempts < maxAttempts) {
        setTimeout(executePoll, 3000);
      } else {
        const timeoutText = "Délai d'attente dépassé. Vérifiez votre solde ou réessayez.";
        setMessage({
          type: "error",
          text: timeoutText,
        });
        showCustomToast("error", "Délai dépassé", timeoutText);
        setStep("error");
        setLoading(false);
      }
    };

    // Lancer la première vérification après 3 secondes
    setTimeout(executePoll, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (!isSignedIn) {
      showCustomToast("error", "Connexion requise", "Veuillez vous connecter pour valider votre achat.", {
        label: "Se connecter",
        onClick: () => openSignIn(),
      });
      return;
    }

    let normalizedNum = numero.trim();
    if (!normalizedNum.startsWith("0")) {
      normalizedNum = "0" + normalizedNum;
    }

    // Airtel Money: 074, 077, 076 | Moov Money: 065, 066, 062, 060, 063
    const isAirtel = /^0(74|77|76)/.test(normalizedNum);
    const isMoov = /^0(65|66|62|60|63)/.test(normalizedNum);

    if (!isAirtel && !isMoov) {
      showCustomToast(
        "error",
        "Numéro non reconnu",
        "Utilisez un numéro Airtel Money (074, 077, 076) ou Moov Money (065, 066, 062, 060, 063)."
      );
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    setStep("paying");

    try {
      const res = await fetch("/api/singpay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: normalizedNum, amount: montant }),
      });
      const data = await res.json();

      if (data.success) {
        setTransactionId(data.transactionId);
        const successInitMsg = "Paiement initié. Validez la demande sur votre téléphone.";
        setMessage({
          type: "info",
          text: successInitMsg,
        });
        showCustomToast("info", "Paiement initié", successInitMsg);
        pollStatus(data.transactionId);
      } else {
        const errorInitMsg = data.message || "Erreur lors de l'initialisation du paiement.";
        setMessage({
          type: "error",
          text: errorInitMsg,
        });
        showCustomToast("error", "Erreur d'initialisation", errorInitMsg);
        setStep("error");
        setLoading(false);
      }
    } catch (err: any) {
      const connErrMsg = "Erreur de connexion : " + err.message;
      setMessage({
        type: "error",
        text: connErrMsg,
      });
      showCustomToast("error", "Erreur de connexion", connErrMsg);
      setStep("error");
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep("form");
    setMessage({ type: "", text: "" });
    setLoading(false);
    setTransactionId("");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* BREADCRUMB */}
      <div className="bg-cnt-blue shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push("/")}>Accueil</span>
            <span className="text-white/40">/</span>
            <span className="text-cnt-yellow font-semibold">Achat de billet</span>
          </div>
        </div>
      </div>

      {/* PAGE TITLE */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Finalisez votre réservation
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Renseignez vos informations et procédez au paiement sécurisé par
          Mobile Money.
        </p>
      </div>

      {/* MAIN CONTENT — 2 COLONNES */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* ─────────── COLONNE GAUCHE : FORMULAIRE ─────────── */}
          <div className="space-y-5">
            {/* Récapitulatif trajet */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                Votre trajet
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400 mb-1">Départ</p>
                  <p className="font-bold text-cnt-blue text-lg">
                    {depart || "—"}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-300">
                  <div className="flex items-center gap-1 text-cnt-green bg-cnt-green/10 px-3 py-1.5 rounded-full text-xs font-medium">
                    {getModeIcon(mode, "w-5 h-5 object-contain")}
                    <span>{getModeLabel(mode)}</span>
                  </div>
                  <div className="w-16 h-px bg-gray-200"></div>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400 mb-1">Arrivée</p>
                  <p className="font-bold text-cnt-blue text-lg">
                    {arrivee || "—"}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Date</p>
                  <p className="text-gray-700 font-medium">
                    {formatDate(date)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Type</p>
                  <p className="text-gray-700 font-medium">{type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Montant</p>
                  <p className="text-cnt-green font-bold">
                    {parseInt(montant).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>
            </div>

            {/* Formulaire passager */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Image src="/icons/passager.png" alt="passager" width={25} height={25} /> Informations passager
              </h2>

              <form
                onSubmit={handleSubmit}
                id="payment-form"
                className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="prenom"
                      className="text-sm text-gray-600 font-medium">
                      Prénom *
                    </Label>
                    <Input
                      id="prenom"
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Ex : Jean"
                      required
                      disabled={step === "paying"}
                      className="h-11 rounded-xl border-gray-200 focus-visible:ring-cnt-blue text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="nom"
                      className="text-sm text-gray-600 font-medium">
                      Nom *
                    </Label>
                    <Input
                      id="nom"
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Ex : Mboumba"
                      required
                      disabled={step === "paying"}
                      className="h-11 rounded-xl border-gray-200 focus-visible:ring-cnt-blue text-sm"
                    />
                  </div>
                </div>

                {/* Numéro Mobile Money */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="numero"
                    className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Numéro Mobile Money
                    (Airtel / Moov) *
                  </Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-600 font-medium shrink-0">
                      +241
                    </div>
                    <Input
                      id="numero"
                      type="tel"
                      value={numero}
                      onChange={(e) =>
                        setNumero(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="077 000 000"
                      required
                      maxLength={9}
                      disabled={step === "paying"}
                      className="h-11 rounded-l-none rounded-r-xl border-gray-200 focus-visible:ring-cnt-blue text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Vous recevrez une notification de paiement sur ce numéro.
                  </p>
                </div>
              </form>
            </div>

            {/* Zone action + messages */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {/* Message de statut */}
              {message.text && (
                <div
                  className={`mb-4 p-4 rounded-xl text-sm flex items-start gap-3 ${
                    message.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : message.type === "success"
                        ? "bg-green-50 text-cnt-green border border-green-100"
                        : "bg-blue-50 text-cnt-blue border border-blue-100"
                  }`}>
                  {message.type === "error" ? (
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : message.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <p className="leading-relaxed">{message.text}</p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                {step === "error" && (
                  <Button
                    type="button"
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">
                    Réessayer
                  </Button>
                )}
                <Button
                  type="submit"
                  form="payment-form"
                  disabled={!isFormValid || loading}
                  className={`flex-1 h-12 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2
                    ${isFormValid && step !== "paying" && step !== "success" ? "bg-cnt-green hover:bg-[#15673a] shadow-md hover:shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                  {step === "paying" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin animate-infinite" />
                      Attente de validation sur votre téléphone...
                    </>
                  ) : step === "success" ? (
                    <>
                      Paiement validé !
                    </>
                  ) : (
                    <>
                      Réserver & Payer {parseInt(montant).toLocaleString("fr-FR")} FCFA
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Paiement 100% sécurisé via Singpay · Aucune donnée bancaire
                stockée
              </p>
            </div>
          </div>

          {/* ─────────── COLONNE DROITE : TICKET ─────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4 text-cnt-blue" /> Aperçu de votre
              billet
            </h2>
            <div className="sticky top-6">
              <TicketPreview
                prenom={prenom}
                nom={nom}
                depart={depart}
                arrivee={arrivee}
                mode={mode}
                date={date}
                type={type}
                montant={montant}
                ticketRef={ticketRef}
              />
              <p className="text-xs text-gray-400 text-center mt-3">
                Le billet définitif sera généré après validation du paiement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapping Suspense pour useSearchParams
export default function AchatBilletPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cnt-blue" />
        </div>
      }>
      <AchatBilletContent />
    </Suspense>
  );
}

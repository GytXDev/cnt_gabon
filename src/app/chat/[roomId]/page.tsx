'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  ArrowLeft, Send, MessageCircle, Users, Wifi, WifiOff,
  Loader2, Bus, MapPin, Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

interface Message {
  id: number;
  senderNom: string;
  contenu: string;
  createdAt: string;
  isOwn: boolean;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const QUICK_EMOJIS = ['👋', '👍', '🙏', '🚌', '📍', '⏱️', '😊', '❤️', '🚗', '🎒'];

function ChatContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const passager = searchParams.get('passager') || 'Passager';
  const ref = searchParams.get('ref') || '';

  const dateQuery = searchParams.get('date') || '';
  const dateFromRoom = roomId.split('_')[1] || '';
  const date = dateQuery || dateFromRoom;

  const { user, isSignedIn, isLoaded } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const [connectedCount, setConnectedCount] = useState(Math.floor(Math.random() * 8) + 2); // simulé
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling des messages toutes les 3 secondes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${roomId}`);
        const data = await res.json();
        if (data.success) {
          setOnline(true);
          setMessages(
            data.messages.map((m: any) => ({
              ...m,
              isOwn: m.senderNom === passager,
            }))
          );
        }
      } catch {
        setOnline(false);
      }
    };

    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollingRef.current);
  }, [roomId, passager]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    // Optimistic update
    const optimisticMsg: Message = {
      id: Date.now(),
      senderNom: passager,
      contenu: content,
      createdAt: new Date().toISOString(),
      isOwn: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetch(`/api/chat/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: content, senderNom: passager }),
      });
    } catch {
      // En cas d'échec, on garde le message
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#efeae2] font-sans">

      {/* BREADCRUMB / HEADER */}
      <div className="bg-cnt-blue shadow-md shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
            <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push("/")}>Accueil</span>
            <span className="text-white/40">/</span>
            <span className="text-[#F1C40F] font-semibold">Tchat Voyageurs</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium bg-white/10 text-white text-xs">
              <Users className="w-3.5 h-3.5 text-[#F1C40F]" />
              <span>{connectedCount} en ligne</span>
            </div>
            <div className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${online ? 'bg-[#1E824C]/25 text-[#1E824C]' : 'bg-red-500/20 text-red-600'}`}>
              {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {online ? 'Actif' : 'Déconnecté'}
            </div>
            {isLoaded && isSignedIn && (
              <a href="/mon-espace" className="flex items-center gap-2 text-sm text-white font-medium hover:text-[#F1C40F] transition-colors ml-1 border-l border-white/20 pl-3">
                <div className="w-7 h-7 rounded-full bg-[#F1C40F]/20 border border-[#F1C40F] flex items-center justify-center text-[#F1C40F] text-[10px] font-bold">
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline">Mon Espace</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* TRIP METADATA BAR */}
      <div className="bg-[#0A3055]/5 border-b border-gray-200/50 px-4 py-2 text-xs text-cnt-blue text-center font-medium shrink-0 flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span>Billet: <b>{ref}</b></span>
        </div>
        <span className="text-gray-300">|</span>
        <span>Date de voyage: <b>{formatDate(date)}</b></span>
        <button 
          onClick={() => router.push('/suivi')}
          className="text-cnt-green hover:underline font-bold flex items-center gap-1 ml-2"
        >
          <MapPin className="w-3 h-3" />
          Voir la position du bus
        </button>
      </div>

      {/* MESSAGES VIEWPORT */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-[#efeae2]">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          
          {messages.length === 0 && (
            <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/40 shadow-sm max-w-sm mx-auto mt-6">
              <MessageCircle className="w-12 h-12 text-cnt-blue/40 mx-auto mb-3" />
              <p className="text-gray-700 text-sm font-bold">Espace de discussion libre</p>
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                Posez vos questions ou communiquez avec les autres voyageurs et le personnel de bord de votre bus.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const showSender = idx === 0 || messages[idx - 1].senderNom !== msg.senderNom;
            return (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${msg.isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!msg.isOwn && showSender && (
                    <span className="text-[10px] text-gray-500 ml-2 font-bold">{msg.senderNom}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                      msg.isOwn
                        ? 'bg-[#e6f4ff] text-[#002c52] border border-[#bae0ff] rounded-tr-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                    }`}
                  >
                    <p className="margin-0">{msg.contenu}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 shrink-0 select-none">
                      <span className="text-[9px] text-gray-400">
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.isOwn && (
                        <div className="flex items-center text-[#1E824C]">
                          <Check className="w-3 h-3 -mr-1" />
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT ZONE */}
      <div className="bg-white border-t border-gray-200 shadow-xl shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
          
          {/* QUICK EMOJIS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Réactions:</span>
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInput(prev => prev + emoji)}
                className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:scale-90 transition rounded-lg text-sm"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* INPUT FORM */}
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
              className="h-11 rounded-2xl border-gray-200 bg-gray-50 pr-4 text-sm focus-visible:ring-cnt-blue flex-1"
              maxLength={500}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`w-11 h-11 rounded-2xl p-0 shrink-0 flex items-center justify-center transition-all ${
                input.trim() ? 'bg-cnt-blue hover:bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-300'
              }`}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
            <span>En tant que : <strong className="text-gray-600">{passager}</strong></span>
            <span>{input.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cnt-blue" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

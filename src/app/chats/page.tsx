"use server";

import { db } from '@/lib/db';
import { tickets, schedules, routes, cities, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { MessageSquareOff, ArrowRight } from 'lucide-react';

export default async function ChatsPage() {
  const { userId: clerkId } = auth();
  if (!clerkId) {
    redirect('/');
  }

  // Get user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    redirect('/');
  }

  const userTickets = await db.query.tickets.findMany({
    where: eq(tickets.userId, user.id),
    with: {
      schedule: {
        with: {
          route: {
            with: {
              cityDepart: true,
              cityArrivee: true,
            }
          }
        }
      }
    }
  });

  const activeSchedules = new Map();
  userTickets.forEach(t => {
    if (t.schedule && t.schedule.statut === 'actif') {
      activeSchedules.set(t.schedule.id, t.schedule);
    }
  });
  
  const schedulesList = Array.from(activeSchedules.values());

  return (
    <main className="min-h-screen bg-cnt-bg font-sans text-cnt-text">
      <Navbar alwaysSolid={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {schedulesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquareOff className="w-10 h-10 text-gray-400 stroke-[1.5]" />
            </div>
            <h2 className="text-2xl font-light text-cnt-blue mb-3 tracking-tight">Aucun trajet actif</h2>
            <p className="text-gray-500 font-light mb-8 max-w-md">
              Vous n'avez actuellement aucun billet pour un trajet en cours. Réservez un billet pour pouvoir échanger avec les autres passagers.
            </p>
            <Link 
              href="/horaires" 
              className="group flex items-center gap-2 bg-cnt-yellow hover:bg-yellow-500 text-cnt-blue px-6 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow"
            >
              Réserver un billet
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedulesList.map(schedule => (
              <Link key={schedule.id} href={`/chat/${schedule.id}`} className="block">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-cnt-blue">{schedule.route.cityDepart.nom} → {schedule.route.cityArrivee.nom}</h3>
                      <p className="text-sm text-gray-500">Date : {schedule.dateVoyage}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Actif</span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-gray-700 font-medium">Départ : {schedule.heureDepart}</p>
                    <p className="text-sm text-cnt-blue mt-4 flex items-center gap-1 font-semibold hover:text-cnt-yellow transition-colors">
                       Rejoindre la discussion <span>→</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tickets, users, schedules, routes, cities } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import LiveTrackingMap from './LiveTrackingMap';
import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function SuiviPage() {
  const { userId: clerkId } = auth();

  if (!clerkId) {
    // Si pas connecté, rediriger ou inviter à se connecter
    redirect('/sign-in?redirect_url=/suivi');
  }

  // Get user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    redirect('/');
  }

  // Get active tickets for this user
  const userTickets = await db.query.tickets.findMany({
    where: eq(tickets.userId, user.id),
    orderBy: [desc(tickets.createdAt)],
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

  // Filter valid tickets (statut = 'valide' or similar, but for now we look at the schedule status)
  const validTickets = userTickets.filter(t => t.statut === 'valide' && t.schedule);
  
  if (validTickets.length === 0) {
    return (
      <main className="min-h-screen bg-cnt-bg font-sans">
        <Navbar alwaysSolid={true} />
        <div className="flex flex-col items-center justify-center pt-40 px-4 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Image src="/icons/origin.png" alt="Trajet" height={24} width={24} className="w-10 h-10 text-gray-400 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-light text-cnt-blue mb-3 tracking-tight">Pas de trajet en cours</h2>
          <p className="text-gray-500 font-light mb-8 max-w-md">
            Vous n'avez actuellement aucun billet pour suivre un trajet. Réservez un billet pour suivre votre bus en temps réel.
          </p>
          <Link 
            href="/horaires" 
            className="group flex items-center gap-2 bg-cnt-yellow hover:bg-yellow-500 text-cnt-blue px-6 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow"
          >
            Réserver un billet
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    );
  }

  // Sort to find the most relevant schedule
  // Find the most relevant ticket (valide or utilise)
  const activeTicket = userTickets.find(t => t.statut === 'valide' && t.schedule);
  const finishedTicket = userTickets.find(t => t.statut === 'utilise' && t.schedule);

  const ticketToDisplay = activeTicket || finishedTicket;
  
  if (!ticketToDisplay || !ticketToDisplay.schedule) {
    return redirect('/'); // Should not happen given the checks above
  }

  const schedule = ticketToDisplay.schedule;
  const routeName = `${schedule.route.cityDepart.nom} → ${schedule.route.cityArrivee.nom}`;

  const isFinished = ticketToDisplay.statut === 'utilise';
  
  // Basic check to see if it's in the future (simple string comparison works for YYYY-MM-DD HH:MM)
  const now = new Date();
  const currentDateStr = now.toISOString().split('T')[0];
  const currentHourStr = now.toTimeString().substring(0, 5);
  
  const isFuture = schedule.dateVoyage > currentDateStr || 
                   (schedule.dateVoyage === currentDateStr && schedule.heureDepart > currentHourStr);

  if (isFuture && !isFinished) {
    return (
      <main className="min-h-screen bg-cnt-bg font-sans">
        <Navbar alwaysSolid={true} />
        <div className="flex flex-col items-center justify-center pt-40 px-4 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-cnt-blue stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-light text-cnt-blue mb-3 tracking-tight">Trajet à venir</h2>
          <p className="text-gray-500 font-light mb-8 max-w-md">
            Votre bus pour <strong>{routeName}</strong> prévu le <strong>{schedule.dateVoyage} à {schedule.heureDepart}</strong> n'a pas encore démarré. Le suivi GPS sera disponible une fois le trajet initié par le chauffeur.
          </p>
          <Link 
            href="/chats" 
            className="group flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-6 py-2.5 rounded-full font-medium transition-all shadow-sm"
          >
            Aller à Mes Chats
          </Link>
        </div>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="min-h-screen bg-cnt-bg font-sans">
        <Navbar alwaysSolid={true} />
        <div className="flex flex-col items-center justify-center pt-40 px-4 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-cnt-green stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-light text-cnt-blue mb-3 tracking-tight">Trajet terminé</h2>
          <p className="text-gray-500 font-light mb-8 max-w-md">
            Votre voyage <strong>{routeName}</strong> est achevé. Le bus est bien arrivé à destination.
          </p>
          <Link 
            href="/horaires" 
            className="group flex items-center gap-2 bg-cnt-yellow hover:bg-yellow-500 text-cnt-blue px-6 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow"
          >
            Nouveau trajet
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    );
  }

  // Otherwise, it's active!
  return (
    <main className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      <Navbar alwaysSolid={true} />
      
      {/* Container principal plein écran (hauteur de l'écran moins la navbar) */}
      <div className="flex-1 relative mt-16">
        <LiveTrackingMap 
          busId={schedule.busId} 
          scheduleId={schedule.id}
          routeName={routeName}
          departureTime={schedule.heureDepart}
          distanceTotal={schedule.route.distanceKm || 0}
          departure={{ lat: schedule.route.cityDepart.lat || 0, lng: schedule.route.cityDepart.lng || 0, name: schedule.route.cityDepart.nom }}
          arrival={{ lat: schedule.route.cityArrivee.lat || 0, lng: schedule.route.cityArrivee.lng || 0, name: schedule.route.cityArrivee.nom }}
        />
      </div>
    </main>
  );
}

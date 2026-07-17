"use server";

import { db } from "@/lib/db";
import { routes, schedules, tickets, buses } from "@/lib/db/schema";
import { eq, and, sql, desc, count } from "drizzle-orm";

export async function getAllRoutes() {
  const foundRoutes = await db.query.routes.findMany({
    where: eq(routes.actif, true),
    with: {
      cityDepart: true,
      cityArrivee: true,
      schedules: {
        where: eq(schedules.statut, 'actif'),
        with: {
          bus: true
        }
      }
    }
  });
  return foundRoutes;
}

export async function getAvailableSchedules(
  depart: string,
  arrivee: string,
  dateVoyage: string // YYYY-MM-DD
) {
  // Remove mappedDay completely since we use precise dates now

  // 1. Trouver la route
  const routeRecord = await db.query.routes.findFirst({
    where: (routes, { eq, and }) =>
      and(
        eq(routes.actif, true),
        // On devrait normalement comparer les IDs, mais avec les noms :
        // (Pour simplifier, on récupère toutes les routes et on filtre en JS si besoin, 
        // ou on joint avec cities)
      ),
    with: {
      cityDepart: true,
      cityArrivee: true,
    }
  });
  
  // Pour plus de précision, cherchons via join :
  const foundRoutes = await db.query.routes.findMany({
    where: eq(routes.actif, true),
    with: {
      cityDepart: true,
      cityArrivee: true,
      schedules: {
        where: eq(schedules.statut, 'actif'),
        with: {
          bus: true
        }
      }
    }
  });

  const matchingRoute = foundRoutes.find(r => 
    r.cityDepart.nom === depart && r.cityArrivee.nom === arrivee
  );

  if (!matchingRoute) {
    return [];
  }

  // 2. Filtrer les schedules pour le jour donné
  const now = new Date();
  
  const daySchedules = matchingRoute.schedules.filter(s => {
    return s.dateVoyage === dateVoyage;
  });

  if (daySchedules.length === 0) return [];

  // 3. Calculer les places restantes pour chaque schedule
  const scheduleIds = daySchedules.map(s => s.id);
  
  const ticketsCount = await db
    .select({
      scheduleId: tickets.scheduleId,
      count: count(),
    })
    .from(tickets)
    .where(
      and(
        eq(tickets.statut, "valide"),
        sql`DATE(${tickets.dateVoyage}) = DATE(${dateVoyage})`
        // et inclure les scheduleIds
      )
    )
    .groupBy(tickets.scheduleId);

  const countMap = new Map(ticketsCount.map((t) => [t.scheduleId, t.count]));

  const result = daySchedules.map((s) => {
    const booked = countMap.get(s.id) || 0;
    const capacity = s.bus?.capacite || 0;
    const restantes = capacity - booked;
    
    // Check if past
    const [year, month, day] = dateVoyage.split('-');
    const [hour, minute] = s.heureDepart.split(':');
    const scheduleDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const isPast = scheduleDate < now;
    
    // Check if bus is inactive
    const isMaintenance = s.bus?.statut !== 'actif';

    return {
      id: s.id,
      heureDepart: s.heureDepart,
      heureArriveeEstimee: s.heureArriveeEstimee,
      capacity,
      booked,
      restantes,
      isFull: restantes <= 0,
      isPast,
      isMaintenance,
      busName: s.bus?.matricule,
      busStatus: s.bus?.statut
    };
  }); // On renvoie tout (même pleins ou passés) pour que le frontend gère l'UI (grisé)

  // Trier par heure de départ
  return result.sort((a, b) => a.heureDepart.localeCompare(b.heureDepart));
}

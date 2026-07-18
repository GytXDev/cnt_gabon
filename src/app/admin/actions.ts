"use server";

import { db } from "@/lib/db";
import { routes, schedules, tickets, buses, users, cities } from "@/lib/db/schema";
import { eq, and, sql, desc, count, inArray, gte } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Vérifie que l'utilisateur courant a le rôle "admin".
 */
export async function checkAdmin() {
  const { userId } = auth();
  if (!userId) throw new Error("Non autorisé");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (userRecord?.role !== "admin") {
    throw new Error("Accès refusé. Réservé aux administrateurs.");
  }
  return userRecord;
}

// ─────────────────────────────────────────────────────────
// ROUTES (TRAJETS)
// ─────────────────────────────────────────────────────────

export async function getAdminRoutes(page: number = 1, limit: number = 10) {
  await checkAdmin();
  const offset = (page - 1) * limit;

  const data = await db.query.routes.findMany({
    with: {
      cityDepart: true,
      cityArrivee: true,
      schedules: {
        with: {
          bus: true
        },
        orderBy: (schedules, { desc }) => [desc(schedules.dateVoyage), desc(schedules.heureDepart)]
      }
    },
    orderBy: [desc(routes.id)],
    limit,
    offset,
  });

  const total = await db.select({ count: sql<number>`count(*)` }).from(routes);
  
  return {
    routes: data,
    totalCount: Number(total[0].count),
    totalPages: Math.ceil(Number(total[0].count) / limit)
  };
}

export async function getAdminRouteById(id: number) {
  await checkAdmin();
  const route = await db.query.routes.findFirst({
    where: eq(routes.id, id),
    with: {
      cityDepart: true,
      cityArrivee: true,
      schedules: {
        with: { bus: true },
        orderBy: [desc(schedules.heureDepart)],
      }
    }
  });
  return route;
}

export async function deleteRoute(routeId: number) {
  await checkAdmin();

  // 1. Vérifier si des billets ont été vendus pour ce trajet
  const soldTickets = await db.query.tickets.findFirst({
    where: eq(tickets.routeId, routeId),
  });

  if (soldTickets) {
    throw new Error("Impossible de supprimer ce trajet : des billets ont déjà été vendus. Veuillez plutôt le désactiver.");
  }

  // 2. S'il n'y a pas de billets, on peut supprimer les créneaux horaires associés
  await db.delete(schedules).where(eq(schedules.routeId, routeId));

  // 3. Enfin, on supprime le trajet
  await db.delete(routes).where(eq(routes.id, routeId));

  revalidatePath("/admin/routes");
}

export async function toggleRouteStatus(routeId: number, actif: boolean) {
  await checkAdmin();
  await db.update(routes).set({ actif }).where(eq(routes.id, routeId));
  revalidatePath("/admin/routes");
}

export async function createRoute(data: {
  cityDepartId: number;
  cityArriveeId: number;
  prixEconomique: number;
  prixStandard: number;
  prixVip: number;
}) {
  await checkAdmin();
  const res = await db.insert(routes).values({
    ...data,
    actif: true,
  }).returning();
  revalidatePath("/admin/routes");
  return res[0];
}

export async function updateRouteBaseInfo(routeId: number, data: {
  prixStandard: number;
  actif: boolean;
}) {
  await checkAdmin();
  await db.update(routes).set({
    prixStandard: data.prixStandard,
    prixEconomique: data.prixStandard,
    prixVip: data.prixStandard,
    actif: data.actif,
  }).where(eq(routes.id, routeId));
  revalidatePath("/admin/routes");
}

export async function uploadRouteImage(routeId: number, base64Image: string) {
  await checkAdmin();
  try {
    const res = await cloudinary.uploader.upload(base64Image, {
      folder: "cnt-gabon/routes",
    });
    await db.update(routes).set({ image: res.secure_url }).where(eq(routes.id, routeId));
    revalidatePath("/admin/routes");
  } catch (err) {
    console.error(err);
    throw new Error("Erreur lors de l'upload de l'image");
  }
}

// ─────────────────────────────────────────────────────────
// SCHEDULES (HORAIRES)
// ─────────────────────────────────────────────────────────

export async function createSchedule(data: {
  routeId: number;
  busId: string;
  heureDepart: string;
  heureArriveeEstimee: string;
  dates: string[];
  statut?: 'actif'|'inactif';
}) {
  await checkAdmin();
  
  const now = new Date();
  for (const dateStr of data.dates) {
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = data.heureDepart.split(':');
    const scheduleDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    if (scheduleDate < now) {
      return { success: false, error: `Impossible de créer un horaire dans le passé (${dateStr} à ${data.heureDepart})` };
    }
  }

  try {
    const results = [];
    for (const dateStr of data.dates) {
      const res = await db.insert(schedules).values({
        routeId: data.routeId,
        busId: data.busId,
        heureDepart: data.heureDepart,
        heureArriveeEstimee: data.heureArriveeEstimee,
        dateVoyage: dateStr,
        statut: data.statut || "actif",
      }).returning();
      results.push(res[0]);
    }
    revalidatePath("/admin/routes");
    return { success: true, data: results };
  } catch (err: any) {
    if (err?.code === '23505' || err?.message?.includes('23505') || err?.message?.includes('already exists')) {
      return { success: false, error: "Ce bus est déjà assigné sur ce créneau pour l'une des dates sélectionnées." };
    }
    console.error(err);
    return { success: false, error: "Une erreur est survenue lors de l'enregistrement." };
  }
}

export async function toggleScheduleStatus(scheduleId: number, statut: 'actif'|'inactif') {
  await checkAdmin();
  await db.update(schedules).set({ statut }).where(eq(schedules.id, scheduleId));
  revalidatePath("/admin/routes");
}

export async function deleteSchedule(scheduleId: number) {
  await checkAdmin();
  await db.delete(schedules).where(eq(schedules.id, scheduleId));
  revalidatePath("/admin/routes");
}



// ─────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  await checkAdmin();

  const totalTickets = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.statut, "valide"));

  const salesByClass = await db
    .select({
      classe: tickets.classe,
      count: count(),
    })
    .from(tickets)
    .where(eq(tickets.statut, "valide"))
    .groupBy(tickets.classe);

  const revenue = await db
    .select({ total: sql<number>`SUM(${tickets.montantPaye})` })
    .from(tickets)
    .where(eq(tickets.statut, "valide"));

  return {
    totalTickets: totalTickets[0].count,
    salesByClass,
    revenue: revenue[0].total || 0,
  };
}

export async function getSchedulesCapacity(dateVoyage: string) {
  // dateVoyage format : YYYY-MM-DD
  await checkAdmin();

  // Pour une vue Dashboard des capacités de la journée :
  const daySchedules = await db.query.schedules.findMany({
    where: and(
      eq(schedules.statut, "actif"),
      gte(schedules.dateVoyage, dateVoyage) // Prochains départs inclus
    ),
    orderBy: [schedules.dateVoyage, schedules.heureDepart],
    with: {
      bus: true,
      route: {
        with: {
          cityDepart: true,
          cityArrivee: true,
        },
      },
    },
  });

  const scheduleIds = daySchedules.map((s) => s.id);
  if (scheduleIds.length === 0) return [];

  // On compte les tickets valides par scheduleId pour cette date
  const ticketsCount = await db
    .select({
      scheduleId: tickets.scheduleId,
      count: count(),
    })
    .from(tickets)
    .where(
      and(
        inArray(tickets.statut, ["valide", "utilise"]),
        inArray(tickets.scheduleId, scheduleIds)
      )
    )
    .groupBy(tickets.scheduleId);

  const countMap = new Map(ticketsCount.map((t) => [t.scheduleId, t.count]));

  const result = daySchedules.map((s) => {
    const booked = countMap.get(s.id) || 0;
    const capacity = s.bus?.capacite || 0;
    return {
      scheduleId: s.id,
      route: `${s.route.cityDepart.nom} - ${s.route.cityArrivee.nom}`,
      heureDepart: s.heureDepart,
      bus: s.bus,
      booked,
      capacity,
      restantes: capacity - booked,
      dateVoyage: s.dateVoyage,
    };
  });

  return result;
}

// ─────────────────────────────────────────────────────────
// BUS (FLOTTE)
// ─────────────────────────────────────────────────────────

export async function getBuses(page: number = 1, limit: number = 10) {
  await checkAdmin();
  const offset = (page - 1) * limit;

  const data = await db.query.buses.findMany({
    with: {
      schedules: {
        with: {
          route: {
            with: {
              cityDepart: true,
              cityArrivee: true
            }
          }
        },
        orderBy: (schedules, { desc }) => [desc(schedules.dateVoyage), desc(schedules.heureDepart)]
      }
    },
    orderBy: [desc(buses.createdAt)],
    limit,
    offset,
  });

  const total = await db.select({ count: sql<number>`count(*)` }).from(buses);

  return {
    buses: data,
    totalCount: Number(total[0].count),
    totalPages: Math.ceil(Number(total[0].count) / limit)
  };
}

export async function getAllBuses() {
  await checkAdmin();
  return await db.query.buses.findMany({
    where: eq(buses.statut, 'actif'),
    orderBy: [desc(buses.createdAt)],
  });
}

export async function createBus(data: {
  matricule: string;
  capacite: number;
  type: string;
  statut: 'actif' | 'inactif' | 'en_route';
  image?: string;
}) {
  await checkAdmin();
  const res = await db.insert(buses).values(data).returning();
  revalidatePath("/admin/buses");
  return res[0];
}

export async function updateBus(busId: string, data: {
  matricule: string;
  capacite: number;
  type: string;
  statut: 'actif' | 'inactif' | 'en_route';
  image?: string;
}) {
  await checkAdmin();
  const res = await db.update(buses).set(data).where(eq(buses.id, busId)).returning();
  revalidatePath("/admin/buses");
  return res[0];
}

export async function deleteBus(busId: string) {
  await checkAdmin();

  // Vérifier si le bus est assigné à un trajet existant
  const assignedSchedules = await db.query.schedules.findFirst({
    where: eq(schedules.busId, busId),
  });

  if (assignedSchedules) {
    throw new Error("Impossible de supprimer ce bus : il est actuellement assigné à des créneaux horaires. Veuillez le retirer des trajets concernés avant de le supprimer.");
  }

  await db.delete(buses).where(eq(buses.id, busId));
  revalidatePath("/admin/buses");
}

export async function uploadBusImage(base64Image: string) {
  await checkAdmin();
  try {
    const res = await cloudinary.uploader.upload(base64Image, {
      folder: "cnt-gabon/buses",
    });
    return res.secure_url;
  } catch (err) {
    console.error(err);
    throw new Error("Erreur lors de l'upload de l'image");
  }
}

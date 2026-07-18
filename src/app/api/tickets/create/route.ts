import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets, routes, cities, passTypes, schedules } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      transactionId,
      ticketRef,
      depart,
      arrivee,
      mode,
      date,
      type,
      montant,
      passagerPrenom,
      passagerNom,
      passagerTelephone,
      userId,
      heureDeparture,
      heureArriveeEstimee,
      scheduleId,
    } = body;

    // Validation basique
    if (!ticketRef || !depart || !arrivee || !montant || !passagerPrenom || !passagerNom) {
      return NextResponse.json(
        { success: false, message: 'Données obligatoires manquantes.' },
        { status: 400 }
      );
    }

    // Vérification si ce ticket existe déjà (idempotence)
    const existing = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketRef, ticketRef))
      .limit(1);

    if (existing.length > 0) {
      // Ticket déjà créé — on renvoie les données existantes
      const t = existing[0];
      return NextResponse.json({
        success: true,
        ticketId: t.id,
        ticketRef: t.ticketRef,
        qrCodeBase64: (t.qrData as any).qrCodeBase64,
        alreadyExists: true,
      });
    }

    // Recherche de la route en DB
    let routeId: number | null = null;
    const departCity = await db
      .select()
      .from(cities)
      .where(eq(cities.nom, depart))
      .limit(1);
    const arriveeCity = await db
      .select()
      .from(cities)
      .where(eq(cities.nom, arrivee))
      .limit(1);

    if (departCity.length > 0 && arriveeCity.length > 0) {
      const routeResult = await db
        .select()
        .from(routes)
        .where(
          and(
            eq(routes.cityDepartId, departCity[0].id),
            eq(routes.cityArriveeId, arriveeCity[0].id)
          )
        )
        .limit(1);
      if (routeResult.length > 0) routeId = routeResult[0].id;
    }

    // --- VÉRIFICATION DE LA CAPACITÉ (SURVENTE) ---
    if (scheduleId && date) {
      const scheduleRec = await db.query.schedules.findFirst({
        where: eq(schedules.id, parseInt(scheduleId)),
        with: { bus: true }
      });
      if (scheduleRec && scheduleRec.bus) {
        const capacity = scheduleRec.bus.capacite || 0;
        const countRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(tickets)
          .where(
            and(
              eq(tickets.scheduleId, parseInt(scheduleId)),
              inArray(tickets.statut, ['valide', 'utilise'])
            )
          );
        const booked = countRes[0].count;
        if (booked >= capacity) {
          return NextResponse.json(
            { success: false, message: 'Désolé, ce créneau est complet (survente évitée).' },
            { status: 409 }
          );
        }
      }
    }
    // ----------------------------------------------

    // Construction des données QR (vérifiables hors-ligne)
    const qrPayload = {
      ref: ticketRef,
      passager: `${passagerPrenom} ${passagerNom}`,
      depart,
      arrivee,
      mode: mode || 'bus',
      date,
      type,
      montant: parseInt(montant),
      heureDep: heureDeparture || null,
      heureArr: heureArriveeEstimee || null,
      statut: 'valide',
      emis: new Date().toISOString(),
      tid: transactionId || null,
    };

    // Génération du QR code en base64 (PNG)
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: { dark: '#0A3055', light: '#FFFFFF' },
    });

    // Stockage des données complètes dans qrData (JSON)
    const qrData = { ...qrPayload, qrCodeBase64 };

    // Insertion en DB
    const [newTicket] = await db
      .insert(tickets)
      .values({
        id: uuidv4(),
        ticketRef,
        userId: userId || null,
        passagerPrenom,
        passagerNom,
        passagerTelephone: passagerTelephone || null,
        routeId,
        passTypeId: null,
        classe: 'economique',
        statut: 'valide',
        montantPaye: parseInt(montant),
        heureDeparture: heureDeparture ? new Date(heureDeparture) : null,
        heureArriveeEstimee: heureArriveeEstimee ? new Date(heureArriveeEstimee) : null,
        dateVoyage: date ? new Date(date) : null,
        scheduleId: scheduleId ? parseInt(scheduleId) : null,
        qrData,
        transactionId: transactionId || null,
        paymentProvider: 'singpay',
      })
      .returning();

    return NextResponse.json({
      success: true,
      ticketId: newTicket.id,
      ticketRef: newTicket.ticketRef,
      qrCodeBase64,
    });
  } catch (error: any) {
    console.error('Erreur création ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne: ' + error.message },
      { status: 500 }
    );
  }
}

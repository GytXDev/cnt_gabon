import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// POST /api/tickets/verify — Marque un ticket comme "utilisé"
// Corps: { ticketRef: string }
export async function POST(request: Request) {
  try {
    const { ticketRef } = await request.json();

    if (!ticketRef) {
      return NextResponse.json(
        { success: false, message: 'Référence ticket manquante.' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketRef, ticketRef))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Ticket introuvable.', statut: 'invalide' },
        { status: 404 }
      );
    }

    const ticket = existing[0];

    // Vérification du statut actuel
    if (ticket.statut === 'utilise') {
      return NextResponse.json({
        success: false,
        message: 'Ce ticket a déjà été utilisé.',
        statut: 'utilise',
        ticket: {
          ref: ticket.ticketRef,
          passager: `${ticket.passagerPrenom} ${ticket.passagerNom}`,
          statut: ticket.statut,
        },
      });
    }

    if (ticket.statut === 'annule') {
      return NextResponse.json({
        success: false,
        message: 'Ce ticket a été annulé.',
        statut: 'annule',
      });
    }

    if (ticket.statut === 'invalide') {
      return NextResponse.json({
        success: false,
        message: 'Ce ticket est invalide.',
        statut: 'invalide',
      });
    }

    // Marquer comme utilisé
    await db
      .update(tickets)
      .set({ statut: 'utilise', updatedAt: new Date() })
      .where(eq(tickets.ticketRef, ticketRef));

    return NextResponse.json({
      success: true,
      message: 'Ticket validé avec succès.',
      statut: 'utilise',
      ticket: {
        ref: ticket.ticketRef,
        passager: `${ticket.passagerPrenom} ${ticket.passagerNom}`,
        depart: (ticket.qrData as any)?.depart,
        arrivee: (ticket.qrData as any)?.arrivee,
        montant: ticket.montantPaye,
        statut: 'utilise',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

// GET /api/tickets/verify?ref=CNT-XXXX — Vérification sans modification
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketRef = searchParams.get('ref');

    if (!ticketRef) {
      return NextResponse.json(
        { success: false, message: 'Paramètre ref manquant.' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketRef, ticketRef))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, statut: 'invalide', message: 'Ticket introuvable.' });
    }

    const ticket = existing[0];
    return NextResponse.json({
      success: true,
      statut: ticket.statut,
      ticket: {
        ref: ticket.ticketRef,
        passager: `${ticket.passagerPrenom} ${ticket.passagerNom}`,
        depart: (ticket.qrData as any)?.depart,
        arrivee: (ticket.qrData as any)?.arrivee,
        dateVoyage: ticket.dateVoyage,
        montant: ticket.montantPaye,
        statut: ticket.statut,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

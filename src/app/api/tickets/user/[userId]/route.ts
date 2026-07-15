import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/tickets/user/[userId] — Historique des tickets d'un utilisateur
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const userTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt))
      .limit(50);

    const ticketList = userTickets.map((t) => {
      const qr = t.qrData as any;
      return {
        id: t.id,
        ref: t.ticketRef,
        passager: `${t.passagerPrenom} ${t.passagerNom}`,
        depart: qr?.depart,
        arrivee: qr?.arrivee,
        mode: qr?.mode,
        date: qr?.date,
        type: qr?.type,
        montant: t.montantPaye,
        statut: t.statut,
        classe: t.classe,
        createdAt: t.createdAt,
        transactionId: t.transactionId,
      };
    });

    return NextResponse.json({ success: true, tickets: ticketList });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

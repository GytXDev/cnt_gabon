import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/tickets/[ref] — Récupère un ticket par référence
export async function GET(
  request: Request,
  { params }: { params: { ref: string } }
) {
  try {
    const { ref } = params;

    const result = await db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketRef, ref))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Ticket introuvable.' },
        { status: 404 }
      );
    }

    const ticket = result[0];
    // On ne renvoie pas le QR base64 complet ici (lourd) — juste les métadonnées
    const { qrData, ...meta } = ticket;
    const qrMeta = qrData as any;

    return NextResponse.json({
      success: true,
      ticket: {
        ...meta,
        statut: ticket.statut,
        qrDataPreview: {
          ref: qrMeta.ref,
          passager: qrMeta.passager,
          depart: qrMeta.depart,
          arrivee: qrMeta.arrivee,
          date: qrMeta.date,
          montant: qrMeta.montant,
          mode: qrMeta.mode || 'bus',
          type: qrMeta.type || 'Aller simple',
          tid: qrMeta.tid || '',
        },
        qrCodeBase64: qrMeta?.qrCodeBase64 || null,
        hasQrCode: !!qrMeta?.qrCodeBase64,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages, users, tickets } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';

import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// GET /api/chat/[scheduleId] — Récupère les messages d'une salle
export async function GET(
  request: Request,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const { scheduleId } = params;
    const { userId: clerkId } = auth();

    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier l'utilisateur
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    if (!user) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier si l'utilisateur a un ticket valide pour ce créneau
    const userTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.scheduleId, parseInt(scheduleId)),
          eq(tickets.userId, user.id)
        )
      );

    if (userTickets.length === 0 && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Accès refusé. Vous n\'avez pas de billet pour ce trajet.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // timestamp ISO pour polling

    let query = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.scheduleId, parseInt(scheduleId)))
      .orderBy(asc(chatMessages.createdAt))
      .limit(100);

    const messages = await query;

    return NextResponse.json({
      success: true,
      scheduleId,
      messages: messages.map((m) => ({
        id: m.id,
        senderNom: m.senderNom || 'Passager',
        contenu: m.contenu,
        createdAt: m.createdAt,
        isOwn: m.senderId === user.id, // Le client détermine ça côté front
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/chat/[scheduleId] — Envoie un message
export async function POST(
  request: Request,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const { scheduleId } = params;
    const { contenu, senderNom } = await request.json();
    const { userId: clerkId } = auth();

    if (!clerkId) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier l'utilisateur
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    if (!user) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le ticket
    const userTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.scheduleId, parseInt(scheduleId)),
          eq(tickets.userId, user.id)
        )
      );

    if (userTickets.length === 0 && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Accès refusé. Vous n\'avez pas de billet pour ce trajet.' }, { status: 403 });
    }

    if (!contenu || !contenu.trim()) {
      return NextResponse.json(
        { success: false, message: 'Le message ne peut pas être vide.' },
        { status: 400 }
      );
    }

    const [message] = await db
      .insert(chatMessages)
      .values({
        scheduleId: parseInt(scheduleId),
        senderId: user.id,
        senderNom: senderNom || user.prenom || 'Passager',
        contenu: contenu.trim(),
        actif: true,
      })
      .returning();

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

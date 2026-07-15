import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/chat/[roomId] — Récupère les messages d'une salle
// roomId = "routeId_YYYY-MM-DD" ex: "3_2025-01-15"
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // timestamp ISO pour polling

    let query = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(100);

    const messages = await query;

    return NextResponse.json({
      success: true,
      roomId,
      messages: messages.map((m) => ({
        id: m.id,
        senderNom: m.senderNom || 'Passager',
        contenu: m.contenu,
        createdAt: m.createdAt,
        isOwn: false, // Le client détermine ça côté front
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/chat/[roomId] — Envoie un message
export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const { contenu, senderNom, senderId } = await request.json();

    if (!contenu || !contenu.trim()) {
      return NextResponse.json(
        { success: false, message: 'Le message ne peut pas être vide.' },
        { status: 400 }
      );
    }

    const [message] = await db
      .insert(chatMessages)
      .values({
        roomId,
        senderId: senderId || null,
        senderNom: senderNom || 'Passager anonyme',
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

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// POST /api/users/sync — Synchronise ou crée un utilisateur Clerk en DB
export async function POST(request: Request) {
  try {
    const { clerkId, email, prenom, nom, telephone } = await request.json();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: 'clerkId obligatoire.' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (existing.length > 0) {
      // Mise à jour des données si nécessaire
      const [updated] = await db
        .update(users)
        .set({
          email: email || existing[0].email,
          prenom: prenom || existing[0].prenom,
          nom: nom || existing[0].nom,
          telephone: telephone || existing[0].telephone,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning();

      return NextResponse.json({ success: true, user: updated, created: false });
    }

    // Création
    const [newUser] = await db
      .insert(users)
      .values({
        id: uuidv4(),
        clerkId,
        email,
        prenom,
        nom,
        telephone,
        role: 'passager',
      })
      .returning();

    return NextResponse.json({ success: true, user: newUser, created: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

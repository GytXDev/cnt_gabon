import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { busPositions, busPositionsHistory, buses } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET /api/buses/[busId]/position — Dernière position GPS du bus
export async function GET(
  request: Request,
  { params }: { params: { busId: string } }
) {
  try {
    const { busId } = params;

    const latest = await db
      .select()
      .from(busPositions)
      .where(eq(busPositions.busId, busId))
      .orderBy(desc(busPositions.timestamp))
      .limit(1);

    if (latest.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Aucune position enregistrée pour ce bus.' },
        { status: 404 }
      );
    }

    const pos = latest[0];
    return NextResponse.json({
      success: true,
      position: {
        lat: pos.lat,
        lng: pos.lng,
        speedKmh: pos.speedKmh,
        timestamp: pos.timestamp,
        busId: pos.busId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/buses/[busId]/position — Mise à jour position GPS (chauffeur)
export async function POST(
  request: Request,
  { params }: { params: { busId: string } }
) {
  try {
    const { busId } = params;
    const { lat, lng, speedKmh } = await request.json();

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, message: 'Latitude et longitude obligatoires.' },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Upsert la position courante
    const [pos] = await db
      .insert(busPositions)
      .values({
        busId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        speedKmh: speedKmh ? parseFloat(speedKmh) : null,
        timestamp: now,
      })
      .onConflictDoUpdate({
        target: busPositions.busId,
        set: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          speedKmh: speedKmh ? parseFloat(speedKmh) : null,
          timestamp: now,
        },
      })
      .returning();

    // 2. Insérer l'historique
    await db.insert(busPositionsHistory).values({
      busId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      speedKmh: speedKmh ? parseFloat(speedKmh) : null,
      timestamp: now,
    });

    return NextResponse.json({ success: true, position: pos });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur: ' + error.message },
      { status: 500 }
    );
  }
}

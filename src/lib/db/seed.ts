/**
 * Script de seed — Données initiales CNT Gabon
 * Exécuter avec: npx tsx src/lib/db/seed.ts
 */
import { db } from './index';
import { cities, routes, passTypes } from './schema';

async function seed() {
  console.log('🌱 Seeding CNT Gabon database...');

  // ── 1. VILLES ──────────────────────────────────────────────────────────────
  console.log('  → Inserting cities...');
  await db.insert(cities).values([
    // Grand Libreville
    { nom: 'Libreville', zone: 'grand_libreville', lat: 0.3924, lng: 9.4536 },
    { nom: 'Owendo', zone: 'grand_libreville', lat: 0.3018, lng: 9.5014 },
    { nom: 'Akanda', zone: 'grand_libreville', lat: 0.4872, lng: 9.4018 },
    // Intérieur
    { nom: 'Lambaréné', zone: 'interieur', lat: -0.7, lng: 10.2333 },
    { nom: 'Mouila', zone: 'interieur', lat: -1.8667, lng: 11.0333 },
    { nom: 'Lebamba', zone: 'interieur', lat: -2.2, lng: 11.4833 },
    { nom: 'Tchibanga', zone: 'interieur', lat: -2.9, lng: 10.9833 },
    { nom: 'Makokou', zone: 'interieur', lat: 0.5667, lng: 12.8667 },
    { nom: 'Oyem', zone: 'interieur', lat: 1.6, lng: 11.5833 },
    { nom: 'Bitam', zone: 'interieur', lat: 2.0833, lng: 11.4833 },
  ]).onConflictDoNothing();

  // ── 2. ROUTES intérieur ────────────────────────────────────────────────────
  // Récupération des IDs
  const allCities = await db.select().from(cities);
  const cityMap = Object.fromEntries(allCities.map((c) => [c.nom, c.id]));

  const librevilleId = cityMap['Libreville'];

  const interiorRoutes = [
    { dest: 'Lambaréné', eco: 5000, std: 6500, vip: 8500, km: 253, mins: 240 },
    { dest: 'Mouila', eco: 8000, std: 10000, vip: 13000, km: 480, mins: 480 },
    { dest: 'Lebamba', eco: 10000, std: 12500, vip: 16000, km: 570, mins: 570 },
    { dest: 'Tchibanga', eco: 12000, std: 15000, vip: 19000, km: 630, mins: 630 },
    { dest: 'Makokou', eco: 12000, std: 15000, vip: 19000, km: 660, mins: 720 },
    { dest: 'Oyem', eco: 12000, std: 15000, vip: 19000, km: 530, mins: 600 },
    { dest: 'Bitam', eco: 13000, std: 16000, vip: 20000, km: 650, mins: 660 },
  ];

  for (const r of interiorRoutes) {
    const destId = cityMap[r.dest];
    if (!librevilleId || !destId) continue;
    await db.insert(routes).values([
      {
        cityDepartId: librevilleId,
        cityArriveeId: destId,
        prixEconomique: r.eco,
        prixStandard: r.std,
        prixVip: r.vip,
        distanceKm: r.km,
        dureeMins: r.mins,
        actif: true,
      },
      // Retour
      {
        cityDepartId: destId,
        cityArriveeId: librevilleId,
        prixEconomique: r.eco,
        prixStandard: r.std,
        prixVip: r.vip,
        distanceKm: r.km,
        dureeMins: r.mins,
        actif: true,
      },
    ]).onConflictDoNothing();
  }

  // Grand Libreville — trajet simple Libreville↔Owendo & Libreville↔Akanda
  const owendoId = cityMap['Owendo'];
  const akandaId = cityMap['Akanda'];

  if (owendoId && librevilleId) {
    await db.insert(routes).values([
      { cityDepartId: librevilleId, cityArriveeId: owendoId, prixEconomique: 200, prixStandard: 200, prixVip: 200, distanceKm: 12, dureeMins: 25, actif: true },
      { cityDepartId: owendoId, cityArriveeId: librevilleId, prixEconomique: 200, prixStandard: 200, prixVip: 200, distanceKm: 12, dureeMins: 25, actif: true },
    ]).onConflictDoNothing();
  }
  if (akandaId && librevilleId) {
    await db.insert(routes).values([
      { cityDepartId: librevilleId, cityArriveeId: akandaId, prixEconomique: 200, prixStandard: 200, prixVip: 200, distanceKm: 18, dureeMins: 35, actif: true },
      { cityDepartId: akandaId, cityArriveeId: librevilleId, prixEconomique: 200, prixStandard: 200, prixVip: 200, distanceKm: 18, dureeMins: 35, actif: true },
    ]).onConflictDoNothing();
  }

  // ── 3. PASS TYPES (Grand Libreville) ──────────────────────────────────────
  console.log('  → Inserting pass types...');
  await db.insert(passTypes).values([
    { code: 'simple_gl', nom: 'Trajet simple', prix: 200, dureeJours: null, zone: 'grand_libreville', actif: true },
    { code: 'journalier', nom: 'Passe journalier', prix: 1000, dureeJours: 1, zone: 'grand_libreville', actif: true },
    { code: 'eleve', nom: 'Passe élève', prix: 5000, dureeJours: 30, zone: 'grand_libreville', actif: true },
    { code: 'etudiant', nom: 'Passe étudiant', prix: 8000, dureeJours: 30, zone: 'grand_libreville', actif: true },
    { code: 'mensuel', nom: 'Passe mensuel', prix: 17000, dureeJours: 30, zone: 'grand_libreville', actif: true },
    { code: 'familial', nom: 'Passe familial', prix: 35000, dureeJours: 30, zone: 'grand_libreville', actif: true },
  ]).onConflictDoNothing();

  console.log('✅ Seed terminé avec succès !');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});

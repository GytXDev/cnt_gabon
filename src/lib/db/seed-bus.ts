import { db } from './index';
import { buses } from './schema';

// UUID fixe pour le bus de démonstration (v4 format valide)
export const DEMO_BUS_UUID = '00000000-0000-4000-8000-000000000001';

async function seedBus() {
  console.log('Inserting demo bus...');
  
  await db.insert(buses).values({
    id: DEMO_BUS_UUID,
    matricule: 'GA-1234-LBV',
    modele: 'Mercedes-Benz Sprinter',
    capacite: 25,
    statut: 'en_route',
  }).onConflictDoNothing();
  
  console.log(`Bus demo inséré ! ID: ${DEMO_BUS_UUID}`);
  process.exit(0);
}

seedBus().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});

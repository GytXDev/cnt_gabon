import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  real,
  pgEnum,
  serial,
  jsonb,
  uuid,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const zoneEnum = pgEnum('zone', ['grand_libreville', 'interieur']);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'valide',
  'utilise',
  'annule',
  'invalide',
]);

export const ticketClassEnum = pgEnum('ticket_class', [
  'vip',
  'standard',
  'economique',
]);

export const busStatusEnum = pgEnum('bus_status', [
  'actif',
  'inactif',
  'en_route',
]);

export const userRoleEnum = pgEnum('user_role', [
  'passager',
  'chauffeur',
  'admin',
]);

// ─────────────────────────────────────────────
// USERS — liés à Clerk via clerkId
// ─────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  prenom: varchar('prenom', { length: 100 }),
  nom: varchar('nom', { length: 100 }),
  telephone: varchar('telephone', { length: 20 }),
  role: userRoleEnum('role').default('passager'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────
// CITIES — villes desservies
// ─────────────────────────────────────────────

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 100 }).notNull().unique(),
  zone: zoneEnum('zone').notNull(),
  lat: real('lat'),
  lng: real('lng'),
});

// ─────────────────────────────────────────────
// ROUTES — lignes entre deux villes
// ─────────────────────────────────────────────

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  cityDepartId: integer('city_depart_id')
    .notNull()
    .references(() => cities.id),
  cityArriveeId: integer('city_arrivee_id')
    .notNull()
    .references(() => cities.id),
  prixEconomique: integer('prix_economique').notNull(), // FCFA
  prixStandard: integer('prix_standard').notNull(),
  prixVip: integer('prix_vip').notNull(),
  distanceKm: real('distance_km'),
  dureeMins: integer('duree_mins'),
  actif: boolean('actif').default(true),
});

// ─────────────────────────────────────────────
// PASS TYPES — abonnements (Grand Libreville)
// ─────────────────────────────────────────────

export const passTypes = pgTable('pass_types', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  nom: varchar('nom', { length: 100 }).notNull(),
  prix: integer('prix').notNull(), // FCFA
  dureeJours: integer('duree_jours'), // null = trajet simple
  zone: zoneEnum('zone').notNull(),
  actif: boolean('actif').default(true),
});

// ─────────────────────────────────────────────
// BUSES — véhicules
// ─────────────────────────────────────────────

export const buses = pgTable('buses', {
  id: uuid('id').primaryKey().defaultRandom(),
  matricule: varchar('matricule', { length: 50 }).notNull().unique(),
  modele: varchar('modele', { length: 100 }),
  capacite: integer('capacite').default(50),
  statut: busStatusEnum('statut').default('inactif'),
  chauffeurId: uuid('chauffeur_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────
// BUS_POSITIONS — historique GPS
// ─────────────────────────────────────────────

export const busPositions = pgTable(
  'bus_positions',
  {
    id: serial('id').primaryKey(),
    busId: uuid('bus_id')
      .notNull()
      .references(() => buses.id),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    speedKmh: real('speed_kmh'),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => ({
    busTimestampIdx: index('bus_timestamp_idx').on(table.busId, table.timestamp),
  })
);

// ─────────────────────────────────────────────
// TICKETS — billets achetés
// ─────────────────────────────────────────────

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketRef: varchar('ticket_ref', { length: 20 }).notNull().unique(),

  // Acheteur (peut être non connecté si achat guest)
  userId: uuid('user_id').references(() => users.id),

  // Passager (nom saisi au moment de l'achat)
  passagerPrenom: varchar('passager_prenom', { length: 100 }).notNull(),
  passagerNom: varchar('passager_nom', { length: 100 }).notNull(),
  passagerTelephone: varchar('passager_telephone', { length: 20 }),

  // Trajet (soit route simple, soit pass)
  routeId: integer('route_id').references(() => routes.id),
  passTypeId: integer('pass_type_id').references(() => passTypes.id),

  classe: ticketClassEnum('classe').default('economique'),
  statut: ticketStatusEnum('statut').default('valide'),

  // Prix réellement payé
  montantPaye: integer('montant_paye').notNull(),

  // Horaires
  heureDeparture: timestamp('heure_departure'),
  heureArriveeEstimee: timestamp('heure_arrivee_estimee'),
  dateVoyage: timestamp('date_voyage'),

  // Données QR (JSON sérialisé — contient tout pour vérif hors-ligne)
  qrData: jsonb('qr_data').notNull(),

  // Paiement
  transactionId: varchar('transaction_id', { length: 255 }),
  paymentProvider: varchar('payment_provider', { length: 50 }).default('singpay'),

  // Transfert
  transfertVersId: uuid('transfert_vers_id').references(() => users.id),
  transfertAt: timestamp('transfert_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────
// CHAT_MESSAGES — tchat inter-passagers par route+date
// ─────────────────────────────────────────────

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    // Identifiant de la salle = routeId + dateVoyage (ex: "12_2025-01-15")
    roomId: varchar('room_id', { length: 50 }).notNull(),
    senderId: uuid('sender_id').references(() => users.id),
    senderNom: varchar('sender_nom', { length: 200 }), // nom affiché même si guest
    contenu: text('contenu').notNull(),
    lu: boolean('lu').default(false),
    actif: boolean('actif').default(true), // désactivé à l'arrivée/annulation
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    roomIdx: index('chat_room_idx').on(table.roomId, table.createdAt),
  })
);

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  busesConduits: many(buses),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  routesDepart: many(routes, { relationName: 'depart' }),
  routesArrivee: many(routes, { relationName: 'arrivee' }),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  cityDepart: one(cities, {
    fields: [routes.cityDepartId],
    references: [cities.id],
    relationName: 'depart',
  }),
  cityArrivee: one(cities, {
    fields: [routes.cityArriveeId],
    references: [cities.id],
    relationName: 'arrivee',
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  route: one(routes, {
    fields: [tickets.routeId],
    references: [routes.id],
  }),
  passType: one(passTypes, {
    fields: [tickets.passTypeId],
    references: [passTypes.id],
  }),
}));

export const busesRelations = relations(buses, ({ one, many }) => ({
  chauffeur: one(users, {
    fields: [buses.chauffeurId],
    references: [users.id],
  }),
  positions: many(busPositions),
}));

export const busPositionsRelations = relations(busPositions, ({ one }) => ({
  bus: one(buses, {
    fields: [busPositions.busId],
    references: [buses.id],
  }),
}));

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type City = typeof cities.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type PassType = typeof passTypes.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Bus = typeof buses.$inferSelect;
export type BusPosition = typeof busPositions.$inferSelect;

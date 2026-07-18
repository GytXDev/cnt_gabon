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
  uniqueIndex,
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

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'actif',
  'inactif',
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
  image: varchar('image', { length: 500 }),
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
  image: varchar('image', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────
// BUS_POSITIONS — position actuelle du bus
// ─────────────────────────────────────────────

export const busPositions = pgTable(
  'bus_positions',
  {
    id: serial('id').primaryKey(),
    busId: uuid('bus_id')
      .notNull()
      .unique()
      .references(() => buses.id),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    speedKmh: real('speed_kmh'),
    timestamp: timestamp('timestamp').defaultNow(),
  }
);

// ─────────────────────────────────────────────
// BUS_POSITIONS_HISTORY — historique GPS
// ─────────────────────────────────────────────

export const busPositionsHistory = pgTable(
  'bus_positions_history',
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
    busTimestampIdx: index('bus_history_timestamp_idx').on(table.busId, table.timestamp),
  })
);

// ─────────────────────────────────────────────
// SCHEDULES — départs programmés
// ─────────────────────────────────────────────

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id')
    .notNull()
    .references(() => routes.id),
  busId: uuid('bus_id')
    .notNull()
    .references(() => buses.id),
  heureDepart: varchar('heure_depart', { length: 5 }).notNull(), // Format 'HH:MM'
  heureArriveeEstimee: varchar('heure_arrivee_estimee', { length: 5 }).notNull(), // Format 'HH:MM'
  joursActifs: jsonb('jours_actifs').default([]), // Kept to avoid data loss prompt in drizzle
  dateVoyage: varchar('date_voyage', { length: 10 }).notNull().default('2026-07-17'), // Format 'YYYY-MM-DD'
  statut: scheduleStatusEnum('statut').default('actif'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  unqBusSlot: uniqueIndex('bus_date_time_idx').on(table.busId, table.dateVoyage, table.heureDepart),
}));

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
  scheduleId: integer('schedule_id').references(() => schedules.id),
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
// CHAT_MESSAGES — tchat inter-passagers par créneau (scheduleId)
// ─────────────────────────────────────────────

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    scheduleId: integer('schedule_id')
      .notNull()
      .references(() => schedules.id),
    senderId: uuid('sender_id').references(() => users.id),
    senderNom: varchar('sender_nom', { length: 200 }), // nom affiché même si guest
    contenu: text('contenu').notNull(),
    lu: boolean('lu').default(false),
    actif: boolean('actif').default(true), // désactivé à l'arrivée/annulation
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    scheduleIdx: index('chat_schedule_idx').on(table.scheduleId, table.createdAt),
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
  schedules: many(schedules),
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
  schedule: one(schedules, {
    fields: [tickets.scheduleId],
    references: [schedules.id],
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
  schedules: many(schedules),
}));

export const busPositionsRelations = relations(busPositions, ({ one }) => ({
  bus: one(buses, {
    fields: [busPositions.busId],
    references: [buses.id],
  }),
}));

export const busPositionsHistoryRelations = relations(busPositionsHistory, ({ one }) => ({
  bus: one(buses, {
    fields: [busPositionsHistory.busId],
    references: [buses.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  route: one(routes, {
    fields: [schedules.routeId],
    references: [routes.id],
  }),
  bus: one(buses, {
    fields: [schedules.busId],
    references: [buses.id],
  }),
  tickets: many(tickets),
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
export type BusPositionHistory = typeof busPositionsHistory.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

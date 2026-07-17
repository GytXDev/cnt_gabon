CREATE TYPE "public"."bus_status" AS ENUM('actif', 'inactif', 'en_route');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('actif', 'inactif');--> statement-breakpoint
CREATE TYPE "public"."ticket_class" AS ENUM('vip', 'standard', 'economique');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('valide', 'utilise', 'annule', 'invalide');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('passager', 'chauffeur', 'admin');--> statement-breakpoint
CREATE TYPE "public"."zone" AS ENUM('grand_libreville', 'interieur');--> statement-breakpoint
CREATE TABLE "bus_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bus_id" uuid NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"speed_kmh" real,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "buses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matricule" varchar(50) NOT NULL,
	"modele" varchar(100),
	"capacite" integer DEFAULT 50,
	"statut" "bus_status" DEFAULT 'inactif',
	"chauffeur_id" uuid,
	"image" varchar(500),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "buses_matricule_unique" UNIQUE("matricule")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"sender_id" uuid,
	"sender_nom" varchar(200),
	"contenu" text NOT NULL,
	"lu" boolean DEFAULT false,
	"actif" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	"zone" "zone" NOT NULL,
	"lat" real,
	"lng" real,
	CONSTRAINT "cities_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "pass_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"nom" varchar(100) NOT NULL,
	"prix" integer NOT NULL,
	"duree_jours" integer,
	"zone" "zone" NOT NULL,
	"actif" boolean DEFAULT true,
	CONSTRAINT "pass_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_depart_id" integer NOT NULL,
	"city_arrivee_id" integer NOT NULL,
	"prix_economique" integer NOT NULL,
	"prix_standard" integer NOT NULL,
	"prix_vip" integer NOT NULL,
	"distance_km" real,
	"duree_mins" integer,
	"image" varchar(500),
	"actif" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer NOT NULL,
	"bus_id" uuid NOT NULL,
	"heure_depart" varchar(5) NOT NULL,
	"heure_arrivee_estimee" varchar(5) NOT NULL,
	"date_voyage" varchar(10) NOT NULL,
	"statut" "schedule_status" DEFAULT 'actif',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_ref" varchar(20) NOT NULL,
	"user_id" uuid,
	"passager_prenom" varchar(100) NOT NULL,
	"passager_nom" varchar(100) NOT NULL,
	"passager_telephone" varchar(20),
	"route_id" integer,
	"schedule_id" integer,
	"pass_type_id" integer,
	"classe" "ticket_class" DEFAULT 'economique',
	"statut" "ticket_status" DEFAULT 'valide',
	"montant_paye" integer NOT NULL,
	"heure_departure" timestamp,
	"heure_arrivee_estimee" timestamp,
	"date_voyage" timestamp,
	"qr_data" jsonb NOT NULL,
	"transaction_id" varchar(255),
	"payment_provider" varchar(50) DEFAULT 'singpay',
	"transfert_vers_id" uuid,
	"transfert_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tickets_ticket_ref_unique" UNIQUE("ticket_ref")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"prenom" varchar(100),
	"nom" varchar(100),
	"telephone" varchar(20),
	"role" "user_role" DEFAULT 'passager',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "bus_positions" ADD CONSTRAINT "bus_positions_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buses" ADD CONSTRAINT "buses_chauffeur_id_users_id_fk" FOREIGN KEY ("chauffeur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_city_depart_id_cities_id_fk" FOREIGN KEY ("city_depart_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_city_arrivee_id_cities_id_fk" FOREIGN KEY ("city_arrivee_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_pass_type_id_pass_types_id_fk" FOREIGN KEY ("pass_type_id") REFERENCES "public"."pass_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_transfert_vers_id_users_id_fk" FOREIGN KEY ("transfert_vers_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bus_timestamp_idx" ON "bus_positions" USING btree ("bus_id","timestamp");--> statement-breakpoint
CREATE INDEX "chat_room_idx" ON "chat_messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bus_date_time_idx" ON "schedules" USING btree ("bus_id","date_voyage","heure_depart");
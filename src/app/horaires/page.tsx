// src/app/horaires/page.tsx
import { db } from "@/lib/db";
import { routes, schedules } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import DestinationsExplorer from "@/components/DestinationsExplorer";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function HorairesPage() {
  const allRoutes = await db.query.routes.findMany({
    where: eq(routes.actif, true),
    with: {
      cityDepart: true,
      cityArrivee: true,
      schedules: {
        where: eq(schedules.statut, "actif"),
        orderBy: [desc(schedules.heureDepart)],
      },
    },
  });

  // Regroupement par destination (ville autre que Libreville)
  const destinationMap = new Map<string, any[]>();
  allRoutes.forEach((r) => {
    const cityA = r.cityDepart.nom;
    const cityB = r.cityArrivee.nom;
    const dest =
      cityA === "Libreville" ? cityB : cityB === "Libreville" ? cityA : cityB;
    if (!destinationMap.has(dest)) destinationMap.set(dest, []);
    destinationMap.get(dest)!.push(r);
  });

  const destinations = Array.from(destinationMap.entries()).map(
    ([name, routesArray]) => ({
      name,
      routes: routesArray,
      image: routesArray.find((r) => r.image)?.image ?? null,
    }),
  );

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* HEADER */}
      <section className="relative pt-32 pb-14 bg-cnt-blue overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image 
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop" 
            alt="Bus sur la route" 
            fill 
            className="object-cover opacity-20" 
            priority 
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Où voulez-vous aller aujourd'hui ?
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-sm">
            Grand Libreville ou l'intérieur du pays choisissez votre trajet et
            réservez en quelques secondes.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <DestinationsExplorer destinations={destinations} />
        </div>
      </section>
    </main>
  );
}

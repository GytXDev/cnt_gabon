"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminRouteById, updateRouteBaseInfo, uploadRouteImage, createSchedule, toggleScheduleStatus } from "../../actions";
import { ArrowLeft, Save, Upload, Map, Clock, Plus, Trash2, Power } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function EditRoutePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const routeId = parseInt(params.id);
  const isNew = isNaN(routeId); // Basic handling if we want to expand for "new" later. Currently editing only.

  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [prix, setPrix] = useState(0);
  const [actif, setActif] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoute = async () => {
    try {
      if (!isNew) {
        const data = await getAdminRouteById(routeId);
        setRoute(data);
        setPrix(data?.prixStandard || 0);
        setActif(data?.actif ?? true);
        if (data?.image) setImagePreview(data.image);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de chargement du trajet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [routeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInfo = async () => {
    setIsSaving(true);
    try {
      await updateRouteBaseInfo(routeId, { prixStandard: prix, actif });
      
      // Si une nouvelle image base64 a été choisie (pas une URL existante cloudinary)
      if (imagePreview && imagePreview.startsWith("data:image")) {
        setIsUploading(true);
        await uploadRouteImage(routeId, imagePreview);
        setIsUploading(false);
      }
      
      toast.success("Modifications enregistrées !");
      fetchRoute();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde.");
      setIsUploading(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: number, currentStatus: string) => {
    try {
      await toggleScheduleStatus(scheduleId, currentStatus === "actif" ? "inactif" : "actif");
      toast.success("Statut de l'horaire modifié");
      fetchRoute();
    } catch (err) {
      toast.error("Erreur de modification");
    }
  };

  if (loading) return <div className="py-20 text-center font-medium text-gray-500">Chargement...</div>;
  if (!route) return <div className="py-20 text-center font-medium text-gray-500">Trajet introuvable.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            {route.cityDepart?.nom} <Map className="w-5 h-5 text-gray-400" /> {route.cityArrivee?.nom}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Édition du trajet #{route.id} et gestion des départs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE : INFOS & IMAGE */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Illustration du trajet</h2>
            
            <label className="block w-full h-48 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 relative cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden group">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              {imagePreview ? (
                <>
                  <Image src={imagePreview} alt="Aperçu" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium text-sm flex items-center gap-2"><Upload className="w-4 h-4"/> Changer l'image</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Parcourir une image</span>
                </div>
              )}
            </label>
            {isUploading && <p className="text-xs text-cnt-blue font-bold mt-3 text-center animate-pulse">Téléchargement Cloudinary en cours...</p>}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Informations Générales</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prix Standard (FCFA)</label>
                <input 
                  type="number" 
                  value={prix}
                  onChange={(e) => setPrix(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-gray-700">Statut du Trajet</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={actif} onChange={(e) => setActif(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            <button 
              onClick={handleSaveInfo}
              disabled={isSaving || isUploading}
              className="w-full mt-6 bg-cnt-blue hover:bg-blue-900 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {isSaving ? "Sauvegarde..." : (
                <><Save className="w-4 h-4" /> Enregistrer les infos</>
              )}
            </button>
          </div>
        </div>

        {/* COLONNE DROITE : SCHEDULES */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Créneaux Horaires (Schedules)</h2>
              <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Ajouter un horaire
              </button>
            </div>

            <div className="space-y-3">
              {route.schedules && route.schedules.length > 0 ? (
                route.schedules.map((sched: any) => (
                  <div key={sched.id} className={`flex items-center justify-between p-4 rounded-xl border ${sched.statut === 'actif' ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50 opacity-60'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${sched.statut === 'actif' ? 'bg-cnt-blue/10 text-cnt-blue' : 'bg-gray-200 text-gray-500'}`}>
                        <Clock className="w-5 h-5 mb-0.5" />
                        <span className="text-[10px] font-bold">{sched.heureDepart}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Départ à {sched.heureDepart}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Arrivée estimée : {sched.heureArriveeEstimee}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleSchedule(sched.id, sched.statut)}
                        className={`p-2 rounded-lg transition-colors ${sched.statut === 'actif' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        title={sched.statut === 'actif' ? "Désactiver ce créneau" : "Activer ce créneau"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm font-medium">Aucun créneau horaire configuré.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}

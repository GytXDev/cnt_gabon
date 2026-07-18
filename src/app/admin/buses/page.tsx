"use client";

import { useEffect, useState } from "react";
import { getBuses, createBus, updateBus, deleteBus, uploadBusImage } from "../actions";
import { Plus, MoreVertical, Edit, Trash2, Bus as BusIcon, Upload, Loader2, CalendarDays } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal de suppression
  const [busToDelete, setBusToDelete] = useState<string | null>(null);

  // Drawer (Sheet)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);

  const [actionPending, setActionPending] = useState<string | null>(null);
  
  // Form states
  const [matricule, setMatricule] = useState("");
  const [capacite, setCapacite] = useState<number>(50);
  const [type, setType] = useState("Standard");
  const [statut, setStatut] = useState<'actif'|'en_route'|'inactif'>("actif");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBuses = async (pageIndex: number) => {
    setLoading(true);
    try {
      const data = await getBuses(pageIndex, 10);
      setBuses(data.buses);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des bus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses(page);
  }, [page]);

  const openSheetForNew = () => {
    setEditingBus(null);
    setMatricule("");
    setCapacite(50);
    setType("Standard");
    setStatut("actif");
    setImagePreview(null);
    setIsSheetOpen(true);
  };

  const openSheetForEdit = (bus: any) => {
    setEditingBus(bus);
    setMatricule(bus.matricule);
    setCapacite(bus.capacite);
    setType(bus.type || "Standard");
    setStatut(bus.statut);
    setImagePreview(bus.image || null);
    setIsSheetOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule) return toast.error("Le matricule est requis.");
    setIsSaving(true);
    
    try {
      let finalImageUrl = imagePreview;
      if (imagePreview && imagePreview.startsWith("data:image")) {
        finalImageUrl = await uploadBusImage(imagePreview);
      }

      if (editingBus) {
        await updateBus(editingBus.id, { matricule, capacite, type, statut, image: finalImageUrl });
        toast.success("Bus mis à jour avec succès.");
      } else {
        await createBus({ matricule, capacite, type, statut, image: finalImageUrl });
        toast.success("Nouveau bus ajouté.");
      }
      setIsSheetOpen(false);
      fetchBuses(page);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!busToDelete) return;
    setActionPending(busToDelete);
    try {
      await deleteBus(busToDelete);
      toast.success("Bus supprimé.");
      fetchBuses(page);
    } catch (err: any) {
      toast.error(err.message || "Impossible de supprimer le bus.");
    } finally {
      setBusToDelete(null);
      setActionPending(null);
    }
  };

  const handleToggleStatus = async (bus: any, newStatut: string) => {
    setActionPending(bus.id);
    try {
      await updateBus(bus.id, { 
        matricule: bus.matricule, 
        capacite: bus.capacite, 
        type: bus.type, 
        statut: newStatut as 'actif' | 'en_route' | 'inactif',
        image: bus.image 
      });
      toast.success(`Statut modifié : ${newStatut}`);
      fetchBuses(page);
    } catch (err: any) {
      toast.error(err.message || "Impossible de changer le statut.");
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des Bus</h1>
          <p className="text-gray-500 text-sm">Gérez votre flotte de véhicules et leurs caractéristiques.</p>
        </div>
        <button 
          onClick={openSheetForNew}
          className="bg-cnt-blue hover:bg-blue-900 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau Bus
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase w-16 text-center">Image</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Matricule</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Capacité</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Statut</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2.5 px-4 text-center">
                      <Skeleton className="w-12 h-10 rounded-md mx-auto bg-gray-100" />
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="w-24 h-4 rounded bg-gray-100" />
                        <Skeleton className="w-16 h-3 rounded bg-gray-100" />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Skeleton className="w-16 h-4 rounded mx-auto bg-gray-100" />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Skeleton className="w-16 h-6 rounded-full mx-auto bg-gray-100" />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Skeleton className="w-6 h-6 rounded ml-auto bg-gray-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase w-16 text-center">Image</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Matricule</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Capacité</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">Statut</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => (
                  <tr key={bus.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-4 text-center">
                      {bus.image ? (
                        <div className="relative w-12 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200 mx-auto">
                          <Image src={bus.image} alt={bus.matricule} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-12 h-10 rounded-md bg-gray-50 border border-gray-200 border-dashed mx-auto flex items-center justify-center text-gray-400">
                          <BusIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{bus.matricule}</span>
                        <span className="text-[11px] text-gray-400 font-medium">Type: {bus.type || 'Non défini'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="font-bold text-gray-600 text-sm">{bus.capacite} places</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          bus.statut === 'actif' ? 'bg-emerald-50 text-emerald-700' :
                          bus.statut === 'en_route' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            bus.statut === 'actif' ? 'bg-emerald-500' :
                            bus.statut === 'en_route' ? 'bg-amber-500' :
                            'bg-gray-400'
                          }`}
                        />
                        {bus.statut === 'actif' ? 'Actif' :
                         bus.statut === 'en_route' ? 'En Route' :
                         'Hors Service'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {actionPending === bus.id ? (
                        <div className="flex justify-end pr-2">
                          <Loader2 className="w-5 h-5 text-cnt-blue animate-spin" />
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs text-gray-500">Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openSheetForEdit(bus)} className="cursor-pointer font-medium text-gray-700">
                                <Edit className="w-4 h-4 mr-2 text-cnt-blue" />
                                Éditer le bus
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-gray-500">Statut</DropdownMenuLabel>
                              {bus.statut !== 'actif' && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(bus, 'actif')} className="cursor-pointer font-medium text-emerald-600">
                                  <BusIcon className="w-4 h-4 mr-2" />
                                  Marquer Actif
                                </DropdownMenuItem>
                              )}
                              {bus.statut !== 'en_route' && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(bus, 'en_route')} className="cursor-pointer font-medium text-amber-600">
                                  <BusIcon className="w-4 h-4 mr-2" />
                                  Marquer En Route
                                </DropdownMenuItem>
                              )}
                              {bus.statut !== 'inactif' && (
                                <DropdownMenuItem onClick={() => handleToggleStatus(bus, 'inactif')} className="cursor-pointer font-medium text-gray-600">
                                  <BusIcon className="w-4 h-4 mr-2" />
                                  Marquer Hors Service
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setBusToDelete(bus.id)} className="cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
                {buses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500 text-sm font-medium">
                      Aucun bus enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500 font-medium">Page {page} sur {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={!!busToDelete} onOpenChange={(open) => !open && setBusToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce bus ? Cette action est irréversible. Si ce bus est assigné à un trajet, la suppression échouera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-[600px] w-full p-0">
          <div className="p-6 border-b border-gray-100">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">{editingBus ? "Éditer le bus" : "Nouveau bus"}</SheetTitle>
              <SheetDescription>Configurez les détails de votre véhicule ici.</SheetDescription>
            </SheetHeader>
          </div>
          
          <div className="p-6 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-medium uppercase text-gray-400">
                  Informations
                </h3>
                
                <label className="block w-full h-48 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 relative cursor-pointer hover:bg-gray-100 overflow-hidden group">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  {imagePreview ? (
                    <>
                      <Image src={imagePreview} alt="Aperçu" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm flex items-center gap-2"><Upload className="w-4 h-4"/> Changer</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-sm">Parcourir</span>
                    </div>
                  )}
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Matricule / Plaque</label>
                  <input 
                    type="text" 
                    value={matricule}
                    onChange={e => setMatricule(e.target.value)}
                    required
                    className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                    placeholder="Ex: AB-123-CD"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Capacité</label>
                    <input 
                      type="number" 
                      value={capacite}
                      onChange={e => setCapacite(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select 
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                    >
                      <option value="Standard">Standard</option>
                      <option value="VIP">VIP</option>
                      <option value="Mini-bus">Mini-bus</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                  <select 
                    value={statut}
                    onChange={e => setStatut(e.target.value as any)}
                    className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                  >
                    <option value="actif">Actif</option>
                    <option value="en_route">En Route</option>
                    <option value="inactif">Hors Service</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-cnt-blue hover:bg-blue-900 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer le bus"}
                </button>
              </div>
            </form>

          {editingBus && editingBus.statut !== 'inactif' && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-cnt-blue" />
                Trajets assignés
              </h3>
              {editingBus.schedules && editingBus.schedules.length > 0 ? (
                <div className="space-y-2">
                  {editingBus.schedules.map((schedule: any) => (
                    <div
                      key={schedule.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        schedule.statut === "actif"
                          ? "border-gray-200 bg-white"
                          : "border-dashed bg-gray-50 opacity-60"
                      }`}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded flex flex-col items-center justify-center ${
                            schedule.statut === "actif"
                              ? "bg-cnt-blue/10 text-cnt-blue"
                              : "bg-gray-200 text-gray-500"
                          }`}>
                          <Image src="/icons/clock.png" alt="clock" width={16} height={16} className="mb-0.5" />
                          <span className="text-[9px] font-medium">
                            {schedule.heureDepart}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-gray-900">
                              {schedule.dateVoyage ? new Date(schedule.dateVoyage).toLocaleDateString('fr-FR') : "Date inconnue"}
                            </p>
                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${schedule.statut === "actif" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                              {schedule.statut === "actif" ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            {schedule.route?.cityDepart?.nom} → {schedule.route?.cityArrivee?.nom}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">Aucun trajet prévu pour ce bus.</p>
                </div>
              )}
            </div>
          )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

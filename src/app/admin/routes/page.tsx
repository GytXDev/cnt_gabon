"use client";

import { useEffect, useState } from "react";
import {
  getAdminRoutes,
  toggleRouteStatus,
  deleteRoute,
  updateRouteBaseInfo,
  uploadRouteImage,
  createSchedule,
  toggleScheduleStatus,
  getAllBuses,
  createBus,
  deleteSchedule,
} from "../actions";
import {
  Map,
  Plus,
  MoreVertical,
  Edit,
  Power,
  Trash2,
  Clock,
  Upload,
  Save,
  Bus,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);

  const [prix, setPrix] = useState(0);
  const [actif, setActif] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [buses, setBuses] = useState<any[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<{depart: string; arrivee: string; busId: string; jours: Date[]}>({
    depart: "",
    arrivee: "",
    busId: "",
    jours: [],
  });

  const [showBusDialog, setShowBusDialog] = useState(false);
  const [newBus, setNewBus] = useState({ matricule: "", capacite: 50 });
  const [savingBus, setSavingBus] = useState(false);

  const [deleteScheduleId, setDeleteScheduleId] = useState<number | null>(null);

  const fetchRoutes = async (p: number) => {
    setLoading(true);
    try {
      const data = await getAdminRoutes(p, 7);
      setRoutes(data.routes);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes(page);
    getAllBuses().then(setBuses).catch(console.error);
  }, [page]);

  const [routeToToggle, setRouteToToggle] = useState<{id: number, status: boolean} | null>(null);

  const [actionPending, setActionPending] = useState(false);

  const confirmToggleRoute = async () => {
    if (!routeToToggle || actionPending) return;
    setActionPending(true);
    try {
      await toggleRouteStatus(routeToToggle.id, !routeToToggle.status);
      toast.success("Statut du trajet modifié");
      fetchRoutes(page);
    } catch {
      toast.error("Erreur");
    } finally {
      setRouteToToggle(null);
      setActionPending(false);
    }
  };

  const deleteRouteAction = async () => {
    if (!deleteId || actionPending) return;
    setActionPending(true);
    try {
      await deleteRoute(deleteId);
      toast.success("Trajet supprimé");
      setDeleteId(null);
      fetchRoutes(page);
    } catch (err: any) {
      toast.error(err.message || "Erreur");
      setDeleteId(null);
    } finally {
      setActionPending(false);
    }
  };

  const openSheet = (route: any) => {
    setEditingRoute(route);
    setPrix(route.prixStandard || 0);
    setActif(route.actif ?? true);
    setImage(route.image || null);
    setShowSchedule(false);
    setSchedule({ depart: "", arrivee: "", busId: "", jours: [] });
    setIsSheetOpen(true);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveRoute = async () => {
    if (!editingRoute) return;
    setSaving(true);
    try {
      await updateRouteBaseInfo(editingRoute.id, { prixStandard: prix, actif });
      if (image?.startsWith("data:image")) {
        await uploadRouteImage(editingRoute.id, image);
      }
      toast.success("Trajet mis à jour");
      setIsSheetOpen(false);
      fetchRoutes(page);
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  };

  const [scheduleToToggle, setScheduleToToggle] = useState<{id: number, statut: string} | null>(null);

  const confirmToggleSchedule = async () => {
    if (!scheduleToToggle || actionPending) return;
    setActionPending(true);
    try {
      const newStatus = scheduleToToggle.statut === "actif" ? "inactif" : "actif";
      await toggleScheduleStatus(scheduleToToggle.id, newStatus);
      toast.success("Statut de l'horaire modifié");
      setEditingRoute((prev: any) => ({
        ...prev,
        schedules: prev.schedules.map((s: any) =>
          s.id === scheduleToToggle.id ? { ...s, statut: newStatus } : s,
        ),
      }));
      fetchRoutes(page);
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setScheduleToToggle(null);
      setActionPending(false);
    }
  };

  const confirmDeleteSchedule = async () => {
    if (!deleteScheduleId || actionPending) return;
    setActionPending(true);
    try {
      await deleteSchedule(deleteScheduleId);
      fetchRoutes(page);
      if (editingRoute) {
        setEditingRoute((prev: any) => ({
          ...prev,
          schedules: prev.schedules.filter((s: any) => s.id !== deleteScheduleId)
        }));
      }
      toast.success("Créneau supprimé");
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteScheduleId(null);
      setActionPending(false);
    }
  };

  const addSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute || !schedule.busId || actionPending) {
      if (!schedule.busId) toast.error("Veuillez assigner un bus");
      return;
    }
    setActionPending(true);
    try {
      const created = await createSchedule({
        routeId: editingRoute.id,
        busId: schedule.busId,
        heureDepart: schedule.depart,
        heureArriveeEstimee: schedule.arrivee,
        dates: schedule.jours.map(d => {
          const dateStr = d.toLocaleDateString('fr-CA'); // format YYYY-MM-DD local
          return dateStr;
        }),
        statut: "actif",
      });
      if (!created || (created as any).success === false) {
        toast.error((created as any)?.error || "Erreur lors de l'enregistrement");
        return;
      }
      toast.success("Horaire(s) ajouté(s)");
      setShowSchedule(false);
      setSchedule({ depart: "", arrivee: "", busId: "", jours: [] });
      
      const newSchedules = (created as any).data.map((c: any) => ({
        ...c,
        bus: buses.find((b) => b.id === schedule.busId)
      }));

      setEditingRoute((prev: any) => ({
        ...prev,
        schedules: [
          ...(prev.schedules || []),
          ...newSchedules,
        ],
      }));
      fetchRoutes(page);
    } catch {
      toast.error("Erreur inattendue");
    } finally {
      setActionPending(false);
    }
  };

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBus(true);
    try {
      const createdBus = await createBus({
        matricule: newBus.matricule,
        capacite: newBus.capacite,
        type: "Standard",
        statut: "actif",
      });
      toast.success("Bus créé et sélectionné !");
      const busesList = await getAllBuses();
      setBuses(busesList);
      if (createdBus && createdBus.id) {
        setSchedule({ ...schedule, busId: createdBus.id });
      }
      setShowBusDialog(false);
      setNewBus({ matricule: "", capacite: 50 });
    } catch {
      toast.error("Erreur de création du bus");
    } finally {
      setSavingBus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trajets</h1>
          <p className="text-gray-500 text-sm">
            Gérez les lignes uniques, leurs horaires et images associées.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/routes/new")}
          className="bg-cnt-blue hover:bg-blue-900 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" />
          Nouveau trajet
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase w-16 text-center">
                    Image
                  </th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Itinéraire (A → B)
                  </th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-right">
                    Prix
                  </th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-center">
                    Statut
                  </th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase text-right w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-center">
                      {r.image ? (
                        <div className="relative w-12 h-10 rounded bg-gray-100 mx-auto overflow-hidden">
                          <Image
                            src={r.image}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-10 rounded bg-gray-50 border border-dashed mx-auto flex items-center justify-center text-gray-400">
                          <Map className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900">
                        {r.cityDepart?.nom} → {r.cityArrivee?.nom}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-cnt-green font-medium">
                        {r.prixStandard.toLocaleString()} FCFA
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          r.actif
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${r.actif ? "bg-emerald-500" : "bg-gray-400"}`}
                        />
                        {r.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs text-gray-500">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openSheet(r)}>
                              <Edit className="w-4 h-4 mr-2 text-cnt-blue" />
                              Configurer & Éditer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setRouteToToggle({id: r.id, status: r.actif})}>
                              <Power
                                className={`w-4 h-4 mr-2 ${r.actif ? "text-amber-500" : "text-emerald-500"}`}
                              />
                              {r.actif
                                ? "Désactiver la ligne"
                                : "Activer la ligne"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(r.id)}
                              className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-gray-500 text-sm">
                      Aucun trajet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">
              Précédent
            </button>
            <span className="text-sm text-gray-500">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* Dialog suppression */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le trajet</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Si des billets ont été vendus, la
              suppression sera refusée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteRouteAction}
              disabled={actionPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50">
              {actionPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet édition */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[600px] w-full p-0 overflow-y-auto">
          <div className="p-6 border-b">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">
                {editingRoute
                  ? `${editingRoute.cityDepart?.nom} → ${editingRoute.cityArrivee?.nom}`
                  : "Édition"}
              </SheetTitle>
              <SheetDescription>
                Configurer le trajet et ses horaires
              </SheetDescription>
            </SheetHeader>
          </div>

          {editingRoute && (
            <div className="p-6 space-y-6">
              {/* Infos générales */}
              <div className="space-y-4">
                <h3 className="text-xs font-medium uppercase text-gray-400">
                  Informations
                </h3>
                <label className="block w-full h-48 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 relative cursor-pointer hover:bg-gray-100 overflow-hidden group">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImage}
                  />
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Changer
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-sm">Ajouter une image</span>
                    </div>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prix (FCFA)
                    </label>
                    <input
                      type="number"
                      value={prix}
                      onChange={(e) => setPrix(Number(e.target.value))}
                      className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={actif ? "oui" : "non"}
                      onChange={(e) => setActif(e.target.value === "oui")}
                      className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20">
                      <option value="oui">Actif</option>
                      <option value="non">Inactif</option>
                    </select>
                  </div>
                </div>


              </div>

              {/* Horaires */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase text-gray-400">
                    Horaires
                  </h3>
                  <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>

                {showSchedule && (
                  <form
                    onSubmit={addSchedule}
                    className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Départ
                        </label>
                        <input
                          required
                          type="time"
                          value={schedule.depart}
                          onChange={(e) =>
                            setSchedule({ ...schedule, depart: e.target.value })
                          }
                          className="w-full mt-1 bg-white border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Arrivée
                        </label>
                        <input
                          required
                          type="time"
                          value={schedule.arrivee}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              arrivee: e.target.value,
                            })
                          }
                          className="w-full mt-1 bg-white border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Bus
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowBusDialog(true)}
                            className="text-xs text-cnt-blue hover:text-blue-800 font-medium flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Nouveau bus
                          </button>
                        </div>
                        <select
                          required
                          value={schedule.busId}
                          onChange={(e) =>
                            setSchedule({ ...schedule, busId: e.target.value })
                          }
                          className="w-full bg-white border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20">
                          <option value="">Sélectionner un bus existant</option>
                          {buses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.matricule} - {b.capacite} places
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Dates Programmées
                        </label>
                        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden max-w-min">
                          <Calendar
                            mode="multiple"
                            selected={schedule.jours}
                            onSelect={(dates: any) => setSchedule({ ...schedule, jours: dates || [] })}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            className="p-3"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setShowSchedule(false)}
                        className="flex-1 py-1.5 text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md font-medium">
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={actionPending}
                        className="flex-1 py-1.5 text-sm text-white bg-cnt-green hover:bg-green-700 disabled:opacity-50 rounded-md font-medium">
                        {actionPending ? "En cours..." : "Ajouter"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {editingRoute.schedules?.length > 0 ? (
                    editingRoute.schedules.map((s: any) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          s.statut === "actif"
                            ? "border-gray-200"
                            : "border-dashed bg-gray-50 opacity-60"
                        }`}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded flex flex-col items-center justify-center ${
                              s.statut === "actif"
                                ? "bg-cnt-blue/10 text-cnt-blue"
                                : "bg-gray-200 text-gray-500"
                            }`}>
                            <Clock className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px] font-medium">
                              {s.heureDepart}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {s.dateVoyage ? new Date(s.dateVoyage).toLocaleDateString('fr-FR') : "Date inconnue"} : {s.heureDepart} → {s.heureArriveeEstimee}
                              </p>
                              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${s.statut === "actif" ? "bg-cnt-green/10 text-cnt-green" : "bg-gray-200 text-gray-500"}`}>
                                {s.statut === "actif" ? "Actif" : "Inactif"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Bus: {s.bus?.matricule || "Non assigné"}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors outline-none cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => setScheduleToToggle({id: s.id, statut: s.statut})}
                              className="text-sm cursor-pointer flex items-center gap-2">
                              <Power className="w-3.5 h-3.5" />
                              {s.statut === "actif" ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteScheduleId(s.id)}
                              className="text-sm text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">
                      Aucun horaire
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-2 border-t">
                <button
                  onClick={saveRoute}
                  disabled={saving}
                  className="w-full bg-cnt-blue hover:bg-blue-900 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  {saving ? (
                    "Sauvegarde..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteScheduleId} onOpenChange={() => setDeleteScheduleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce créneau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le créneau sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSchedule}
              disabled={actionPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50">
              {actionPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!scheduleToToggle} onOpenChange={() => setScheduleToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifier l'état de ce créneau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment {scheduleToToggle?.statut === "actif" ? "désactiver" : "activer"} ce créneau ? 
              {scheduleToToggle?.statut === "actif" ? " Il ne sera plus disponible à la réservation." : " Il sera de nouveau disponible à la réservation."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleSchedule}
              disabled={actionPending}
              className="bg-cnt-blue hover:bg-blue-900 disabled:opacity-50">
              {actionPending ? "En cours..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!routeToToggle} onOpenChange={() => setRouteToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifier l'état de ce trajet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment {routeToToggle?.status ? "désactiver" : "activer"} ce trajet ? 
              {routeToToggle?.status ? " Il ne sera plus visible par les clients." : " Il sera de nouveau visible par les clients."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleRoute}
              disabled={actionPending}
              className="bg-cnt-blue hover:bg-blue-900 disabled:opacity-50">
              {actionPending ? "En cours..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog création de bus inline */}
      <Dialog open={showBusDialog} onOpenChange={setShowBusDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau bus</DialogTitle>
            <DialogDescription>
              Ajout rapide d'un bus pour pouvoir l'assigner à cet horaire.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBus} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Matricule
              </label>
              <input
                required
                type="text"
                placeholder="Ex: AB-123-CD"
                value={newBus.matricule}
                onChange={(e) => setNewBus({ ...newBus, matricule: e.target.value })}
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Capacité (places)
              </label>
              <input
                required
                type="number"
                min={1}
                value={newBus.capacite}
                onChange={(e) => setNewBus({ ...newBus, capacite: Number(e.target.value) })}
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnt-blue/20"
              />
            </div>
            <button
              type="submit"
              disabled={savingBus}
              className="w-full bg-cnt-blue hover:bg-blue-900 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center transition-colors">
              {savingBus ? "Création..." : "Créer le bus"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

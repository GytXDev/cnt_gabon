"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AdminLogoutButton() {
  const [showModal, setShowModal] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full mt-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-sm">
        <span className="font-medium">Déconnexion</span>
        <LogOut className="w-4 h-4" />
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Déconnexion
              </h3>
              <p className="text-gray-500 text-sm">
                Êtes-vous sûr de vouloir vous déconnecter de votre session
                Administrateur ?
              </p>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

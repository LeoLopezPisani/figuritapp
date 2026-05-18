// src/hooks/useAlbumSync.ts
import { useCallback, useEffect, useState } from "react";
import { Country, getAlbumData, pullCloudData } from "../services/db";
import { supabase } from "../services/supabase";

// Interfaz para la SectionList
export interface AlbumSection {
  title: string;
  data: { key: string; country: Country }[];
}

export const useAlbumSync = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<AlbumSection[]>([]);
  const [stats, setStats] = useState({ total: 0, owned: 0 });

  // Función interna para procesar SQLite
  const loadAndProcessAlbum = useCallback(async (uid: string) => {
    try {
      const dbData = await getAlbumData(uid);

      let total = 0;
      let owned = 0;
      const groups: Record<string, { key: string; country: Country }[]> = {};

      Object.entries(dbData).forEach(([key, country]) => {
        total += country.stickers.length;
        owned += country.stickers.filter((s) => s.count > 0).length;

        if (!groups[country.group]) {
          groups[country.group] = [];
        }
        groups[country.group].push({ key, country });
      });

      const formattedSections = Object.keys(groups).map((groupName) => ({
        title: groupName,
        data: groups[groupName].sort(
          (a, b) => a.country.orderIndex - b.country.orderIndex,
        ),
      }));

      setStats({ total, owned });
      setSections(formattedSections);
    } catch (error) {
      console.error("[useAlbumSync] Error cargando el álbum:", error);
    }
  }, []);

  // Lógica de Sincronización Inicial
  const initSync = useCallback(async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const uid = session.user.id;
      setUserId(uid);

      // 1. Carga local instantánea
      await loadAndProcessAlbum(uid);

      // 2. Sincronización en la nube (silenciosa)
      try {
        await pullCloudData(uid);
        await loadAndProcessAlbum(uid); // Refresca por si bajó data nueva
      } catch (e) {
        console.log("Modo offline, operando con caché local.");
      }
    }
    setIsLoading(false);
  }, [loadAndProcessAlbum]);

  // Ejecutar al montar el Hook
  useEffect(() => {
    initSync();
  }, [initSync]);

  // Devolvemos las variables y una función para refrescar manualmente si se necesita
  return {
    userId,
    isLoading,
    sections,
    stats,
    refreshData: () => {
      if (userId) loadAndProcessAlbum(userId);
    },
  };
};

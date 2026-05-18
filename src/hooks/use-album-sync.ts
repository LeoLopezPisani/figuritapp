// src/hooks/useAlbumSync.ts
import { useCallback, useEffect, useState } from "react";
import {
  Country,
  getAlbumData,
  pullCloudData,
  seedUserAlbum,
} from "../services/db";
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

  const loadAndProcessAlbum = useCallback(async (uid: string) => {
    try {
      let dbData = await getAlbumData(uid);

      // EL FIX CRÍTICO: Reincorporamos la hidratación de la base de datos
      const hasStickersLoaded = Object.values(dbData).some(
        (c) => c.stickers.length > 0,
      );

      if (!hasStickersLoaded) {
        console.log(
          `[useAlbumSync] Base de datos vacía. Generando matriz para: ${uid}`,
        );
        await seedUserAlbum(uid);
        dbData = await getAlbumData(uid); // Volvemos a leer la base ya hidratada
      }

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

      // Mantenemos el orden original (Intro primero)
      formattedSections.sort((a, b) => {
        if (a.title === "Intro") return -1;
        if (b.title === "Intro") return 1;
        return a.title.localeCompare(b.title);
      });

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

      await loadAndProcessAlbum(uid);

      try {
        await pullCloudData(uid);
        await loadAndProcessAlbum(uid);
      } catch (e) {
        console.log("Modo offline, operando con caché local.");
      }
    }
    setIsLoading(false);
  }, [loadAndProcessAlbum]);

  useEffect(() => {
    initSync();
  }, [initSync]);

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

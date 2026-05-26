/**
 * =========================================================
 *                     FIGURITAPP v2.0.0
 * =========================================================
 *  Created by  : [Leo López Pisani]
 *  Year        : 2026
 *  Tech Stack  : React Native, Expo Router, SQLite, Supabase
 *  Description : Álbum Tracker para el Mundial FIFA 2026.
 * =========================================================
 */

import { CountryFlag } from "@/components/country-flag";
import { COUNTRY_METADATA } from "@/constants/countries";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SectionList,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CountryCard } from "../components/country-card";
import { SHARING_FLAGS, ShareType } from "../constants/sharing";
import { useAlbumSync } from "../hooks/use-album-sync";
import { Country, getAlbumData } from "../services/db";
import { supabase } from "../services/supabase";
import { homeStyles as styles } from "../styles/home.styles";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userId, isLoading, sections, stats, refreshData } = useAlbumSync();
  const [activeTab, setActiveTab] = useState("Intro");

  const [headerKey, setHeaderKey] = useState(0); // Forzar re-render del header al volver del escáner
  const params = useLocalSearchParams<{ scannedIds?: string }>();

  const sectionListRef = useRef<SectionList>(null);
  const tabsListRef = useRef<FlatList>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const tabTitles = sections.map((s) => s.title);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstVisible = viewableItems[0];
      if (firstVisible.section && firstVisible.section.title) {
        const visibleSection = firstVisible.section.title;

        // Usamos la función interna de set para evitar dependencias obsoletas
        setActiveTab((prevTab) => {
          if (prevTab !== visibleSection) return visibleSection;
          return prevTab;
        });
      }
    }
  });

  const { profileId, lastViewedCountry } = useLocalSearchParams<{
    profileId: string;
    lastViewedCountry?: string;
  }>();

  useEffect(() => {
    if (!isLoading && tabTitles.length > 0) {
      const index = tabTitles.indexOf(activeTab);
      if (index !== -1 && tabsListRef.current) {
        tabsListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5, // Lo centra en la pantalla
        });
      }
    }
  }, [activeTab, tabTitles, isLoading]);

  const countriesByGroup = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(COUNTRY_METADATA).forEach(([code, meta]) => {
      if (!map[meta.group]) map[meta.group] = [];
      map[meta.group].push(code);
    });

    Object.keys(map).forEach((group) => {
      map[group].sort(
        (a, b) =>
          COUNTRY_METADATA[a].orderIndex - COUNTRY_METADATA[b].orderIndex,
      );
    });
    return map;
  }, []);

  useFocusEffect(
    useCallback(() => {
      setHeaderKey((prev) => prev + 1);
    }, []),
  );

  useEffect(() => {
    if (
      !isLoading &&
      sections.length > 0 &&
      lastViewedCountry &&
      COUNTRY_METADATA[lastViewedCountry]
    ) {
      const targetGroup = COUNTRY_METADATA[lastViewedCountry].group;

      setActiveTab(targetGroup);

      const sectionIndex = sections.findIndex((s) => s.title === targetGroup);

      if (sectionIndex !== -1) {
        setTimeout(() => {
          tabsListRef.current?.scrollToIndex({
            index: sectionIndex,
            animated: true,
            viewPosition: 0.5,
          });

          sectionListRef.current?.scrollToLocation({
            sectionIndex: sectionIndex,
            itemIndex: 0,
            animated: false, // En false para que el salto sea instantáneo al volver
            viewPosition: 0,
          });
        }, 100);
      }
    }
  }, [lastViewedCountry, isLoading, sections]);

  const handleTabPress = (title: string, index: number) => {
    setActiveTab(title);
    // tabsListRef.current?.scrollToIndex({
    //   index,
    //   animated: true,
    //   viewPosition: 0.5,
    // });
    sectionListRef.current?.scrollToLocation({
      sectionIndex: index,
      itemIndex: 0,
      animated: true,
      viewPosition: 0,
    });
  };

  const handleSharePress = () => {
    Alert.alert(
      "Compartir figuritas 🏆",
      "¿Qué listado deseas enviar por WhatsApp?",
      [
        {
          text: "Resumen (Solo %)",
          onPress: () => generateShareText("RESUMEN"),
        },
        {
          text: "Solo Faltantes 🔴",
          onPress: () => generateShareText("FALTANTES"),
        },
        {
          text: "Solo Repetidas 🟢",
          onPress: () => generateShareText("REPETIDAS"),
        },
        { text: "Cancelar", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const generateShareText = async (type: ShareType) => {
    try {
      const dbData = await getAlbumData(userId!);
      let missingList: string[] = [];
      let duplicatesList: string[] = [];

      Object.entries(dbData).forEach(([code, country]) => {
        const flagLabel = SHARING_FLAGS[code] || `🏳️ ${code}`;

        const missing = country.stickers
          .filter((s) => s.count === 0)
          .sort((a, b) => parseInt(a.number) - parseInt(b.number))
          .map((s) => s.number);

        const duplicates = country.stickers
          .filter((s) => s.count > 1)
          .sort((a, b) => parseInt(a.number) - parseInt(b.number))
          .map((s) => `${s.number}(x${s.count - 1})`);

        if (missing.length > 0) {
          missingList.push(`*${flagLabel}*: ${missing.join(", ")}`);
        }
        if (duplicates.length > 0) {
          duplicatesList.push(`*${flagLabel}*: ${duplicates.join(", ")}`);
        }
      });

      // Encabezado global del mensaje (sale siempre sin importar el tipo)
      let shareText = `🏆 *FIGURITAPP 2026* 🏆\n`;
      shareText += `📊 *Progreso:* ${stats.owned}/${stats.total} (${Math.round((stats.owned / stats.total) * 100)}%)\n\n`;

      // Evaluación de la estructura según lo que se seleccionó en el Alert.alert
      if (type === "RESUMEN") {
        shareText += `¡Seguimos completando el álbum! 🚀`;
      }

      if (type === "FALTANTES") {
        shareText += `🔴 *ME FALTAN:*\n`;
        shareText +=
          missingList.length > 0
            ? missingList.join("\n")
            : "¡Ninguna! Álbum completo 🎉";
      }

      if (type === "REPETIDAS") {
        shareText += `🟢 *MIS REPETIDAS:*\n`;
        shareText +=
          duplicatesList.length > 0
            ? duplicatesList.join("\n")
            : "Ninguna por ahora 😢";
      }

      // Desplegamos la sábana nativa del sistema para enviar a WhatsApp
      await Share.share({
        message: shareText,
        title: "Mis Figuritas 2026",
      });
    } catch (error) {
      console.error("[HomeScreen] Error generating share text:", error);
      Alert.alert("Error", "No se pudo generar el listado para compartir.");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Querés salir de tu cuenta?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  const renderCountryItem = ({
    item,
  }: {
    item: { key: string; country: Country };
  }) => {
    return (
      <CountryCard
        countryKey={item.key}
        country={item.country}
        onPress={(key) =>
          router.push({
            pathname: "/country/[id]",
            params: { id: key, profileId: userId },
          })
        }
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => {
    if (section.title === "Intro") return null;

    return (
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
      </View>
    );
  };

  const renderTabItem = ({ item, index }: { item: string; index: number }) => {
    const isActive = activeTab === item;
    const cleanLabel =
      item === "Intro" ? "FWC" : item.replace("Group ", "Grupo ");
    const groupCountries = countriesByGroup[item];

    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => handleTabPress(item, index)}
      >
        <Text
          style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}
        >
          {cleanLabel}
        </Text>
        {groupCountries && groupCountries.length > 0 && (
          <View style={styles.tinyFlagsContainer}>
            {groupCountries.map((code) => (
              <CountryFlag key={code} code={code} variant="tiny" />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading || !userId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderRow} key={`top-${headerKey}`}>
        <View style={styles.brandGroup}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.brandLogo}
          />
          <View>
            <Text style={styles.mainTitle}>FIGURITAPP</Text>
            <Text style={styles.brandSubtitle}>MUNDIAL FIFA 2026</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleSignOut}>
          <Text style={styles.logoutIconText}>🚪Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.globalHeader} key={`global-${headerKey}`}>
        <View style={styles.compactStatsContainer}>
          <View style={styles.statsTextRow}>
            <Text style={styles.statsMainText}>
              <Text style={styles.statsHighlight}>{stats.owned}</Text> /{" "}
              {stats.total} figuritas
            </Text>
            <Text style={styles.statsPercentage}>
              {stats.total > 0
                ? Math.round((stats.owned / stats.total) * 100)
                : 0}
              %
            </Text>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${stats.total > 0 ? (stats.owned / stats.total) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.dashboardActions}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() =>
              router.push({ pathname: "/trade", params: { profileId: userId } })
            }
          >
            <Text style={styles.actionPillEmoji}>🤝</Text>
            <Text style={styles.actionPillTitle}>CAMBIAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={handleSharePress}
          >
            <Text style={styles.actionPillEmoji}>📤</Text>
            <Text style={styles.actionPillTitle}>COMPARTIR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ANCHOR SLIDER */}
      <View style={styles.sliderWrapper}>
        <FlatList
          ref={tabsListRef}
          horizontal
          data={tabTitles}
          renderItem={renderTabItem}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sliderContentContainer}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              tabsListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            });
          }}
        />
      </View>

      {/* CORE SECTIONS */}
      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderCountryItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
        initialNumToRender={80}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
      />

      {/* SCAN FLOAT ACCENT */}
      <TouchableOpacity
        style={[styles.scanButton, { bottom: insets.bottom + 30 }]}
        onPress={() =>
          router.push({ pathname: "/scanner", params: { profileId: userId } })
        }
      >
        <Text style={styles.scanButtonText}>📷 ESCANEAR</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

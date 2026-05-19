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

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
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

  useFocusEffect(
    useCallback(() => {
      setHeaderKey((prev) => prev + 1);
    }, []),
  );

  const handleTabPress = (title: string, index: number) => {
    setActiveTab(title);
    tabsListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
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

  // 2. Esta función procesa la base de datos de SQLite y arma el string final
  const generateShareText = async (type: ShareType) => {
    try {
      const dbData = await getAlbumData(userId!);
      let missingList: string[] = [];
      let duplicatesList: string[] = [];

      // Recorremos todos los países que devolvió SQLite
      Object.entries(dbData).forEach(([code, country]) => {
        // Obtenemos la bandera corta de nuestro diccionario. Si no existe, usa la genérica
        const flagLabel = SHARING_FLAGS[code] || `🏳️ ${code}`;

        // Filtramos números faltantes (count === 0)
        const missing = country.stickers
          .filter((s) => s.count === 0)
          .map((s) => s.number);

        // Filtramos repetidas (count > 1) y formateamos como "3(x1)"
        const duplicates = country.stickers
          .filter((s) => s.count > 1)
          .map((s) => `${s.number}(x${s.count - 1})`);

        // Si el país tiene faltantes, armamos su línea corta de texto
        if (missing.length > 0) {
          missingList.push(`*${flagLabel}*: ${missing.join(", ")}`);
        }
        // Si el país tiene repetidas, armamos su línea corta de texto
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
        shareText += `🟢 *MIS REPETIDAS (Para cambiar):*\n`;
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

  // Security: Logout implementation to test routing bounds cleanly
  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out securely?", [
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
      item === "Intro" ? "FWC" : item.replace("Group ", "GRP ");
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
      </TouchableOpacity>
    );
  };

  const tabTitles = sections.map((s) => s.title);

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
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.brandLogo}
        />
        <Text style={styles.mainTitle}>FIGURITAPP</Text>
      </View>
      <View style={styles.globalHeader} key={`global-${headerKey}`}>
        <View style={styles.headerRow}>
          <Text style={styles.secondaryTitle}>MUNDIAL FIFA 2026</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleSharePress}
            >
              <Text style={styles.shareButtonText}>📤 SHARE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.logoutButtonText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {stats.owned}/{stats.total}
            </Text>
            <Text style={styles.statLabel}>FIGURITAS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#0ea5e9" }]}>
              {stats.total > 0
                ? Math.round((stats.owned / stats.total) * 100)
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>PROGRESO</Text>
          </View>
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
        initialNumToRender={50}
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

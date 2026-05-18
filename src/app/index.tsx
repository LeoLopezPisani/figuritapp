import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { CountryCard } from "../components/country-card";
import { useAlbumSync } from "../hooks/use-album-sync";
import {
  Country,
  getAlbumData,
  incrementMultipleStickers,
} from "../services/db";
import { supabase } from "../services/supabase";
import { homeStyles as styles } from "../styles/home.styles";

export default function HomeScreen() {
  // 1. Usamos el Hook para traer toda la info pesada
  const { userId, isLoading, sections, stats, refreshData } = useAlbumSync();

  const [activeTab, setActiveTab] = useState("Intro");
  const params = useLocalSearchParams<{ scannedIds?: string }>();

  const sectionListRef = useRef<SectionList>(null);
  const tabsListRef = useRef<FlatList>(null);

  // 2. Scanner Hook tied to dynamic secure userId state
  useEffect(() => {
    if (params.scannedIds && userId) {
      const processScannedStickers = async () => {
        const newIds = params.scannedIds!.split(",");
        try {
          await incrementMultipleStickers(userId, newIds);
          refreshData(); // Actualizamos vía el Hook en lugar de la vieja función local
        } catch (error) {
          console.error("[HomeScreen] Error executing batch append:", error);
        }
      };
      processScannedStickers();
      router.setParams({ scannedIds: undefined });
    }
  }, [params.scannedIds, userId, refreshData]);

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

  // Generator: Compiles the entire album state into a clean WhatsApp-ready text
  const handleShareTradingList = async () => {
    try {
      const dbData = await getAlbumData(userId!);
      let missingList: string[] = [];
      let duplicatesList: string[] = [];

      // Iterate through all countries to classify stickers
      Object.entries(dbData).forEach(([code, country]) => {
        const missing = country.stickers
          .filter((s) => s.count === 0)
          .map((s) => s.number);
        const duplicates = country.stickers
          .filter((s) => s.count > 1)
          .map((s) => `${s.number}(x${s.count - 1})`);

        if (missing.length > 0)
          missingList.push(`*${country.name}*: ${missing.join(", ")}`);
        if (duplicates.length > 0)
          duplicatesList.push(`*${country.name}*: ${duplicates.join(", ")}`);
      });

      let shareText = `🏆 *MI ÁLBUM MUNDIAL 2026* 🏆\n\n`;

      if (duplicatesList.length > 0) {
        shareText += `🟢 *TENGO REPETIDAS:*\n${duplicatesList.join("\n")}\n\n`;
      } else {
        shareText += `🟢 *TENGO REPETIDAS:* Ninguna por ahora.\n\n`;
      }

      if (missingList.length > 0) {
        shareText += `🔴 *ME FALTAN:*\n${missingList.join("\n")}`;
      } else {
        shareText += `🔴 *ME FALTAN:* ¡Álbum Completo! 🎉`;
      }

      // Open native share sheet (WhatsApp, Telegram, etc.)
      await Share.share({
        message: shareText,
        title: "Mis Figuritas 2026",
      });
    } catch (error) {
      console.error("[HomeScreen] Error generating share text:", error);
      Alert.alert("Error", "No se pudo generar el listado.");
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
      <View style={styles.topHeaderRow}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.brandLogo}
        />
        <Text style={styles.mainTitle}>FIGURITAPP</Text>
      </View>
      <View style={styles.globalHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.secondaryTitle}>PANINI - MUNDIAL 2026</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareTradingList}
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
            <Text style={styles.statLabel}>STICKERS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#0ea5e9" }]}>
              {stats.total > 0
                ? Math.round((stats.owned / stats.total) * 100)
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>PROGRESS</Text>
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
        style={styles.scanButton}
        onPress={() =>
          router.push({ pathname: "/scanner", params: { profileId: userId } })
        }
      >
        <Text style={styles.scanButtonText}>📷 SCAN STICKER</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

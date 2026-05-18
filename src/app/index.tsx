import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SectionList,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountryFlag } from "../components/country-flag";
import {
  Country,
  getAlbumData,
  incrementMultipleStickers,
  pullCloudData,
  seedUserAlbum,
} from "../services/db";
import { supabase } from "../services/supabase";
import { homeStyles as styles } from "../styles/home.styles";

interface SectionData {
  title: string;
  data: Array<{ key: string; country: Country }>;
}

export default function HomeScreen() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [activeTab, setActiveTab] = useState("Intro");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOwned: 0,
    totalStickers: 0,
    percentage: 0,
  });

  // NEW: Dynamic Authenticated User State from Supabase Secure Token
  const [userId, setUserId] = useState<string | null>(null);

  const params = useLocalSearchParams<{ scannedIds?: string }>();
  const sectionListRef = useRef<SectionList>(null);
  const tabsListRef = useRef<FlatList>(null);

  const loadAndProcessAlbum = async (authenticatedUid: string) => {
    try {
      let dbData = await getAlbumData(authenticatedUid);

      // Edge Case: If the user is authenticated but has no SQLite slots yet (new device/fresh signup)
      const hasStickersLoaded = Object.values(dbData).some(
        (c) => c.stickers.length > 0,
      );
      if (!hasStickersLoaded) {
        console.log(
          `[HomeScreen] Hydrating clean SQLite structural matrix for user: ${authenticatedUid}`,
        );
        await seedUserAlbum(authenticatedUid);
        dbData = await getAlbumData(authenticatedUid); // Re-fetch hydrated rows
      }

      let computedTotal = 0;
      let computedOwned = 0;
      const groupsMap: Record<string, any[]> = {};

      Object.entries(dbData).forEach(([key, country]) => {
        computedTotal += country.stickers.length;
        computedOwned += country.stickers.filter((s) => s.count > 0).length;

        if (!groupsMap[country.group]) groupsMap[country.group] = [];
        groupsMap[country.group].push({ key, country });
      });

      const formattedSections: SectionData[] = Object.entries(groupsMap).map(
        ([groupName, items]) => ({
          title: groupName,
          data: items.sort(
            (a, b) => a.country.orderIndex - b.country.orderIndex,
          ),
        }),
      );

      formattedSections.sort((a, b) => {
        if (a.title === "Intro") return -1;
        if (b.title === "Intro") return 1;
        return a.title.localeCompare(b.title);
      });

      setSections(formattedSections);
      setStats({
        totalOwned: computedOwned,
        totalStickers: computedTotal,
        percentage:
          computedTotal > 0
            ? Math.round((computedOwned / computedTotal) * 100)
            : 0,
      });
    } catch (error) {
      console.error("[HomeScreen] Error loading context metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Mount Hook: Resolve secure authenticated user context
  useEffect(() => {
    const resolveUserSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const uid = session.user.id;
        setUserId(uid);

        // 1. Primero cargamos lo que haya en local
        await loadAndProcessAlbum(uid);

        // 2. Intentamos traer datos frescos de la nube (Pull Sync)
        try {
          await pullCloudData(uid);
          await loadAndProcessAlbum(uid);
        } catch (e) {
          console.log("Modo offline activo, trabajando con datos locales.");
        }
      }
    };
    resolveUserSession();
  }, []);

  // 2. Scanner Hook tied to dynamic secure userId state
  useEffect(() => {
    if (params.scannedIds && userId) {
      const processScannedStickers = async () => {
        const newIds = params.scannedIds!.split(",");
        try {
          await incrementMultipleStickers(userId, newIds);
          await loadAndProcessAlbum(userId);
        } catch (error) {
          console.error("[HomeScreen] Error executing batch append:", error);
        }
      };
      processScannedStickers();
      router.setParams({ scannedIds: undefined });
    }
  }, [params.scannedIds, userId]);

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
    const { key, country } = item;
    const total = country.stickers.length;
    const owned = country.stickers.filter((s) => s.count > 0).length;
    const missing = total - owned;

    return (
      <TouchableOpacity
        style={styles.countryCard}
        // Secure Parameter passing: forward authenticated token owner reference downstream
        onPress={() =>
          router.push({
            pathname: "/country/[id]",
            params: { id: key, profileId: userId },
          })
        }
      >
        <View style={styles.countryInfo}>
          <CountryFlag code={key} />
          <View>
            <Text style={styles.countryName}>{country.name}</Text>
            <Text style={styles.countrySub}>
              {owned} of {total} collected
            </Text>
          </View>
        </View>

        <View
          style={[styles.missingBadge, missing === 0 && styles.completedBadge]}
        >
          <Text
            style={[styles.missingText, missing === 0 && styles.completedText]}
          >
            {missing === 0 ? "COMPLETE" : `${missing} LEFT`}
          </Text>
        </View>
      </TouchableOpacity>
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
      <View style={styles.globalHeader}>
        <Text style={styles.mainTitle}>FIGURITAPP</Text>
        <View style={styles.topHeaderRow}>
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
              {stats.totalOwned}/{stats.totalStickers}
            </Text>
            <Text style={styles.statLabel}>STICKERS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#0ea5e9" }]}>
              {stats.percentage}%
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

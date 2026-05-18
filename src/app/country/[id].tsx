import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountryFlag } from "../../components/country-flag";
import { StickerItem } from "../../components/sticker-item";
import {
  decrementSticker,
  getAlbumData,
  incrementSticker,
  Sticker,
} from "../../services/db";
import { countryStyles as styles } from "../../styles/country.styles";

type FilterType = "TODAS" | "FALTANTES" | "REPETIDAS";

export default function CountryScreen() {
  const { id, profileId } = useLocalSearchParams<{
    id: string;
    profileId: string;
  }>();

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [countryName, setCountryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Nuevo estado para los filtros
  const [activeFilter, setActiveFilter] = useState<FilterType>("TODAS");

  const loadCountryData = async () => {
    if (!id || !profileId) return;
    try {
      const allData = await getAlbumData(profileId);
      const countryInfo = allData[id];

      if (countryInfo) {
        setCountryName(countryInfo.name);
        setStickers(countryInfo.stickers);
      }
    } catch (error) {
      console.error("[CountryScreen] Error reading data from SQLite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCountryData();
  }, [id, profileId]);

  const filteredStickers = useMemo(() => {
    let result = stickers;

    if (activeFilter === "FALTANTES")
      result = stickers.filter((s) => s.count === 0);
    if (activeFilter === "REPETIDAS")
      result = stickers.filter((s) => s.count > 1);

    return result.sort((a, b) => {
      const numA = parseInt(a.number, 10);
      const numB = parseInt(b.number, 10);
      return numA - numB;
    });
  }, [stickers, activeFilter]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!countryName) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Country section not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStickerPress = async (stickerId: string) => {
    setStickers((currentStickers) =>
      currentStickers.map((s) =>
        s.id === stickerId ? { ...s, count: s.count + 1 } : s,
      ),
    );

    try {
      await incrementSticker(profileId!, stickerId);
    } catch (error) {
      console.error("[CountryScreen] Failed to save manual update:", error);
      loadCountryData();
    }
  };

  const handleStickerLongPress = async (stickerId: string) => {
    let checkValidDecrement = false;

    setStickers((currentStickers) =>
      currentStickers.map((s) => {
        if (s.id === stickerId && s.count > 0) {
          checkValidDecrement = true;
          return { ...s, count: s.count - 1 };
        }
        return s;
      }),
    );

    if (checkValidDecrement) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await decrementSticker(profileId!, stickerId);
    } catch (error) {
      console.error("[CountryScreen] Failed to save manual decrement:", error);
      loadCountryData();
    }
  };

  const renderStickerItem = ({ item: sticker }: { item: Sticker }) => {
    return (
      <StickerItem
        sticker={sticker}
        countryCode={id!}
        onPress={handleStickerPress}
        onLongPress={handleStickerLongPress}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>
        {activeFilter === "REPETIDAS"
          ? "NO REPETIDAS YET"
          : "YOU HAVE THEM ALL! 🎉"}
      </Text>
    </View>
  );

  const totalStickers = stickers.length;
  const ownedStickers = stickers.filter((s) => s.count > 0).length;

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackButtonText}>⬅ HOME</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <CountryFlag code={id!} />
          <Text style={styles.headerTitle}>{countryName}</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          {ownedStickers} OF {totalStickers} COLLECTED
        </Text>
      </View>

      {/* Selector de Filtros */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === "TODAS" && styles.filterBtnActive,
          ]}
          onPress={() => setActiveFilter("TODAS")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "TODAS" && styles.filterTextActive,
            ]}
          >
            TODAS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === "FALTANTES" && styles.filterBtnActive,
          ]}
          onPress={() => setActiveFilter("FALTANTES")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "FALTANTES" && styles.filterTextActive,
            ]}
          >
            FALTANTES
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === "REPETIDAS" && styles.filterBtnActive,
          ]}
          onPress={() => setActiveFilter("REPETIDAS")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "REPETIDAS" && styles.filterTextActive,
            ]}
          >
            REPETIDAS
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStickers}
        renderItem={renderStickerItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity
        style={styles.floatingScanButton}
        onPress={() =>
          router.push({ pathname: "/scanner", params: { profileId } })
        }
      >
        <Text style={styles.floatingScanButtonText}>📷 SCAN</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

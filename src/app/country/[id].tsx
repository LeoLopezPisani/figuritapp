import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountryFlag } from "../../components/country-flag";
import {
  decrementSticker,
  getAlbumData,
  incrementSticker,
  Sticker,
} from "../../services/db";
import { countryStyles as styles } from "../../styles/country.styles";

type FilterType = "ALL" | "MISSING" | "DUPLICATES";

export default function CountryScreen() {
  const { id, profileId } = useLocalSearchParams<{
    id: string;
    profileId: string;
  }>();

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [countryName, setCountryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Nuevo estado para los filtros
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

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

    if (activeFilter === "MISSING")
      result = stickers.filter((s) => s.count === 0);
    if (activeFilter === "DUPLICATES")
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
    let backgroundColor = "#1e293b";
    let borderColor = "#334155";
    let textColor = "#64748b";

    if (sticker.count === 1) {
      backgroundColor = "#0ea5e9";
      borderColor = "#0ea5e9";
      textColor = "#ffffff";
    } else if (sticker.count > 1) {
      backgroundColor = "#10b981";
      borderColor = "#10b981";
      textColor = "#ffffff";
    }

    return (
      <TouchableOpacity
        style={[styles.stickerContainer, { backgroundColor, borderColor }]}
        onPress={() => handleStickerPress(sticker.id)}
        onLongPress={() => handleStickerLongPress(sticker.id)}
        delayLongPress={250}
      >
        <Text style={[styles.stickerCountryCode, { color: textColor }]}>
          {id}
        </Text>
        <Text style={[styles.stickerNumber, { color: textColor }]}>
          {sticker.number}
        </Text>

        {sticker.count > 1 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>x{sticker.count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>
        {activeFilter === "DUPLICATES"
          ? "NO DUPLICATES YET"
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
            activeFilter === "ALL" && styles.filterBtnActive,
          ]}
          onPress={() => setActiveFilter("ALL")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "ALL" && styles.filterTextActive,
            ]}
          >
            ALL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === "MISSING" && styles.filterBtnActive,
          ]}
          onPress={() => setActiveFilter("MISSING")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "MISSING" && styles.filterTextActive,
            ]}
          >
            MISSING
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter === "DUPLICATES" && styles.filterBtnActive,
          ]}
          onPress={() => setActiveFilter("DUPLICATES")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "DUPLICATES" && styles.filterTextActive,
            ]}
          >
            DUPLICATES
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

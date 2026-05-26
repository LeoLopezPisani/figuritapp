import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CountryFlag } from "../../components/country-flag";
import { StickerItem } from "../../components/sticker-item";
import { COUNTRY_METADATA } from "../../constants/countries";
import {
  decrementSticker,
  getAlbumData,
  incrementSticker,
  Sticker,
} from "../../services/db";
import { countryStyles as styles } from "../../styles/country.styles";

type FilterType = "TODAS" | "FALTANTES" | "REPETIDAS";

export default function CountryScreen() {
  const insets = useSafeAreaInsets();
  const { id, profileId } = useLocalSearchParams<{
    id: string;
    profileId: string;
  }>();

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [countryName, setCountryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<FilterType>("TODAS");

  // 1. Armamos el array de códigos ordenados dinámicamente usando el orderIndex de tus metadatos
  const orderedCountryCodes = useMemo(() => {
    return Object.keys(COUNTRY_METADATA).sort(
      (a, b) => COUNTRY_METADATA[a].orderIndex - COUNTRY_METADATA[b].orderIndex,
    );
  }, []);

  // 2. Buscamos el índice del país actual (ej: "MEX" -> índice 1)
  const currentCountryIndex = orderedCountryCodes.indexOf(id || "");

  // 3. Obtenemos los códigos del anterior y siguiente si existen
  const previousCountryCode =
    currentCountryIndex > 0
      ? orderedCountryCodes[currentCountryIndex - 1]
      : null;
  const nextCountryCode =
    currentCountryIndex < orderedCountryCodes.length - 1
      ? orderedCountryCodes[currentCountryIndex + 1]
      : null;

  // 4. Función que maneja el reemplazo de pantalla
  const handleNavigateToCountry = (targetCountryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    router.replace({
      pathname: "/country/[id]",
      params: { id: targetCountryId, profileId },
    });
  };

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

  const loadCountryData = useCallback(async () => {
    if (!id || !profileId) return;
    try {
      // setIsLoading(true); //Optional: Show loading spinner when returning from scanner

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
  }, [id, profileId]);

  useFocusEffect(
    useCallback(() => {
      loadCountryData();
    }, [loadCountryData]),
  );

  const handleGoHome = () => {
    router.navigate({
      pathname: "/",
      params: { lastViewedCountry: id },
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoHome();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      // Limpiamos el evento cuando nos vamos de la pantalla
      return () => subscription.remove();
    }, [handleGoHome]),
  );

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
        <TouchableOpacity style={styles.backButton} onPress={handleGoHome}>
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
          ? "NO HAY REPETIDAS"
          : "YA LAS CONSEGUISTE TODAS! 🎉"}
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
          onPress={handleGoHome}
        >
          <Text style={styles.headerBackButtonText}>⬅ HOME</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <CountryFlag code={id!} />
          <Text style={styles.headerTitle}>{countryName}</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          {ownedStickers} DE {totalStickers} OBTENIDAS
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

      <View style={[styles.bottomActionBar, { bottom: insets.bottom + 30 }]}>
        {/* Botón Anterior */}
        <TouchableOpacity
          style={[
            styles.navButton,
            !previousCountryCode && styles.navButtonDisabled,
          ]}
          disabled={!previousCountryCode}
          onPress={() =>
            previousCountryCode && handleNavigateToCountry(previousCountryCode)
          }
        >
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>

        {/* Botón Central de Escaneo */}
        <TouchableOpacity
          style={styles.floatingScanButton}
          onPress={() =>
            router.push({ pathname: "/scanner", params: { profileId } })
          }
        >
          <Text style={styles.floatingScanButtonText}>📷 ESCANEAR</Text>
        </TouchableOpacity>

        {/* Botón Siguiente */}
        <TouchableOpacity
          style={[
            styles.navButton,
            !nextCountryCode && styles.navButtonDisabled,
          ]}
          disabled={!nextCountryCode}
          onPress={() =>
            nextCountryCode && handleNavigateToCountry(nextCountryCode)
          }
        >
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

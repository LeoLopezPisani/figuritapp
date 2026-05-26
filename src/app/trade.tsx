import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from "react-native-vision-camera";
import { CountryFlag } from "../components/country-flag";
import {
  Country,
  decrementMultipleStickers,
  getAlbumData,
  incrementMultipleStickers,
} from "../services/db";
import {
  calculateTradeMatch,
  compressAlbumToQR,
  decodeTradeReceipt,
  encodeTradeReceipt,
  MatchResult,
  parseQRToTradeData,
} from "../services/trade";
import { styles } from "../styles/trade.styles";

type TradeViewMode =
  | "IDLE"
  | "SHOW_QR"
  | "SCAN_QR"
  | "RESULTS"
  | "SHOW_RECEIPT";

export default function TradeScreen() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const [viewMode, setViewMode] = useState<TradeViewMode>("IDLE");

  const [myAlbum, setMyAlbum] = useState<Record<string, Country>>({});
  const [qrString, setQrString] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const [receiptQrString, setReceiptQrString] = useState<string>("");
  const [receiptText, setReceiptText] = useState<string>("");

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");

  useEffect(() => {
    async function prepareData() {
      if (!profileId) return;
      try {
        const data = await getAlbumData(profileId);
        setMyAlbum(data);
        const compressed = compressAlbumToQR(data);
        setQrString(compressed);
      } catch (error) {
        console.error("Error loading album for trade:", error);
      } finally {
        setIsLoading(false);
      }
    }
    prepareData();
  }, [profileId]);

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: (codes) => {
      if (viewMode !== "SCAN_QR") return;

      const value = codes[0]?.value;
      if (!value) return;

      if (value.startsWith("T:")) {
        setViewMode("IDLE");
        const receipt = decodeTradeReceipt(value);
        if (receipt) {
          Alert.alert(
            "¡Importar Intercambio! 🤝",
            `Tu amigo procesó un trade con vos.\n\n📥 Recibís: ${receipt.addIds.length} figuritas.\n📤 Entregás: ${receipt.subIds.length} repetidas.\n\n¿Querés aplicarlo?`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Sí, aplicar",
                onPress: async () => {
                  try {
                    setIsSaving(true);
                    if (receipt.addIds.length > 0)
                      await incrementMultipleStickers(
                        profileId!,
                        receipt.addIds,
                      );
                    if (receipt.subIds.length > 0)
                      await decrementMultipleStickers(
                        profileId!,
                        receipt.subIds,
                      );
                    Alert.alert("¡Éxito! 🎉", "Álbum actualizado.", [
                      { text: "Joyita", onPress: () => router.dismissTo("/") },
                    ]);
                  } catch (e) {
                    Alert.alert("Error", "No se pudo aplicar.");
                  } finally {
                    setIsSaving(false);
                  }
                },
              },
            ],
          );
        } else {
          Alert.alert("Error", "Código inválido.");
        }
        return;
      }

      const remoteData = parseQRToTradeData(value);
      if (remoteData) {
        const result = calculateTradeMatch(myAlbum, remoteData);
        setMatchResult(result);
        setSelectedIds(new Set());
        setViewMode("RESULTS");
      } else {
        Alert.alert("Error", "Código no válido.");
        setViewMode("IDLE");
      }
    },
  });

  const handleToggleSticker = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmTrade = async () => {
    if (!profileId || !matchResult) return;

    const allCanGiveIds = matchResult.canGive.flatMap((c) =>
      c.stickers.map((s) => s.id),
    );
    const allCanReceiveIds = matchResult.canReceive.flatMap((c) =>
      c.stickers.map((s) => s.id),
    );

    const itemsToGive = Array.from(selectedIds).filter((id) =>
      allCanGiveIds.includes(id),
    );
    const itemsToReceive = Array.from(selectedIds).filter((id) =>
      allCanReceiveIds.includes(id),
    );

    Alert.alert(
      "Confirmar Intercambio 🤝",
      `¿Querés aplicar los cambios?\n\n📤 Entregás: ${itemsToGive.length} repetidas.\n📥 Recibís: ${itemsToReceive.length} nuevas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, aplicar",
          onPress: async () => {
            try {
              setIsSaving(true);
              if (itemsToGive.length > 0) {
                await decrementMultipleStickers(profileId, itemsToGive);
              }
              if (itemsToReceive.length > 0) {
                await incrementMultipleStickers(profileId, itemsToReceive);
              }

              // Generar Recibo
              const qrReceipt = encodeTradeReceipt(itemsToReceive, itemsToGive);
              setReceiptQrString(qrReceipt);
              setReceiptText(
                `Intercambio Figuritapp:\n\nRecibí ${itemsToReceive.length}: ${itemsToReceive.join(", ")}\nEntregué ${itemsToGive.length}: ${itemsToGive.join(", ")}`,
              );
              setViewMode("SHOW_RECEIPT");
            } catch (error) {
              Alert.alert(
                "Error",
                "Hubo un problema al procesar el intercambio. Por favor, intentá de nuevo.",
              );
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleStartScan = async () => {
    if (!hasPermission) {
      const isGranted = await requestPermission();
      if (!isGranted) {
        Alert.alert("Error", "Necesitamos la cámara para leer el QR");
        return;
      }
    }
    setViewMode("SCAN_QR");
  };

  if (isLoading || isSaving) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        {isSaving && (
          <Text style={{ color: "#94a3b8", marginTop: 12, fontWeight: "bold" }}>
            PROCESANDO INTERCAMBIO...
          </Text>
        )}
      </View>
    );
  }

  if (viewMode === "IDLE") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>⬅ VOLVER</Text>
          </TouchableOpacity>
          <Text style={styles.title}>CAMBIAR FIGURITAS</Text>
        </View>

        <View style={styles.idleContent}>
          <Text style={styles.idleSubtitle}>
            Descubrí al instante si tenés figuritas para cambiar con otra
            persona.
          </Text>

          <TouchableOpacity
            style={styles.bigActionBtn}
            onPress={() => setViewMode("SHOW_QR")}
          >
            <Text style={styles.bigActionEmoji}>📱</Text>
            <Text style={styles.bigActionTitle}>MOSTRAR MI CÓDIGO</Text>
            <Text style={styles.bigActionDesc}>
              Dejá que tu amigo escanee tu álbum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigActionBtn, styles.bigActionBtnScan]}
            onPress={handleStartScan}
          >
            <Text style={styles.bigActionEmoji}>📷</Text>
            <Text style={styles.bigActionTitle}>ESCANEA UN QR</Text>
            <Text style={styles.bigActionDesc}>
              Leé un código de álbum o el resultado de un intercambio
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === "SHOW_QR") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setViewMode("IDLE")}
          >
            <Text style={styles.backBtnText}>⬅ VOLVER</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>TU CÓDIGO DE INTERCAMBIO</Text>
          <Text style={styles.qrSubtitle}>
            Que la otra persona lo escanee desde su app
          </Text>

          <View style={styles.qrWrapper}>
            {qrString ? (
              <QRCode
                value={qrString}
                size={250}
                color="#0f172a"
                backgroundColor="#ffffff"
              />
            ) : (
              <ActivityIndicator color="#0ea5e9" />
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === "SHOW_RECEIPT") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>¡INTERCAMBIO EXITOSO!</Text>
          <View
            style={[
              styles.qrWrapper,
              { borderColor: "#10b981", borderWidth: 2 },
            ]}
          >
            <QRCode
              value={receiptQrString}
              size={220}
              color="#0f172a"
              backgroundColor="#ffffff"
            />
          </View>
          <TouchableOpacity
            style={[styles.actionPill, { marginTop: 30 }]}
            onPress={() => Share.share({ message: receiptText })}
          >
            <Text style={styles.actionPillTitle}>COMPARTIR INTERCAMBIO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => router.dismissTo("/")}
          >
            <Text style={styles.backBtnText}>FINALIZAR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === "SCAN_QR" && device) {
    return (
      <View style={styles.fullScreen}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerText}>Apuntá al código QR</Text>
          <View style={styles.scannerTarget} />
        </View>
        <TouchableOpacity
          style={styles.scannerCloseBtn}
          onPress={() => setViewMode("IDLE")}
        >
          <Text style={styles.scannerCloseText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (viewMode === "RESULTS" && matchResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setViewMode("IDLE")}
          >
            <Text style={styles.backBtnText}>⬅ RE-ESCANEAR</Text>
          </TouchableOpacity>
          <Text style={styles.title}>RESULTADOS</Text>
        </View>

        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text style={styles.helperInstructions}>
            Tocá las figuritas que efectivamente vas a cambiar en este momento
            para actualizar tu stock de una:
          </Text>

          <View style={styles.resultSection}>
            <View
              style={[
                styles.resultHeader,
                { backgroundColor: "rgba(16, 185, 129, 0.12)" },
              ]}
            >
              <Text style={[styles.resultHeaderTitle, { color: "#10b981" }]}>
                📥 TE SIRVEN DE ÉL (Tocá las que te da)
              </Text>
            </View>

            {matchResult.canReceive.length === 0 ? (
              <Text style={styles.emptyText}>
                No tiene repetidas que te sirvan 😢
              </Text>
            ) : (
              matchResult.canReceive.map((item) => (
                <View key={item.code} style={styles.resultRow}>
                  <CountryFlag code={item.code} />
                  <View style={styles.pillsContainer}>
                    {item.stickers.map((s) => {
                      const isSelected = selectedIds.has(s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.stickerPill,
                            isSelected && styles.pillSelectedReceive,
                          ]}
                          onPress={() => handleToggleSticker(s.id)}
                        >
                          <Text
                            style={[
                              styles.stickerPillText,
                              isSelected && styles.stickerPillTextActive,
                            ]}
                          >
                            {s.number}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.resultSection}>
            <View
              style={[
                styles.resultHeader,
                { backgroundColor: "rgba(239, 68, 68, 0.12)" },
              ]}
            >
              <Text style={[styles.resultHeaderTitle, { color: "#ef4444" }]}>
                📤 REPETIDAS TUYAS QUE LE SIRVEN (Tocá las que entregás)
              </Text>
            </View>

            {matchResult.canGive.length === 0 ? (
              <Text style={styles.emptyText}>
                No tenés repetidas que le falten 🤷‍♂️
              </Text>
            ) : (
              matchResult.canGive.map((item) => (
                <View key={item.code} style={styles.resultRow}>
                  <CountryFlag code={item.code} />
                  <View style={styles.pillsContainer}>
                    {item.stickers.map((s) => {
                      const isSelected = selectedIds.has(s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.stickerPill,
                            isSelected && styles.pillSelectedGive,
                          ]}
                          onPress={() => handleToggleSticker(s.id)}
                        >
                          <Text
                            style={[
                              styles.stickerPillText,
                              isSelected && styles.stickerPillTextActive,
                            ]}
                          >
                            {s.number}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {selectedIds.size > 0 && (
          <TouchableOpacity
            style={styles.floatingApplyBtn}
            onPress={handleConfirmTrade}
          >
            <Text style={styles.floatingApplyBtnText}>
              🤝 INTERCAMBIAR ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return null;
}

import TextRecognition from "@react-native-ml-kit/text-recognition";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { OCR_DICTIONARY, STICKER_REGEX } from "../constants/scanner";
import {
  checkScannedStickers,
  decrementMultipleStickers,
  incrementMultipleStickers,
} from "../services/db"; // <-- Tus nuevos poderes de SQLite
import { scannerStyles as styles } from "../styles/scanner.styles";

type ProcessingState = "IDLE" | "ANALYZING" | "SAVING";
type ScanMode = "ADD" | "SUBTRACT";

export default function ScannerScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const insets = useSafeAreaInsets();

  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const [processingState, setProcessingState] =
    useState<ProcessingState>("IDLE");
  const [scanMode, setScanMode] = useState<ScanMode>("ADD");

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const handleCapture = async () => {
    if (cameraRef.current == null || processingState !== "IDLE") return;

    try {
      setProcessingState("ANALYZING");

      const photo = await cameraRef.current.takePhoto({ flash: "off" });
      const result = await TextRecognition.recognize(`file://${photo.path}`);
      setProcessingState("IDLE");

      if (!result.text || result.text.trim() === "") {
        Alert.alert(
          "Scanner",
          "No se detectó ningún texto. Intentá ajustar el escaneo para una mejor captura.",
        );
        return;
      }

      const matches = result.text.toUpperCase().match(STICKER_REGEX);

      if (!matches || matches.length === 0) {
        Alert.alert(
          "No se encontraron figuritas",
          `Texto leído:\n"${result.text}"\n\nNo se encontraron códigos válidos.`,
        );
        return;
      }

      const validStickers = new Set<string>();

      matches.forEach((match) => {
        const cleanMatch = match.replace(/\s+/g, "");
        const prefix = cleanMatch.substring(0, 3);
        const num = cleanMatch.substring(3);
        const finalPrefix = OCR_DICTIONARY[prefix] || prefix;

        if (finalPrefix !== "IGNORE") {
          validStickers.add(`${finalPrefix}_${num}`);
        }
      });

      const cleanedCodes = Array.from(validStickers);

      if (cleanedCodes.length === 0) {
        Alert.alert(
          "No se encontraron figuritas válidas",
          `Texto leído:\n"${result.text}"\n\nLos códigos detectados no son válidos. Intentá ajustar el ángulo o la iluminación.`,
        );
        return;
      }

      const alertTitle =
        scanMode === "ADD" ? "¡Nuevas Figuritas!" : "¡Figuritas a Entregar!";
      const alertAction = scanMode === "ADD" ? "Agregar al álbum" : "Descontar";

      // 3. Confirmación y Lógica de Base de Datos Local
      Alert.alert(
        alertTitle,
        `${cleanedCodes.length} códigos encontrados -> ${cleanedCodes.join(", ")}`,
        [
          {
            text: alertAction,
            onPress: async () => {
              if (!profileId) {
                Alert.alert("Error", "No se encontró la sesión del usuario.");
                return;
              }

              try {
                setProcessingState("SAVING");

                if (scanMode === "ADD") {
                  const evaluation = await checkScannedStickers(
                    profileId,
                    cleanedCodes,
                  );
                  await incrementMultipleStickers(profileId, cleanedCodes);

                  const nuevas = evaluation
                    .filter((item) => item.isNew)
                    .map((item) => item.id);
                  const repetidas = evaluation
                    .filter((item) => !item.isNew)
                    .map((item) => item.id);

                  let alertMessage = "";
                  if (nuevas.length > 0)
                    alertMessage += `✨ *${nuevas.length} PARA PEGAR:* \n${nuevas.join(", ")}\n\n`;
                  if (repetidas.length > 0)
                    alertMessage += `🔁 *${repetidas.length} REPETIDAS:* \n${repetidas.join(", ")}`;

                  setProcessingState("IDLE");
                  Alert.alert("¡Escaneo Exitoso! 🎉", alertMessage, [
                    { text: "OK", onPress: () => router.back() },
                  ]);
                } else {
                  const evaluation = await checkScannedStickers(
                    profileId,
                    cleanedCodes,
                  );

                  const sinStock = evaluation
                    .filter((item) => item.count === 0)
                    .map((item) => item.id);
                  const ultimaCopia = evaluation
                    .filter((item) => item.count === 1)
                    .map((item) => item.id);
                  const repetidasSeguras = evaluation
                    .filter((item) => item.count > 1)
                    .map((item) => item.id);

                  const validasParaDescontar = [
                    ...ultimaCopia,
                    ...repetidasSeguras,
                  ];

                  if (validasParaDescontar.length === 0) {
                    setProcessingState("IDLE");
                    Alert.alert(
                      "Sin Cambios",
                      `⚠️ *NO TENÍAS:*\n${sinStock.join(", ")}`,
                      [{ text: "OK" }],
                    );
                    return;
                  }

                  const ejecutarDescuento = async () => {
                    await decrementMultipleStickers(
                      profileId,
                      validasParaDescontar,
                    );

                    let alertMessage = "";
                    if (validasParaDescontar.length > 0)
                      alertMessage += `✅ *DESCONTADAS:*\n${validasParaDescontar.join(", ")}\n\n`;
                    if (sinStock.length > 0)
                      alertMessage += `⚠️ *NO TENÍAS (Ignoradas):*\n${sinStock.join(", ")}\n`;

                    setProcessingState("IDLE");
                    Alert.alert("¡Stock Actualizado! 📤", alertMessage, [
                      { text: "OK", onPress: () => router.back() },
                    ]);
                  };

                  if (ultimaCopia.length > 0) {
                    setProcessingState("IDLE");
                    Alert.alert(
                      "¡Atención! Última copia",
                      `Estás por entregar figuritas de las que NO tenés repetidas:\n\n${ultimaCopia.join(", ")}\n\nVan a volver a aparecer como FALTANTES en tu álbum. ¿Querés descontarlas igual?`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Sí, descontar",
                          style: "destructive",
                          onPress: () => {
                            setProcessingState("SAVING");
                            ejecutarDescuento();
                          },
                        },
                      ],
                    );
                  } else {
                    await ejecutarDescuento();
                  }
                }
              } catch (error) {
                setProcessingState("IDLE");
                console.error("Error guardando figuritas:", error);
                Alert.alert(
                  "Error",
                  "Hubo un problema guardando en la base de datos.",
                );
              }
            },
          },
          { text: "Escanear de nuevo", style: "cancel" },
        ],
      );
    } catch (error) {
      setProcessingState("IDLE");
      console.error("Error procesando la imagen:", error);
      Alert.alert("Error", "Hubo un error al procesar la imagen.");
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="small"
          color="#0ea5e9"
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.infoText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.infoText, { color: "#ef4444" }]}>
          Hardware Error
        </Text>
        <Text style={[styles.infoText, { fontSize: 14, marginTop: 4 }]}>
          Back camera not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* SELECTOR DE MODO SUPERIOR */}
      {processingState === "IDLE" && (
        <View style={[styles.modeSelectorContainer, { top: insets.top + 20 }]}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              scanMode === "ADD" && styles.modeButtonActiveAdd,
            ]}
            onPress={() => setScanMode("ADD")}
          >
            <Text
              style={[
                styles.modeText,
                scanMode === "ADD" && styles.modeTextActive,
              ]}
            >
              📥 AGREGAR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              scanMode === "SUBTRACT" && styles.modeButtonActiveSubtract,
            ]}
            onPress={() => setScanMode("SUBTRACT")}
          >
            <Text
              style={[
                styles.modeText,
                scanMode === "SUBTRACT" && styles.modeTextActive,
              ]}
            >
              📤 QUITAR
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cyber Loading Overlay Dinámico */}
      {processingState !== "IDLE" && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>
            {processingState === "ANALYZING"
              ? "PROCESANDO CÓDIGOS..."
              : "GUARDANDO EN EL ÁLBUM..."}
          </Text>
          <Text style={styles.loadingSubtext}>
            {processingState === "ANALYZING"
              ? "Se está analizando la imagen"
              : "Calculando repetidas y sincronizando"}
          </Text>
        </View>
      )}

      {/* Visual Guideline HUD */}
      {processingState === "IDLE" && (
        <View style={styles.hudOverlay}>
          <Text style={styles.hudTitle}>
            APUNTÁ A LOS CÓDIGOS DE ATRÁS DE LAS FIGURITAS
          </Text>
          <Text style={styles.hudSubtitle}>
            Podés capturar múltiples códigos simultáneamente
          </Text>
          <View style={styles.reticleCornerTL} />
          <View style={styles.reticleCornerTR} />
          <View style={styles.reticleCornerBL} />
          <View style={styles.reticleCornerBR} />
        </View>
      )}

      {/* Bottom Interface Controls */}
      {processingState === "IDLE" && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>CANCELAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
          >
            <View
              style={[
                styles.captureButtonInner,
                scanMode === "SUBTRACT" && { backgroundColor: "#ef4444" },
              ]}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

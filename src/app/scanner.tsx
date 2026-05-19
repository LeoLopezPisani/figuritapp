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
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { OCR_DICTIONARY, STICKER_REGEX } from "../constants/scanner";
import {
  checkScannedStickers,
  incrementMultipleStickers,
} from "../services/db"; // <-- Tus nuevos poderes de SQLite
import { scannerStyles as styles } from "../styles/scanner.styles";

type ProcessingState = "IDLE" | "ANALYZING" | "SAVING";

export default function ScannerScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  // Recibimos el ID del usuario directamente desde la URL de la ruta
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  // Estado mejorado para darle feedback preciso al usuario
  const [processingState, setProcessingState] =
    useState<ProcessingState>("IDLE");

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const handleCapture = async () => {
    if (cameraRef.current == null || processingState !== "IDLE") return;

    try {
      setProcessingState("ANALYZING");

      // 1. Capture high-res photo
      const photo = await cameraRef.current.takePhoto({ flash: "off" });

      // 2. Process local file path with ML Kit OCR
      const result = await TextRecognition.recognize(`file://${photo.path}`);
      setProcessingState("IDLE");

      if (!result.text || result.text.trim() === "") {
        Alert.alert(
          "Scanner",
          "No se detectó ningún texto. Intentá ajustar el escaneo para una mejor captura.",
        );
        return;
      }

      const upperCaseText = result.text.toUpperCase();
      const matches = upperCaseText.match(STICKER_REGEX);

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

      // 3. Confirmación y Lógica de Base de Datos Local
      Alert.alert(
        "¡Figuritas Detectadas!",
        `${cleanedCodes.length} códigos encontrados -> ${cleanedCodes.join(", ")}`,
        [
          {
            text: "Agregar al álbum",
            onPress: async () => {
              if (!profileId) {
                Alert.alert("Error", "No se encontró la sesión del usuario.");
                return;
              }

              try {
                // Volvemos a prender el HUD, esta vez en modo "Guardando"
                setProcessingState("SAVING");

                // Evaluamos y guardamos usando las funciones que preparamos
                const evaluation = await checkScannedStickers(
                  profileId,
                  cleanedCodes,
                );
                await incrementMultipleStickers(profileId, cleanedCodes);

                // Clasificamos los resultados
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

                // Mostramos el veredicto y al tocar OK volvemos a la pantalla anterior
                Alert.alert("¡Escaneo Exitoso! 🎉", alertMessage, [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]);
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
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

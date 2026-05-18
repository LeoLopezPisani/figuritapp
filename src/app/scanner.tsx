import TextRecognition from "@react-native-ml-kit/text-recognition";
import { router } from "expo-router";
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
import { scannerStyles as styles } from "../styles/scanner.styles";

export default function ScannerScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const handleCapture = async () => {
    if (cameraRef.current == null || isProcessing) return;

    try {
      setIsProcessing(true);

      // 1. Capture high-res photo
      const photo = await cameraRef.current.takePhoto({ flash: "off" });

      // 2. Process local file path with ML Kit OCR
      const result = await TextRecognition.recognize(`file://${photo.path}`);
      setIsProcessing(false);

      if (!result.text || result.text.trim() === "") {
        Alert.alert("Scanner", "No text was detected. Try focusing closer.");
        return;
      }

      const upperCaseText = result.text.toUpperCase();

      const matches = upperCaseText.match(STICKER_REGEX);

      if (!matches || matches.length === 0) {
        Alert.alert(
          "No Stickers Found",
          `Text read:\n"${result.text}"\n\nIt does not match any code within the 00-20 range.`,
        );
        return;
      }

      // 4. Normalize codes format and apply OCR Dictionary/Blacklist
      const validStickers = new Set<string>();

      matches.forEach((match) => {
        // Remove inner spaces
        const cleanMatch = match.replace(/\s+/g, "");

        // Extract prefix (first 3 chars) and number
        const prefix = cleanMatch.substring(0, 3);
        const num = cleanMatch.substring(3);

        // Map through dictionary fixes
        const finalPrefix = OCR_DICTIONARY[prefix] || prefix;

        // Ignore blacklisted items
        if (finalPrefix !== "IGNORE") {
          validStickers.add(`${finalPrefix}_${num}`);
        }
      });

      const cleanedCodes = Array.from(validStickers);

      // Edge case: matches were found but all were blacklisted (e.g., only "CUP 20")
      if (cleanedCodes.length === 0) {
        Alert.alert(
          "No Stickers Found",
          `Text read:\n"${result.text}"\n\nCodes detected were ignored by the system. Try adjusting the angle or lighting for a clearer scan.`,
        );
        return;
      }

      Alert.alert("Stickers Detected!", `Found: ${cleanedCodes.join(", ")}`, [
        {
          text: "Add to Album",
          onPress: () => {
            router.navigate({
              pathname: "/",
              params: { scannedIds: cleanedCodes.join(",") },
            });
          },
        },
        { text: "Scan again", style: "cancel" },
      ]);
    } catch (error) {
      setIsProcessing(false);
      console.error("Error processing image:", error);
      Alert.alert("Error", "There was a problem scanning the image.");
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

      {/* Cyber Loading Overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>PROCESSING CODES...</Text>
          <Text style={styles.loadingSubtext}>
            Google ML Kit is analyzing the frame
          </Text>
        </View>
      )}

      {/* Visual Guideline HUD - Styled like a tactical targeting reticle */}
      {!isProcessing && (
        <View style={styles.hudOverlay}>
          <Text style={styles.hudTitle}>AIM AT STICKER CODES</Text>
          <Text style={styles.hudSubtitle}>
            You can capture multiple codes simultaneously
          </Text>
          <View style={styles.reticleCornerTL} />
          <View style={styles.reticleCornerTR} />
          <View style={styles.reticleCornerBL} />
          <View style={styles.reticleCornerBR} />
        </View>
      )}

      {/* Bottom Interface Controls */}
      {!isProcessing && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
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

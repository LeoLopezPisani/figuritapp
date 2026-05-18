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

      // 3. RegEx filtering matching 3 letters + space? + numbers (1 to 20 range)
      const matches = upperCaseText.match(
        /\b[A-Z]{3}\s*(?:[1-9]|1[0-9]|20)\b/g,
      );

      if (!matches || matches.length === 0) {
        Alert.alert(
          "No Stickers Found",
          `Text read:\n"${result.text}"\n\nIt does not match any code within the 1-20 range.`,
        );
        return;
      }

      // 4. Normalize codes format (e.g., "ARG 10" -> "ARG_10")
      const cleanedCodes = matches.map((code) => code.replace(/\s+/g, "_"));

      // 5. Success prompt sending data back to Home
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

  // Cyber Dark Theme for the Permissions Screen fallback
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

  // Cyber Dark Theme for the Missing Camera Screen fallback
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#0f172a" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  infoText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Tactical HUD Frame
  hudOverlay: {
    position: "absolute",
    top: "25%",
    alignSelf: "center",
    backgroundColor: "rgba(30, 41, 59, 0.75)", // Translucent Slate 800
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.3)", // Soft Cyan Glow
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
    height: 200,
    justifyContent: "center",
  },
  hudTitle: {
    color: "#0ea5e9",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  hudSubtitle: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 16,
  },

  // Custom Targeting Reticle Corners (Cyber Aesthetic)
  reticleCornerTL: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#0ea5e9",
  },
  reticleCornerTR: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#0ea5e9",
  },
  reticleCornerBL: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#0ea5e9",
  },
  reticleCornerBR: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#0ea5e9",
  },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.95)", // Deep solid Slate 900
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 20,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  loadingSubtext: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },

  // Controls Area
  bottomControls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  cancelButton: {
    position: "absolute",
    left: 40,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cancelButtonText: {
    color: "#94a3b8",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },

  // Tactical Capture Shutter (Centered correctly)
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: "#0ea5e9", // Cyber Cyan ring
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  captureButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#0ea5e9",
  },
});

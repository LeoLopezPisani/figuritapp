import { StyleSheet } from "react-native";

export const scannerStyles = StyleSheet.create({
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

  modeSelectorContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 12,
    padding: 4,
    zIndex: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  modeButtonActiveAdd: {
    backgroundColor: "#0ea5e9", // Azul para recibir
  },
  modeButtonActiveSubtract: {
    backgroundColor: "#ef4444", // Rojo para entregar
  },
  modeText: {
    color: "#94a3b8",
    fontWeight: "bold",
    fontSize: 14,
  },
  modeTextActive: {
    color: "#ffffff",
  },
});

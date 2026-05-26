import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  centerContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreen: { flex: 1, backgroundColor: "black" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: { padding: 8 },
  backBtnText: { color: "#94a3b8", fontWeight: "bold", fontSize: 14 },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 16,
    letterSpacing: 0.5,
  },

  // IDLE VISTA
  idleContent: { flex: 1, padding: 24, justifyContent: "center" },
  idleSubtitle: {
    color: "#94a3b8",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  bigActionBtn: {
    backgroundColor: "#1e293b",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  bigActionBtnScan: {
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    borderColor: "#0ea5e9",
  },
  bigActionEmoji: { fontSize: 36, marginBottom: 12 },
  bigActionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  bigActionDesc: { color: "#94a3b8", fontSize: 13 },

  // QR VISTA
  qrContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  qrTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  qrSubtitle: { color: "#94a3b8", fontSize: 13, marginBottom: 40 },
  qrWrapper: { backgroundColor: "#ffffff", padding: 20, borderRadius: 16 },

  // ESCÁNER VISTA
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scannerTarget: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: "#0ea5e9",
    borderRadius: 24,
  },
  scannerText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 30,
  },
  scannerCloseBtn: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  scannerCloseText: { color: "#ffffff", fontWeight: "bold" },

  // INTERFAZ DE RESULTADOS SELECCIONABLES 🔥
  resultsScroll: { flex: 1, padding: 14 },
  helperInstructions: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  resultSection: {
    marginBottom: 24,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#334155",
  },
  resultHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  resultHeaderTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
    padding: 20,
    textAlign: "center",
    fontSize: 13,
  },

  // Contenedor de las píldoras de números
  pillsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginLeft: 16,
  },
  stickerPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    minWidth: 38,
    alignItems: "center",
  },
  stickerPillText: { color: "#94a3b8", fontSize: 13, fontWeight: "bold" },
  stickerPillTextActive: { color: "#ffffff" },

  // Colores de selección activos
  pillSelectedReceive: { backgroundColor: "#10b981", borderColor: "#10b981" },
  pillSelectedGive: { backgroundColor: "#ef4444", borderColor: "#ef4444" },

  // Botón Flotante de Confirmación
  floatingApplyBtn: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#0ea5e9", // Azul insignia
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6, // Sombras en Android
  },
  floatingApplyBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  actionPill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  actionPillTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "bold" },
});

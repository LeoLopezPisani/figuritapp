import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },

  globalHeader: {
    backgroundColor: "#1e293b",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#061329",
    height: 50,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandLogo: {
    width: 40,
    height: 40,
    marginTop: 8,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1.5,
  },
  secondaryTitle: {
    fontSize: 14,
    color: "#b8afaf",
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },

  headerActions: { flexDirection: "row", gap: 8 },
  shareButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  shareButtonText: {
    color: "#10b981",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Slider elevado para separar visualmente
  sliderWrapper: {
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderColor: "#334155",
    paddingVertical: 12,
    elevation: 4, // Sombra en Android
    shadowColor: "#000", // Sombra en iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  sliderContentContainer: { paddingHorizontal: 16, gap: 8 },
  tabButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  tabButtonActive: {
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    borderColor: "#0ea5e9",
  },
  tabButtonText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  tabButtonTextActive: { color: "#0ea5e9" },

  sectionHeaderContainer: {
    paddingVertical: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0ea5e9",
    letterSpacing: 2,
  },

  // FIX DE ESPACIADO: paddingTop agregado para separar FWC del header
  listContainer: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 110 },

  countryCard: {
    backgroundColor: "#1e293b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  countryInfo: { flexDirection: "row", alignItems: "center", gap: 16 },
  countryName: { fontSize: 16, fontWeight: "bold", color: "#ffffff" },
  countrySub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  missingBadge: {
    backgroundColor: "rgba(51, 65, 85, 0.5)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  completedBadge: {
    backgroundColor: "rgba(22, 163, 74, 0.15)",
    borderColor: "#16a34a",
  },
  missingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  completedText: { color: "#16a34a" },

  scanButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#0ea5e9",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

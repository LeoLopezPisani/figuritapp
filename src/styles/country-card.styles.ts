import { StyleSheet } from "react-native";

export const countryCardStyles = StyleSheet.create({
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
});

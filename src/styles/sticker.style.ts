import { StyleSheet } from "react-native";

export const stickerStyles = StyleSheet.create({
  stickerContainer: {
    flex: 1,
    margin: 6,
    height: 84,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    position: "relative",
    maxWidth: "22%",
  },
  stickerCountryCode: {
    fontSize: 9,
    fontWeight: "900",
    opacity: 0.6,
    letterSpacing: 1,
  },
  stickerNumber: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  badgeContainer: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  badgeText: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
});

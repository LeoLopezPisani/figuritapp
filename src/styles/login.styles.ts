import { StyleSheet } from "react-native";

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  brandWrapper: { alignItems: "center", marginBottom: 40 },
  brandLogo: { width: 90, height: 90, marginBottom: 16, borderRadius: 18 },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: "#0ea5e9",
    marginTop: 8,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: "#1e293b",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  inputLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputField: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 14,
  },
  actionsWrapper: { marginTop: 24, gap: 12 },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  secondaryButtonText: {
    color: "#94a3b8",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  textLink: {
    color: "#0ea5e9",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    padding: 8,
  },
  versionText: {
    color: "#475569", // Un gris oscuro que se funde con tu fondo slate
    fontSize: 12, // Bien chiquito
    textAlign: "center",
    marginTop: 24, // Para despegarlo del botón de login
    marginBottom: 16, // Para que no quede pegado al borde del teléfono
    letterSpacing: 1, // Le da ese toque técnico/elegante
  },
});

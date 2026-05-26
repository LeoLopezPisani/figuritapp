import { Image, StyleSheet, Text, View } from "react-native";

interface CountryFlagProps {
  code: string;
}

interface CountryFlagProps {
  code: string;
  variant?: "default" | "tiny"; // <-- Agregamos la variante
}

// Static mapping required by Metro Bundler for local assets
const FLAG_ASSETS: Record<string, any> = {
  FWC: require("../../assets/flags/fwc.png"),
  // Group A
  MEX: require("../../assets/flags/mx.png"),
  RSA: require("../../assets/flags/za.png"),
  KOR: require("../../assets/flags/kr.png"),
  CZE: require("../../assets/flags/cz.png"),

  // Group B
  CAN: require("../../assets/flags/ca.png"),
  BIH: require("../../assets/flags/ba.png"),
  QAT: require("../../assets/flags/qa.png"),
  SUI: require("../../assets/flags/ch.png"),

  // Group C
  BRA: require("../../assets/flags/br.png"),
  MAR: require("../../assets/flags/ma.png"),
  HAI: require("../../assets/flags/ht.png"),
  SCO: require("../../assets/flags/gb-sct.png"),

  // Group D
  USA: require("../../assets/flags/us.png"),
  PAR: require("../../assets/flags/py.png"),
  AUS: require("../../assets/flags/au.png"),
  TUR: require("../../assets/flags/tr.png"),

  // Group E
  GER: require("../../assets/flags/de.png"),
  CUW: require("../../assets/flags/cw.png"),
  CIV: require("../../assets/flags/ci.png"),
  ECU: require("../../assets/flags/ec.png"),

  // Group F
  NED: require("../../assets/flags/nl.png"),
  JPN: require("../../assets/flags/jp.png"),
  SWE: require("../../assets/flags/se.png"),
  TUN: require("../../assets/flags/tn.png"),

  // Group G
  BEL: require("../../assets/flags/be.png"),
  EGY: require("../../assets/flags/eg.png"),
  IRN: require("../../assets/flags/ir.png"),
  NZL: require("../../assets/flags/nz.png"),

  // Group H
  ESP: require("../../assets/flags/es.png"),
  CPV: require("../../assets/flags/cv.png"),
  KSA: require("../../assets/flags/sa.png"),
  URU: require("../../assets/flags/uy.png"),

  // Group I
  FRA: require("../../assets/flags/fr.png"),
  SEN: require("../../assets/flags/sn.png"),
  IRQ: require("../../assets/flags/iq.png"),
  NOR: require("../../assets/flags/no.png"),

  // Group J
  ARG: require("../../assets/flags/ar.png"),
  ALG: require("../../assets/flags/dz.png"),
  AUT: require("../../assets/flags/at.png"),
  JOR: require("../../assets/flags/jo.png"),

  // Group K
  POR: require("../../assets/flags/pt.png"),
  COD: require("../../assets/flags/cd.png"),
  UZB: require("../../assets/flags/uz.png"),
  COL: require("../../assets/flags/co.png"),

  // Group L
  ENG: require("../../assets/flags/gb-eng.png"),
  CRO: require("../../assets/flags/hr.png"),
  GHA: require("../../assets/flags/gh.png"),
  PAN: require("../../assets/flags/pa.png"),
};

export function CountryFlag({ code, variant = "default" }: CountryFlagProps) {
  const isTiny = variant === "tiny";
  const wrapperStyle = isTiny ? styles.tinyImageWrapper : styles.imageWrapper;

  if (!FLAG_ASSETS[code]) {
    return (
      <View style={[wrapperStyle, styles.fallbackBackground]}>
        <Text style={isTiny ? styles.tinyFallbackText : styles.fallbackText}>
          {code.substring(0, 2)}
        </Text>
      </View>
    );
  }

  return (
    <View style={wrapperStyle}>
      <Image
        source={FLAG_ASSETS[code]}
        style={styles.flagImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Variante Normal (para la vista de país)
  imageWrapper: {
    width: 40,
    height: 30,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#334155",
  },
  // Variante Tiny (para el slider)
  tinyImageWrapper: {
    width: 16,
    height: 12,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  flagImage: {
    width: "100%",
    height: "100%",
  },
  fallbackBackground: {
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: { fontSize: 10, fontWeight: "bold", color: "#94a3b8" },
  tinyFallbackText: { fontSize: 6, fontWeight: "bold", color: "#94a3b8" },
});

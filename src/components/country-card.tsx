// src/components/CountryCard.tsx
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Country } from "../services/db";
import { countryCardStyles as styles } from "../styles/country-card.styles";
import { CountryFlag } from "./country-flag";

interface CountryCardProps {
  countryKey: string;
  country: Country;
  onPress: (key: string) => void;
}

export const CountryCard = React.memo(
  ({ countryKey, country, onPress }: CountryCardProps) => {
    const total = country.stickers.length;
    const owned = country.stickers.filter((s) => s.count > 0).length;
    const missing = total - owned;

    return (
      <TouchableOpacity
        style={styles.countryCard}
        onPress={() => onPress(countryKey)}
      >
        <View style={styles.countryInfo}>
          <CountryFlag code={countryKey} />
          <View>
            <Text style={styles.countryName}>{country.name}</Text>
            <Text style={styles.countrySub}>
              {owned} de {total} coleccionadas
            </Text>
          </View>
        </View>

        <View
          style={[styles.missingBadge, missing === 0 && styles.completedBadge]}
        >
          <Text
            style={[styles.missingText, missing === 0 && styles.completedText]}
          >
            {missing === 0 ? "COMPLETO" : `${missing} FALTAN`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

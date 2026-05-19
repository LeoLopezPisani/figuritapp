// src/components/StickerItem.tsx
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Sticker } from "../services/db";
import { stickerStyles as styles } from "../styles/sticker.style";

interface StickerItemProps {
  sticker: Sticker;
  countryCode: string;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
}

export const StickerItem = React.memo(
  ({ sticker, countryCode, onPress, onLongPress }: StickerItemProps) => {
    let backgroundColor = "#1e293b";
    let borderColor = "#334155";
    let textColor = "#64748b";

    if (sticker.count === 1) {
      backgroundColor = "#0ea5e9";
      borderColor = "#0ea5e9";
      textColor = "#ffffff";
    } else if (sticker.count > 1) {
      backgroundColor = "#10b981";
      borderColor = "#10b981";
      textColor = "#ffffff";
    }

    return (
      <TouchableOpacity
        style={[styles.stickerContainer, { backgroundColor, borderColor }]}
        onPress={() => onPress(sticker.id)}
        onLongPress={() => onLongPress(sticker.id)}
        delayLongPress={250}
      >
        <Text style={[styles.stickerCountryCode, { color: textColor }]}>
          {countryCode}
        </Text>
        <Text style={[styles.stickerNumber, { color: textColor }]}>
          {sticker.number}
        </Text>

        {sticker.count > 1 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>x{sticker.count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

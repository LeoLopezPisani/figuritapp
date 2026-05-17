import { router, useLocalSearchParams } from "expo-router"; // <-- Sumamos useLocalSearchParams
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Generamos un álbum de prueba (Solo Argentina, 20 figuritas)
const INITIAL_ALBUM = Array.from({ length: 20 }, (_, i) => ({
  id: `TUN_${i + 1}`,
  country: "TUN",
  number: i + 1,
  count: 0,
}));
let memoryAlbumStorage = INITIAL_ALBUM;

export default function AlbumScreen() {
  const [album, setAlbum] = useState(memoryAlbumStorage);

  // 1. Capturamos los parámetros que nos pueda mandar el Escáner
  const params = useLocalSearchParams<{ IDsEscaneados?: string }>();

  // 2. CICLO DE VIDA: Escuchamos cuando "params.IDsEscaneados" cambie
  useEffect(() => {
    if (params.IDsEscaneados) {
      const idsNuevos = params.IDsEscaneados.split(",");

      setAlbum((currentAlbum) => {
        const updated = currentAlbum.map((figu) => {
          const cuantasVecesSeEscaneo = idsNuevos.filter(
            (id) => id === figu.id,
          ).length;
          if (cuantasVecesSeEscaneo > 0) {
            return { ...figu, count: figu.count + cuantasVecesSeEscaneo };
          }
          return figu;
        });

        memoryAlbumStorage = updated;
        return updated;
      });

      router.setParams({ IDsEscaneados: undefined });
    }
  }, [params.IDsEscaneados]);

  // Función manual (para seguir probando al tocar los cuadraditos si querés)
  const simulateScan = (scannedId: string) => {
    setAlbum((currentAlbum) => {
      // 1. Mapeamos y guardamos el resultado en la variable 'updated'
      const updated = currentAlbum.map((figu) =>
        figu.id === scannedId ? { ...figu, count: figu.count + 1 } : figu,
      );

      memoryAlbumStorage = updated;
      return updated;
    });
  };

  const renderItem = ({ item }: { item: (typeof INITIAL_ALBUM)[0] }) => {
    let bgColor = "#e0e0e0"; // Gris (Falta)
    if (item.count === 1) bgColor = "#4da6ff"; // Azul (La tengo)
    if (item.count > 1) bgColor = "#4dffa6"; // Verde (Repetida)

    return (
      <TouchableOpacity
        style={[styles.figuContainer, { backgroundColor: bgColor }]}
        onPress={() => simulateScan(item.id)}
      >
        <Text style={styles.figuText}>{item.country}</Text>
        <Text style={styles.figuNumber}>{item.number}</Text>

        {item.count > 1 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>x{item.count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Álbum</Text>
        <Text style={styles.subtitle}>Argentina (ARG)</Text>
      </View>

      <FlatList
        data={album}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.grid}
      />

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push("/scanner")}
      >
        <Text style={styles.scanButtonText}>📷 ESCANEAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  header: {
    padding: 20,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 5,
  },
  grid: {
    padding: 10,
  },
  figuContainer: {
    flex: 1,
    margin: 5,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  figuText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  figuNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4d4d",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  scanButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#ff3366",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  scanButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

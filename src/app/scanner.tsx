import TextRecognition from "@react-native-ml-kit/text-recognition"; // <-- El nuevo motor de Google
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from "react-native-vision-camera";

export default function ScannerScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null); // <-- Referencia para controlar la cámara
  const [isProcessing, setIsProcessing] = useState(false); // State para mostrar un "Cargando..."

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // Función que saca la foto y la procesa con ML Kit
  const handleCapture = async () => {
    if (cameraRef.current == null || isProcessing) return;

    try {
      setIsProcessing(true);

      // 1. Tomamos la foto
      const photo = await cameraRef.current.takePhoto({ flash: "off" });

      // 2. Procesamos con ML Kit
      const result = await TextRecognition.recognize(`file://${photo.path}`);
      setIsProcessing(false);

      if (!result.text || result.text.trim() === "") {
        Alert.alert("Escáner", "No se detectó ningún texto.");
        return;
      }

      // === 3. MAGIA: Buscamos códigos de figuritas usando RegEx ===
      // Busca 3 letras mayúsculas seguidas de espacios opcionales y números
      const textoEnMayuscula = result.text.toUpperCase();
      const coincidencias = textoEnMayuscula.match(
        /\b[A-Z]{3}\s*(?:[1-9]|1[0-9]|20)\b/g,
      );

      if (!coincidencias || coincidencias.length === 0) {
        Alert.alert(
          "No se encontraron figuritas",
          `Leído:\n"${result.text}"\n\nAsegurate de que se vea bien el código del país y el número.`,
        );
        return;
      }

      // 4. Normalizamos los códigos encontrados (ej: "ARG 10" o "ARG10" -> "ARG_10")
      const codigosLimpios = coincidencias.map((codigo) => {
        // Removemos espacios intermedios y le clavamos el guión bajo
        return codigo.replace(/\s+/g, "_");
      });

      // 5. Le avisamos al usuario qué encontramos y volvemos mandando los datos
      Alert.alert(
        "¡Figuritas Detectadas!",
        `Encontramos: ${codigosLimpios.join(", ")}`,
        [
          {
            text: "Agregar al Álbum",
            onPress: () => {
              // Navegamos de vuelta a la home mandando los códigos separados por coma
              router.navigate({
                pathname: "/",
                params: { IDsEscaneados: codigosLimpios.join(",") },
              });
            },
          },
          { text: "Escanear de nuevo", style: "cancel" },
        ],
      );
    } catch (error) {
      setIsProcessing(false);
      console.error("Error al procesar la imagen:", error);
      Alert.alert("Error", "Hubo un problema al escanear.");
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>Pidiendo permisos de cámara...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la cámara trasera.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Añadimos ref={cameraRef} y photo={true} para habilitar las capturas */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Capa de carga si está procesando el OCR */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            Procesando con Google ML Kit...
          </Text>
        </View>
      )}

      {/* Guía visual */}
      {!isProcessing && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Enfocá los códigos</Text>
          <Text style={styles.subtitle}>
            Podés sacar una o varias figuritas juntas
          </Text>
        </View>
      )}

      {/* Controles de abajo */}
      {!isProcessing && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>

          {/* El botón redondo clásico para sacar la foto */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  title: { color: "white", fontSize: 18, fontWeight: "bold" },
  subtitle: { color: "#ccc", fontSize: 13, marginTop: 5, textAlign: "center" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 15,
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  closeText: { color: "white", fontWeight: "bold" },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "white",
  },
});

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      {/* 
        Reemplazamos el <AppTabs /> suelto por un Stack. 
        El Stack nos permite poner pantallas "una arriba de la otra".
      */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tu pantalla principal (el álbum/tabs) */}
        <Stack.Screen name="index" />

        {/* La pantalla de la cámara, configurada como un modal que sale de abajo hacia arriba */}
        <Stack.Screen
          name="scanner"
          options={{
            presentation: "modal", // Hace la animación de deslizarse hacia arriba
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initializeDatabase } from "../services/db";
import { supabase } from "../services/supabase";

export default function RootLayout() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  // 1. Initialize SQLite Database local tables on boot
  useEffect(() => {
    initializeDatabase()
      .then(() => console.log("[RootLayout] SQLite Initialized"))
      .catch((err) => console.error("[RootLayout] SQLite Init Error:", err));
  }, []);

  // 2. Listen to Supabase Realtime Authentication Session status
  useEffect(() => {
    // Check current session state immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setIsAuthReady(true);
    });

    // Subscribe to auth changes (Sign In, Sign Out, Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Secure Route Guard: Redirects based on encrypted user session presence
  useEffect(() => {
    if (!isAuthReady) return;

    // Check if the user is currently inside the (login) screen area
    const inAuthGroup = segments[0] === "login";

    if (!hasSession && !inAuthGroup) {
      // No active token found, intercept and route to secure login page
      router.replace("/login");
    } else if (hasSession && inAuthGroup) {
      // Authenticated user tried to open login, redirect back to application core dashboard
      router.replace("/");
    }
  }, [hasSession, isAuthReady, segments]);

  // Loading Splash State while verifying credentials
  if (!isAuthReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return <Slot />;
}

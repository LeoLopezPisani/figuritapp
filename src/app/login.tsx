import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../services/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Authentication: Secure Login
  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Please fill in all fields");

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Authentication Failed", error.message);
    } else {
      // Success: Navigate securely to the app core dashboard
      router.replace("/");
    }
  };

  // Authentication: Secure Encrypted Sign Up
  const handleSignUp = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Please fill in all fields");
    if (password.length < 6)
      return Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters",
      );

    setLoading(true);
    const { error, data } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Registration Failed", error.message);
    } else {
      Alert.alert(
        "Account Created!",
        "Your profile is encrypted and ready. You can now log in securely.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandWrapper}>
        <Text style={styles.brandTrophy}>🏆</Text>
        <Text style={styles.brandTitle}>FIGURITAPP</Text>
        <Text style={styles.brandSubtitle}>SECURE ALBUM MANAGER 2026</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Email Input */}
        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Enter your email"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password Input */}
        <Text style={[styles.inputLabel, { marginTop: 16 }]}>PASSWORD</Text>
        <TextInput
          style={styles.inputField}
          placeholder="••••••••"
          placeholderTextColor="#475569"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#0ea5e9"
            style={{ marginTop: 32 }}
          />
        ) : (
          <View style={styles.actionsWrapper}>
            {/* Login Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
            >
              <Text style={styles.primaryButtonText}>SIGN IN</Text>
            </TouchableOpacity>

            {/* Create Account Link Component */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSignUp}
            >
              <Text style={styles.secondaryButtonText}>
                CREATE SECURE ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  brandWrapper: { alignItems: "center", marginBottom: 40 },
  brandTrophy: { fontSize: 44, marginBottom: 12 },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 10,
    color: "#0ea5e9",
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 1.5,
  },

  formContainer: {
    backgroundColor: "#1e293b",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  inputLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 14,
  },
  actionsWrapper: { marginTop: 24, gap: 12 },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../services/supabase";
import { loginStyles as styles } from "../styles/login.styles";

type LoginStep = "LOGIN" | "FORGOT_PASSWORD" | "RESET_PASSWORD";

export default function LoginScreen() {
  const [step, setStep] = useState<LoginStep>("LOGIN");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Completá todos los campos.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else router.replace("/");
  };

  const handleSignUp = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Completá todos los campos.");
    if (password.length < 6)
      return Alert.alert("Error", "Mínimo 6 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else
      Alert.alert("¡Cuenta Creada!", "Ya podés iniciar sesión con tus datos.");
  };

  const handleSendResetCode = async () => {
    if (!email)
      return Alert.alert("Error", "Ingresá tu correo para enviarte el código.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Código enviado",
        "Revisá tu correo. Te enviamos un código de 8 dígitos.",
      );
      setStep("RESET_PASSWORD");
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode || !password)
      return Alert.alert("Error", "Completá el código y tu nueva contraseña.");
    if (password.length < 6)
      return Alert.alert(
        "Error",
        "La nueva contraseña debe tener al menos 6 caracteres.",
      );

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "recovery",
    });

    if (error) {
      setLoading(false);
      return Alert.alert("Error", "Código inválido o expirado.");
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      Alert.alert("Error", "No se pudo guardar la nueva contraseña.");
    } else {
      Alert.alert("¡Éxito!", "Tu contraseña fue actualizada.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandWrapper}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.brandLogo}
        />
        <Text style={styles.brandTitle}>FIGURITAPP</Text>
        <Text style={styles.brandSubtitle}>
          {step === "LOGIN"
            ? "GESTOR SEGURO DEL ÁLBUM DEL MUNDIAL 2026"
            : "RECUPERACIÓN DE CUENTA"}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
        <TextInput
          style={styles.inputField}
          placeholder="tu@correo.com"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {step === "LOGIN" && (
          <>
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              CONTRASEÑA
            </Text>
            <View style={{ position: "relative", justifyContent: "center" }}>
              <TextInput
                style={[styles.inputField, { paddingRight: 40 }]} // Espacio extra a la derecha para que el texto no pise al ojito
                placeholder="••••••••"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword} // Acá está la magia
              />
              <TouchableOpacity
                style={{ position: "absolute", right: 12 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator
                size="small"
                color="#0ea5e9"
                style={{ marginTop: 32 }}
              />
            ) : (
              <View style={styles.actionsWrapper}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleLogin}
                >
                  <Text style={styles.primaryButtonText}>INICIAR SESIÓN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSignUp}
                >
                  <Text style={styles.secondaryButtonText}>CREAR CUENTA</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep("FORGOT_PASSWORD")}>
                  <Text style={styles.textLink}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {step === "FORGOT_PASSWORD" && (
          <View style={styles.actionsWrapper}>
            {loading ? (
              <ActivityIndicator size="small" color="#0ea5e9" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSendResetCode}
                >
                  <Text style={styles.primaryButtonText}>ENVIAR CÓDIGO</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep("LOGIN")}>
                  <Text style={styles.textLink}>Volver al inicio</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {step === "RESET_PASSWORD" && (
          <>
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              CÓDIGO DE 8 DÍGITOS
            </Text>
            <TextInput
              style={styles.inputField}
              placeholder="12345678"
              placeholderTextColor="#475569"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={8}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              NUEVA CONTRASEÑA
            </Text>
            <View style={{ position: "relative", justifyContent: "center" }}>
              <TextInput
                style={[styles.inputField, { paddingRight: 40 }]} // Espacio extra a la derecha para que el texto no pise al ojito
                placeholder="••••••••"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword} // Acá está la magia
              />
              <TouchableOpacity
                style={{ position: "absolute", right: 12 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.actionsWrapper}>
              {loading ? (
                <ActivityIndicator size="small" color="#0ea5e9" />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleResetPassword}
                  >
                    <Text style={styles.primaryButtonText}>
                      GUARDAR CONTRASEÑA
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setStep("LOGIN")}>
                    <Text style={styles.textLink}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
      </View>
      <Text style={styles.versionText}>
        v{Application.nativeApplicationVersion} (
        {Application.nativeBuildVersion}) — by [LP Bros] 💻 Cowabunga!
      </Text>
    </SafeAreaView>
  );
}

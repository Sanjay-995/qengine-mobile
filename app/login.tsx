import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useBackend } from "@/context/BackendContext";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  {
    icon: "zap" as const,
    title: "AI-native copilot",
    description: "Context-aware guidance throughout every run",
  },
  {
    icon: "activity" as const,
    title: "Real-time monitoring",
    description: "Live residuals, coefficients, and telemetrics",
  },
  {
    icon: "cpu" as const,
    title: "CFD & structural",
    description: "RANS, LES, FEA, thermal — one workspace",
  },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { connectionState } = useBackend();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await signIn(username, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    }
  };

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  const platformOnline = connectionState === "connected";
  const platformChecking = connectionState === "checking";

  const platformBadgeColor = platformOnline ? "#00C97A" : platformChecking ? "#00E5FF" : "#FF4D4D";
  const platformBadgeBg = platformOnline ? "#00C97A10" : platformChecking ? "#00E5FF10" : "#FF4D4D10";
  const platformBadgeBorder = platformOnline ? "#00C97A40" : platformChecking ? "#00E5FF40" : "#FF4D4D40";
  const platformLabel = platformOnline ? "PLATFORM ONLINE" : platformChecking ? "CONNECTING..." : "PLATFORM OFFLINE";

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: botPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={[styles.logoBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.logoLetter, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Q</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            QEngine<Text style={{ color: colors.primary }}>.ai</Text>
          </Text>
          <View style={[styles.versionBadge, { borderColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              V2.1.0
            </Text>
          </View>
        </View>

        <View style={[styles.platformBadge, { borderColor: platformBadgeBorder, backgroundColor: platformBadgeBg }]}>
          {platformChecking ? (
            <ActivityIndicator size={8} color={platformBadgeColor} style={{ width: 8, height: 8 }} />
          ) : (
            <View style={[styles.platformDot, { backgroundColor: platformBadgeColor }]} />
          )}
          <Text style={[styles.platformText, { color: platformBadgeColor, fontFamily: "Inter_500Medium" }]}>
            {platformLabel}
          </Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            The simulation{"\n"}workstation for{"\n"}
            <Text style={{ color: colors.primary }}>engineering teams</Text>
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Configure, run, and analyze high-fidelity simulations from one workspace — with an AI copilot that understands your setup.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Feather name={f.icon} size={14} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {f.title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {f.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Sign in to QEngine
          </Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Access your simulation workspace
          </Text>

          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Username
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: error ? "#FF4D4D" : colors.border,
                    color: colors.foreground,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
                placeholder="engineering-id"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={(t) => { setUsername(t); setError(""); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  Password
                </Text>
              </View>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: error ? "#FF4D4D" : colors.border,
                      color: colors.foreground,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleSignIn}
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setPasswordVisible((v) => !v)}
                >
                  <Feather
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color="#FF4D4D" />
                <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.signInBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.85 : 1,
                },
              ]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather name="terminal" size={15} color={colors.primaryForeground} />
                  <Text style={[styles.signInText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                    Sign In
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Feather name="lock" size={11} color={colors.mutedForeground} />
              <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Session encrypted · TLS 1.3
              </Text>
            </View>
            <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Redirects to workspace
            </Text>
          </View>
        </View>

        <Text style={[styles.domainText, { color: colors.mutedForeground + "80", fontFamily: "Inter_400Regular" }]}>
          qengine.ai
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 0,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  logoBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: 14,
  },
  brandName: {
    fontSize: 17,
    flex: 1,
  },
  versionBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  platformText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  heroSection: {
    gap: 10,
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 21,
  },
  features: {
    gap: 14,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 1,
  },
  featureTitle: {
    fontSize: 14,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    gap: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
  },
  formSub: {
    fontSize: 13,
    marginTop: -8,
  },
  fields: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    color: "#FF4D4D",
    fontSize: 12,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 6,
    paddingVertical: 13,
    marginTop: 2,
  },
  signInText: {
    fontSize: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -4,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  domainText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});

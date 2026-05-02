import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BackendProvider } from "@/context/BackendContext";
import { SimulationProvider } from "@/context/SimulationContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthRedirect() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const onLogin = segments[0] === "login";

    if (!isLoggedIn && inTabsGroup) {
      router.replace("/login");
    } else if (isLoggedIn && onLogin) {
      router.replace("/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isLoading, segments.join("/")]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: "#030810" }} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BackendProvider>
              <SimulationProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <StatusBar style="light" backgroundColor="#030810" />
                    <AuthRedirect />
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="login" options={{ headerShown: false }} />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="simulation/[id]"
                        options={{ headerShown: false, presentation: "card" }}
                      />
                    </Stack>
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </SimulationProvider>
            </BackendProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  dangerous?: boolean;
}

function Row({ icon, label, value, toggle, toggleValue, onToggle, onPress, dangerous }: RowProps) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, opacity: pressed && onPress ? 0.7 : 1 },
      ]}
      onPress={onPress}
      disabled={!onPress && !toggle}
    >
      <View style={styles.rowLeft}>
        <Feather name={icon as any} size={16} color={dangerous ? "#FF4D4D" : colors.primary} />
        <Text style={[styles.rowLabel, { color: dangerous ? "#FF4D4D" : colors.foreground, fontFamily: "Inter_400Regular" }]}>
          {label}
        </Text>
      </View>
      {toggle && onToggle !== undefined ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.secondary, true: colors.primary + "60" }}
          thumbColor={toggleValue ? colors.primary : colors.mutedForeground}
        />
      ) : value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {value}
        </Text>
      ) : onPress ? (
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const displayName = user?.full_name ?? user?.email ?? "Engineer";
  const initials = displayName.slice(0, 2).toUpperCase();
  const [notifRun, setNotifRun] = React.useState(true);
  const [notifConverge, setNotifConverge] = React.useState(true);
  const [notifFail, setNotifFail] = React.useState(true);
  const [autoRefresh, setAutoRefresh] = React.useState(false);

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        Settings
      </Text>

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {initials}
          </Text>
        </View>
        <View>
          <Text style={[styles.profileName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {displayName}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {user?.email ?? "workspace@qengine.ai"}
          </Text>
        </View>
        <View style={[styles.planBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.planText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>PRO</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader title="WORKSPACE" />
        <Row icon="server" label="API Endpoint" value="dev.demo.qengine.ai" />
        <Row icon="wifi" label="Connection" value="Connected" />
        <Row icon="refresh-cw" label="Auto Refresh" toggle toggleValue={autoRefresh} onToggle={setAutoRefresh} />
        <Row icon="cpu" label="Compute Region" value="US-West" />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader title="NOTIFICATIONS" />
        <Row icon="play" label="Simulation started" toggle toggleValue={notifRun} onToggle={setNotifRun} />
        <Row icon="check-circle" label="Converged" toggle toggleValue={notifConverge} onToggle={setNotifConverge} />
        <Row icon="alert-circle" label="Failed / Diverged" toggle toggleValue={notifFail} onToggle={setNotifFail} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader title="ABOUT" />
        <Row icon="info" label="Version" value="1.0.0" />
        <Row icon="book-open" label="Documentation" onPress={() => {}} />
        <Row icon="star" label="Rate App" onPress={() => {}} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader title="ACCOUNT" />
        <Row icon="log-out" label="Sign Out" onPress={handleSignOut} dangerous />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 26,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
  },
  profileName: {
    fontSize: 15,
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  planBadge: {
    marginLeft: "auto",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  section: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 10,
    letterSpacing: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 13,
  },
});

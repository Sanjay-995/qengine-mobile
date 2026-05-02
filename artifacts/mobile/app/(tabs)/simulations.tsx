import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SimulationCard } from "@/components/SimulationCard";
import { useSimulations } from "@/context/SimulationContext";
import { SimStatus } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | SimStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "ALL", value: "all" },
  { label: "RUNNING", value: "running" },
  { label: "CONVERGED", value: "converged" },
  { label: "FAILED", value: "failed" },
  { label: "QUEUED", value: "queued" },
];

const FILTER_COLORS: Record<Filter, string> = {
  all: "#00E5FF",
  running: "#00E5FF",
  converged: "#00C97A",
  failed: "#FF4D4D",
  queued: "#8A9AAB",
};

export default function SimulationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { simulations } = useSimulations();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const filtered = useMemo(() => {
    return simulations.filter((s) => {
      const matchesFilter = filter === "all" || s.status === filter;
      const matchesSearch =
        search.trim() === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.solver.toLowerCase().includes(search.toLowerCase()) ||
        s.type.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [simulations, filter, search]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topPad + 16 }}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Simulations
          </Text>
          <Text style={[styles.pageCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {filtered.length} of {simulations.length}
          </Text>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Search simulations..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = filter === item.value;
            const accent = FILTER_COLORS[item.value];
            return (
              <Pressable
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? accent + "20" : colors.card,
                    borderColor: isActive ? accent + "60" : colors.border,
                  },
                ]}
                onPress={() => setFilter(item.value)}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    {
                      color: isActive ? accent : colors.mutedForeground,
                      fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="activity" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No simulations found
            </Text>
          </View>
        }
        renderItem={({ item }) => <SimulationCard simulation={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 26,
  },
  pageCount: {
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 40,
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
  },
});

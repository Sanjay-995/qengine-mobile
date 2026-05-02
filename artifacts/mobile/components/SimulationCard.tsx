import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Simulation } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "./StatusBadge";

interface Props {
  simulation: Simulation;
}

function ProgressBar({ value, max, color, trackColor }: { value: number; max: number; color: string; trackColor: string }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export function SimulationCard({ simulation }: Props) {
  const colors = useColors();
  const progressColor = simulation.status === "failed" ? "#FF4D4D" : simulation.status === "converged" ? "#00C97A" : "#00E5FF";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={() => router.push(`/simulation/${simulation.id}` as any)}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {simulation.name}
          </Text>
          <Text style={[styles.preset, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {simulation.type} · {simulation.solver}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <StatusBadge status={simulation.status} small />
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </View>

      <View style={styles.progress}>
        <ProgressBar value={simulation.iterations} max={simulation.maxIterations} color={progressColor} trackColor={colors.border} />
        <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {simulation.iterations.toLocaleString()} / {simulation.maxIterations.toLocaleString()} iter
        </Text>
      </View>

      <View style={styles.metrics}>
        {simulation.residual !== null && (
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>RESIDUAL</Text>
            <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              {simulation.residual.toExponential(2)}
            </Text>
          </View>
        )}
        {simulation.dragCoefficient !== null && (
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Cd</Text>
            <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              {simulation.dragCoefficient.toFixed(4)}
            </Text>
          </View>
        )}
        {simulation.reynoldsNumber !== null && (
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Re</Text>
            <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              {simulation.reynoldsNumber >= 1e6
                ? `${(simulation.reynoldsNumber / 1e6).toFixed(1)}M`
                : `${(simulation.reynoldsNumber / 1e3).toFixed(0)}k`}
            </Text>
          </View>
        )}
        {simulation.computeTimeMin !== null && (
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>TIME</Text>
            <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              {simulation.computeTimeMin >= 60
                ? `${Math.floor(simulation.computeTimeMin / 60)}h ${simulation.computeTimeMin % 60}m`
                : `${simulation.computeTimeMin}m`}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 15,
  },
  preset: {
    fontSize: 12,
  },
  progress: {
    gap: 5,
  },
  progressTrack: {
    height: 2,
    backgroundColor: "#0D2035",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1,
  },
  progressLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  metrics: {
    flexDirection: "row",
    gap: 16,
  },
  metric: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 13,
  },
});

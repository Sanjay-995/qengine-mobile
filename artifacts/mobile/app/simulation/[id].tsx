import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResidualChart } from "@/components/ResidualChart";
import { StatusBadge } from "@/components/StatusBadge";
import { useSimulations } from "@/context/SimulationContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLOR: Record<string, string> = {
  running: "#00E5FF",
  converged: "#00C97A",
  failed: "#FF4D4D",
  queued: "#8A9AAB",
};

function MetricCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.metricUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{unit}</Text>
        )}
      </View>
    </View>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.configRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.configLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <Text style={[styles.configValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
        {value}
      </Text>
    </View>
  );
}

function ValidationItem({ label, ok }: { label: string; ok: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.validRow}>
      <Feather
        name={ok ? "check-circle" : "x-circle"}
        size={13}
        color={ok ? "#00C97A" : "#FF4D4D"}
      />
      <Text style={[styles.validLabel, { color: ok ? colors.foreground : "#FF4D4D", fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
    </View>
  );
}

export default function SimulationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getSimulation } = useSimulations();
  const sim = getSimulation(id ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!sim) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Simulation not found</Text>
      </View>
    );
  }

  const accentColor = STATUS_COLOR[sim.status] ?? colors.primary;
  const progress = Math.min(sim.iterations / sim.maxIterations, 1);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {sim.type}
        </Text>
      </View>

      <View style={styles.heroSection}>
        <Text style={[styles.simName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {sim.name}
        </Text>
        <Text style={[styles.simPreset, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {sim.preset} · {sim.solver}
        </Text>
        <View style={styles.statusRow}>
          <StatusBadge status={sim.status} />
          {sim.reynoldsNumber && (
            <View style={[styles.reBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.reBadgeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Re {sim.reynoldsNumber >= 1e6 ? `${(sim.reynoldsNumber / 1e6).toFixed(1)}M` : `${(sim.reynoldsNumber / 1e3).toFixed(0)}k`}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressIterLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              ITERATIONS
            </Text>
            <Text style={[styles.progressIterValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {sim.iterations.toLocaleString()} / {sim.maxIterations.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: accentColor }]} />
          </View>
          <Text style={[styles.progressPct, { color: accentColor, fontFamily: "Inter_500Medium" }]}>
            {Math.round(progress * 100)}% complete
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>PERFORMANCE METRICS</Text>
        </View>
        <View style={styles.metricGrid}>
          {sim.residual !== null && (
            <MetricCard label="RESIDUAL" value={sim.residual.toExponential(2)} />
          )}
          {sim.dragCoefficient !== null && (
            <MetricCard label="Cd" value={sim.dragCoefficient.toFixed(4)} />
          )}
          {sim.liftCoefficient !== null && (
            <MetricCard label="CL" value={sim.liftCoefficient.toFixed(4)} />
          )}
          {sim.strouhalNumber !== null && (
            <MetricCard label="St" value={sim.strouhalNumber.toFixed(3)} />
          )}
          {sim.computeTimeMin !== null && (
            <MetricCard
              label="COMPUTE"
              value={sim.computeTimeMin >= 60 ? `${Math.floor(sim.computeTimeMin / 60)}h ${sim.computeTimeMin % 60}m` : `${sim.computeTimeMin}m`}
            />
          )}
          {sim.gridSize && (
            <MetricCard label="GRID SIZE" value={sim.gridSize.split(" ")[0] ?? "—"} unit={sim.gridSize.includes("(") ? sim.gridSize.split("(")[1]?.replace(")", "") : undefined} />
          )}
        </View>
      </View>

      {sim.residualHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>RESIDUAL HISTORY</Text>
          </View>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ResidualChart data={sim.residualHistory} color={accentColor} height={90} />
            <Text style={[styles.chartCaption, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Log scale · {sim.residualHistory.length} data points
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>CONFIGURATION</Text>
        </View>
        <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ConfigRow label="Solver" value={sim.solver} />
          <ConfigRow label="Grid" value={sim.gridSize} />
          {sim.domainWidth !== null && <ConfigRow label="Domain Width" value={`${sim.domainWidth} m`} />}
          {sim.domainHeight !== null && <ConfigRow label="Domain Height" value={`${sim.domainHeight} m`} />}
          {sim.inletVelocity !== null && <ConfigRow label="Inlet Velocity" value={`${sim.inletVelocity} m/s`} />}
          {sim.reynoldsNumber !== null && <ConfigRow label="Reynolds No." value={sim.reynoldsNumber.toLocaleString()} />}
        </View>
      </View>

      {sim.validation && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>VALIDATION</Text>
          </View>
          <View style={[styles.validCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ValidationItem label="Mesh topology" ok={sim.validation.meshTopology} />
            <ValidationItem label={`Boundary conditions (5/5)`} ok={sim.validation.boundaryConditions} />
            <ValidationItem label="CFL stable" ok={sim.validation.cflStable} />
            <ValidationItem label="Solver compatible" ok={sim.validation.solverCompatible} />
            <ValidationItem label="Memory within limit" ok={sim.validation.memoryOk} />
          </View>
        </View>
      )}

      {sim.aiAnalysis && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>QENGINE AI ANALYSIS</Text>
          </View>
          <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.primary + "30" }]}>
            <View style={styles.aiCardHeader}>
              <View style={[styles.aiAvatarSmall, { borderColor: colors.primary + "40" }]}>
                <Text style={[styles.aiAvatarLetter, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Q</Text>
              </View>
              <Text style={[styles.aiLabel, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>QENGINE AI</Text>
            </View>
            <Text style={[styles.aiText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
              {sim.aiAnalysis}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    fontSize: 16,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 5,
  },
  simName: {
    fontSize: 24,
    lineHeight: 30,
  },
  simPreset: {
    fontSize: 13,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  reBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHead: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressIterLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  progressIterValue: {
    fontSize: 13,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  progressPct: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    minWidth: "30%",
    flex: 1,
    gap: 3,
  },
  metricLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  metricValue: {
    fontSize: 15,
  },
  metricUnit: {
    fontSize: 10,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  chartCaption: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  configCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  configLabel: {
    fontSize: 13,
  },
  configValue: {
    fontSize: 13,
  },
  validCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  validRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  validLabel: {
    fontSize: 13,
  },
  aiCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiAvatarSmall: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarLetter: {
    fontSize: 11,
  },
  aiLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  aiText: {
    fontSize: 13,
    lineHeight: 19,
  },
});

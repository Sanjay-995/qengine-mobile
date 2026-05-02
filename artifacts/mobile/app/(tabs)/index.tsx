import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  FlatList,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MeshVisualization, ObjectType, SimStatus } from "@/components/MeshVisualization";
import { useBackend } from "@/context/BackendContext";
import { useColors } from "@/hooks/useColors";

type Preset = "Cylinder Wake" | "NACA 0012" | "Ahmed Body";
type InnerTab = "GEO" | "SOLVER" | "LIVE VIEW" | "LOG";

interface PresetConfig {
  objectType: ObjectType;
  meshLX: number;
  meshLY: number;
  inletVelocity: string;
  re: string;
  solver: string;
  cellCount: number;
  maxIter: number;
  residualTarget: string;
  cfl: string;
}

const PRESETS: Record<Preset, PresetConfig> = {
  "Cylinder Wake": {
    objectType: "cylinder",
    meshLX: 10,
    meshLY: 9,
    inletVelocity: "1.0",
    re: "500",
    solver: "Laminar",
    cellCount: 524288,
    maxIter: 500,
    residualTarget: "1e-5",
    cfl: "0.3",
  },
  "NACA 0012": {
    objectType: "airfoil",
    meshLX: 11,
    meshLY: 10,
    inletVelocity: "45.0",
    re: "3000000",
    solver: "RANS k-ω SST",
    cellCount: 1048576,
    maxIter: 3000,
    residualTarget: "1e-6",
    cfl: "0.8",
  },
  "Ahmed Body": {
    objectType: "ahmed",
    meshLX: 12,
    meshLY: 11,
    inletVelocity: "60.0",
    re: "4200000",
    solver: "DES",
    cellCount: 4194304,
    maxIter: 5000,
    residualTarget: "1e-5",
    cfl: "0.5",
  },
};

const SOLVERS = ["Laminar", "RANS k-ω SST", "RANS k-ε", "LES", "DES"];
const OBJECTS: Array<{ label: string; value: ObjectType }> = [
  { label: "Cylinder", value: "cylinder" },
  { label: "Airfoil", value: "airfoil" },
  { label: "Ahmed Body", value: "ahmed" },
];

function formatCellCount(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return `${n}`;
}

function ConfigRow({
  label,
  value,
  onChangeText,
  keyboardType,
  editable = true,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  keyboardType?: "numeric" | "default";
  editable?: boolean;
  suffix?: string;
  accent?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[cfgStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[cfgStyles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {label}
      </Text>
      <View style={cfgStyles.valueRow}>
        <TextInput
          style={[
            cfgStyles.input,
            {
              color: accent ? colors.primary : colors.foreground,
              fontFamily: "Inter_500Medium",
              opacity: editable ? 1 : 0.7,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          editable={editable && !!onChangeText}
          keyboardType={keyboardType ?? "default"}
          selectTextOnFocus
        />
        {suffix && (
          <Text style={[cfgStyles.suffix, { color: colors.mutedForeground }]}>{suffix}</Text>
        )}
      </View>
    </View>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const colors = useColors();
  return (
    <View>
      <Pressable
        style={[cfgStyles.sectionHeader, { borderBottomColor: colors.border, borderTopColor: colors.border }]}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={[cfgStyles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {title}
        </Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
      </Pressable>
      {open && children}
    </View>
  );
}

const cfgStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 12,
    flex: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  input: {
    fontSize: 13,
    textAlign: "right",
    minWidth: 70,
    padding: 0,
  },
  suffix: {
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
});

export default function SimulatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { connectionState, latencyMs } = useBackend();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  // Tab bar heights: web 84px (explicitly set), iOS 49pt standard, Android 56dp standard.
  // We need enough paddingBottom so the action bar buttons sit fully above the floating tab bar.
  const TAB_BAR_H = Platform.OS === "web" ? 84 : Platform.OS === "ios" ? 49 : 56;
  const actionBarPad = insets.bottom + TAB_BAR_H + 8;

  const [preset, setPreset] = useState<Preset>("Cylinder Wake");
  const [showPresets, setShowPresets] = useState(false);
  const [innerTab, setInnerTab] = useState<InnerTab>("GEO");
  const [simStatus, setSimStatus] = useState<SimStatus>("idle");
  const [config, setConfig] = useState<PresetConfig>(PRESETS["Cylinder Wake"]);
  const [logLines, setLogLines] = useState<string[]>(["Waiting for worker output..."]);
  const [iteration, setIteration] = useState(0);
  const [residual, setResidual] = useState(0);
  const [viewSize, setViewSize] = useState({ width: 300, height: 180 });
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Ask anything about your simulation…" },
  ]);

  const runIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(0);
  };

  const selectPreset = (p: Preset) => {
    setPreset(p);
    setConfig(PRESETS[p]);
    setShowPresets(false);
    setSimStatus("idle");
    setIteration(0);
    setResidual(0);
    setLogLines(["Waiting for worker output..."]);
    if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    stopPulse();
  };

  const runSimulation = useCallback(() => {
    if (simStatus === "running") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSimStatus("running");
    setInnerTab("LOG");
    setIteration(0);
    setResidual(0.5);
    startPulse();
    const startLogs = [
      `Initializing solver: ${config.solver}`,
      `Loading mesh: ${config.meshLX}x${config.meshLY} (${formatCellCount(config.cellCount)} cells)`,
      `Setting up boundary conditions...`,
      `Inlet velocity: ${config.inletVelocity} m/s, Re: ${Number(config.re).toLocaleString()}`,
      `Starting solver iterations...`,
    ];
    setLogLines(startLogs);

    let iter = 0;
    let res = 0.5;
    const maxIter = config.maxIter;

    runIntervalRef.current = setInterval(() => {
      iter += Math.floor(Math.max(1, maxIter / 80) * (0.8 + Math.random() * 0.4));
      res = res * (0.85 + Math.random() * 0.08);
      const cfl = (parseFloat(config.cfl) * (0.9 + Math.random() * 0.2)).toFixed(2);
      const cd = (0.3 + Math.random() * 0.3).toFixed(4);

      setIteration(Math.min(iter, maxIter));
      setResidual(res);

      const newLine = `Iter ${Math.min(iter, maxIter)}: res=${res.toExponential(2)}, CFL=${cfl}, Cd=${cd}`;
      setLogLines((prev) => [...prev, newLine]);

      if (iter >= maxIter || res < 1e-5) {
        clearInterval(runIntervalRef.current!);
        stopPulse();
        setLogLines((prev) => [
          ...prev,
          `Convergence achieved at iter ${Math.min(iter, maxIter)}: final res=${res.toExponential(2)}`,
          `Simulation complete. Results saved.`,
        ]);
        setSimStatus("converged");
        setInnerTab("LIVE VIEW");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 400);
  }, [config, simStatus]);

  const resetSimulation = () => {
    if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    stopPulse();
    setSimStatus("idle");
    setIteration(0);
    setResidual(0);
    setLogLines(["Waiting for worker output..."]);
    setInnerTab("GEO");
  };

  useEffect(() => {
    return () => {
      if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    };
  }, []);

  const handleAiSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAiMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      let reply = "I'm analyzing your simulation parameters. Everything looks nominal for the current configuration.";
      if (lower.includes("mesh") || lower.includes("grid")) {
        reply = `Your current mesh is ${config.meshLX}×${config.meshLY} (${formatCellCount(config.cellCount)} cells). This resolution is appropriate for ${config.solver} simulations at Re=${config.re}.`;
      } else if (lower.includes("solver") || lower.includes("cfl")) {
        reply = `Using ${config.solver} with CFL=${config.cfl} and residual target ${config.residualTarget}. This combination is well-suited for the current flow regime.`;
      } else if (lower.includes("run") || lower.includes("status") || lower.includes("converge")) {
        reply = simStatus === "idle"
          ? "Press RUN SIMULATION to start. I'll monitor convergence and alert you to any issues."
          : simStatus === "running"
          ? `Simulation running at iter ${iteration}, res=${residual.toExponential(2)}. Convergence on track.`
          : "Simulation converged. Results are ready for post-processing.";
      }
      setAiMessages((prev) => [...prev, { role: "ai", text: reply }]);
    }, 800);
  }, [config, simStatus, iteration, residual]);

  const sendAiMessage = () => {
    const text = aiInput.trim();
    if (!text) return;
    setAiInput("");
    handleAiSend(text);
  };

  const onViewLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setViewSize({ width, height });
  };

  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const runBtnColor = simStatus === "running" ? colors.muted : colors.primary;
  const runBtnTextColor = simStatus === "running" ? colors.mutedForeground : colors.primaryForeground;

  const INNER_TABS: InnerTab[] = ["GEO", "SOLVER", "LIVE VIEW", "LOG"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.logoLetter, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Q</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              SIMULATOR
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[
            styles.sessionBadge,
            { borderColor: simStatus === "running" ? "#00E5FF40" : "#00C97A40", backgroundColor: simStatus === "running" ? "#00E5FF10" : "#00C97A10" },
          ]}>
            <Animated.View style={[styles.sessionDot, { backgroundColor: simStatus === "running" ? colors.primary : "#00C97A", opacity: simStatus === "running" ? pulseOpacity : 1 }]} />
            <Text style={[styles.sessionText, { color: simStatus === "running" ? colors.primary : "#00C97A", fontFamily: "Inter_500Medium" }]}>
              {simStatus === "running" ? "SOLVING" : "ACTIVE"}
            </Text>
          </View>
          <View style={[
            styles.backendChip,
            {
              borderColor: connectionState === "connected" ? "#00C97A40" : connectionState === "checking" ? "#00E5FF30" : "#FF4D4D40",
              backgroundColor: connectionState === "connected" ? "#00C97A08" : connectionState === "checking" ? "#00E5FF08" : "#FF4D4D08",
            },
          ]}>
            <View style={[styles.backendDot, {
              backgroundColor: connectionState === "connected" ? "#00C97A" : connectionState === "checking" ? colors.primary : "#FF4D4D",
            }]} />
            <Text style={[styles.backendLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>BACKEND</Text>
            <Text style={[styles.backendType, {
              color: connectionState === "connected" ? colors.foreground : connectionState === "checking" ? colors.mutedForeground : "#FF4D4D",
              fontFamily: "Inter_500Medium",
            }]}>
              {connectionState === "connected"
                ? "AWS EC2"
                : connectionState === "checking"
                ? "..."
                : "OFFLINE"}
            </Text>
            {connectionState === "connected" && latencyMs !== null && (
              <Text style={[styles.backendLatency, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {latencyMs}ms
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Preset selector */}
      <View style={[styles.presetBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.presetLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>PRESET</Text>
        <Pressable
          style={[styles.presetBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowPresets((v) => !v)}
        >
          <Text style={[styles.presetBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            {preset}
          </Text>
          <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {showPresets && (
        <View style={[styles.presetDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(Object.keys(PRESETS) as Preset[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.presetOption, { borderBottomColor: colors.border }]}
              onPress={() => selectPreset(p)}
            >
              <Text style={[styles.presetOptionText, { color: p === preset ? colors.primary : colors.foreground, fontFamily: p === preset ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {p}
              </Text>
              {p === preset && <Feather name="check" size={13} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      {/* Inner tab bar */}
      <View style={[styles.innerTabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {INNER_TABS.map((tab) => {
          const active = innerTab === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.innerTab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setInnerTab(tab)}
            >
              <Text style={[styles.innerTabText, { color: active ? colors.primary : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {/* GEO tab */}
        {innerTab === "GEO" && (
          <ScrollView style={[styles.tabContent, { backgroundColor: colors.card }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            <ConfigRow
              label="Object / Primitive"
              value={OBJECTS.find((o) => o.value === config.objectType)?.label ?? "Cylinder"}
              editable={false}
            />
            <ConfigRow
              label={`Mesh LX (log₂)`}
              value={`${config.meshLX} (${Math.pow(2, config.meshLX).toLocaleString()} cells)`}
              editable={false}
            />
            <ConfigRow
              label={`Mesh LY (log₂)`}
              value={`${config.meshLY} (${Math.pow(2, config.meshLY).toLocaleString()} cells)`}
              editable={false}
            />
            <ConfigRow
              label="Cell Count"
              value={formatCellCount(config.cellCount)}
              editable={false}
              accent
            />
            <ConfigRow
              label="Inlet Velocity"
              value={config.inletVelocity}
              onChangeText={(t) => setConfig((c) => ({ ...c, inletVelocity: t }))}
              keyboardType="numeric"
              suffix="m/s"
            />
            <ConfigRow
              label="Re (computed)"
              value={Number(config.re).toLocaleString()}
              editable={false}
              accent
            />

            <CollapsibleSection title="DOMAIN SETUP">
              <ConfigRow label="Domain Type" value="Structured Grid" editable={false} />
              <ConfigRow label="Width (m)" value="4.0" />
              <ConfigRow label="Height (m)" value="2.5" />
            </CollapsibleSection>

            <CollapsibleSection title="OBJECT POSITION">
              <ConfigRow label="X Offset (m)" value="1.0" />
              <ConfigRow label="Y Offset (m)" value="1.25" />
              <ConfigRow label="Radius / Scale" value="50 mm" />
            </CollapsibleSection>

            <CollapsibleSection title="BOUNDARY CONDITIONS">
              <ConfigRow label="Inlet" value="Velocity Inlet" editable={false} />
              <ConfigRow label="Outlet" value="Pressure Outlet" editable={false} />
              <ConfigRow label="Top / Bottom" value="Symmetry" editable={false} />
              <ConfigRow label="Object" value="No-slip Wall" editable={false} />
            </CollapsibleSection>

            <CollapsibleSection title="FLOW PHYSICS">
              <ConfigRow label="Model" value={config.solver} editable={false} />
              <ConfigRow label="Density (kg/m³)" value="1.225" />
              <ConfigRow label="Viscosity (Pa·s)" value="1.81e-5" />
              <ConfigRow label="AoA (°)" value="0" />
            </CollapsibleSection>
          </ScrollView>
        )}

        {/* SOLVER tab */}
        {innerTab === "SOLVER" && (
          <ScrollView style={[styles.tabContent, { backgroundColor: colors.card }]} showsVerticalScrollIndicator={false}>
            <ConfigRow label="Solver" value={config.solver} editable={false} />
            <ConfigRow label="Max Iterations" value={`${config.maxIter.toLocaleString()}`} />
            <ConfigRow label="Residual Target" value={config.residualTarget} />
            <ConfigRow label="CFL Number" value={config.cfl} onChangeText={(t) => setConfig((c) => ({ ...c, cfl: t }))} keyboardType="numeric" />
            <ConfigRow label="Time Stepping" value="Steady" editable={false} />
            <ConfigRow label="Pressure Scheme" value="SIMPLE" editable={false} />
            <ConfigRow label="Gradient Scheme" value="Green-Gauss" editable={false} />
            <ConfigRow label="Relaxation ρ" value="0.3" />
            <ConfigRow label="Relaxation U" value="0.7" />
          </ScrollView>
        )}

        {/* LIVE VIEW tab */}
        {innerTab === "LIVE VIEW" && (
          <View style={[styles.tabContent, { backgroundColor: colors.background }]}>
            <View style={styles.liveViewArea} onLayout={onViewLayout}>
              {viewSize.width > 10 && (
                <MeshVisualization
                  width={viewSize.width}
                  height={viewSize.height}
                  objectType={config.objectType}
                  status={simStatus}
                  meshLX={config.meshLX}
                  meshLY={config.meshLY}
                />
              )}
            </View>
            {simStatus !== "idle" && (
              <View style={[styles.metricsRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <MetricChip label="ITER" value={iteration.toLocaleString()} colors={colors} />
                <MetricChip label="RES" value={residual > 0 ? residual.toExponential(1) : "—"} colors={colors} />
                <MetricChip label="CFL" value={config.cfl} colors={colors} />
                <MetricChip label="Re" value={Number(config.re) >= 1e6 ? `${(Number(config.re) / 1e6).toFixed(1)}M` : `${(Number(config.re) / 1e3).toFixed(0)}k`} colors={colors} />
              </View>
            )}
          </View>
        )}

        {/* LOG tab */}
        {innerTab === "LOG" && (
          <View style={[styles.tabContent, { backgroundColor: "#020810" }]}>
            <View style={[styles.logHeader, { borderBottomColor: colors.border }]}>
              <Feather name="terminal" size={12} color={colors.mutedForeground} />
              <Text style={[styles.logHeaderText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                SOLVER LOG
              </Text>
              <Text style={[styles.logLines, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {logLines.length} lines
              </Text>
            </View>
            <FlatList
              ref={logListRef}
              data={logLines}
              keyExtractor={(_, i) => `${i}`}
              style={styles.logList}
              contentContainerStyle={{ padding: 10, gap: 3 }}
              onContentSizeChange={() => logListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item, index }) => (
                <Text
                  key={index}
                  style={[
                    styles.logLine,
                    {
                      color: item.includes("Convergence") || item.includes("complete") ? "#00C97A" : item.includes("Waiting") ? colors.mutedForeground : colors.foreground,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  {item}
                </Text>
              )}
            />
          </View>
        )}
      </View>

      {/* AI Quick Panel */}
      <View style={[styles.aiPanel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.aiHeader}>
          <View style={[styles.aiDot, { backgroundColor: "#00C97A" }]} />
          <Text style={[styles.aiTitle, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>QENGINE AI</Text>
          <Text style={[styles.aiSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>· ask anything</Text>
        </View>
        {aiMessages.length > 0 && (
          <Text style={[styles.aiLastMsg, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
            {aiMessages[aiMessages.length - 1].text}
          </Text>
        )}
        <View style={styles.aiSuggestions}>
          {["Optimize setup", "Explain solver", "Check BCs"].map((s) => (
            <Pressable
              key={s}
              style={[styles.aiSuggestion, { borderColor: colors.border, backgroundColor: colors.secondary }]}
              onPress={() => handleAiSend(s)}
            >
              <Text style={[styles.aiSuggestionText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.aiInputRow}>
          <TextInput
            style={[styles.aiInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, fontFamily: "Inter_400Regular" }]}
            placeholder="Ask about setup, solver, mesh…"
            placeholderTextColor={colors.mutedForeground}
            value={aiInput}
            onChangeText={setAiInput}
            onSubmitEditing={sendAiMessage}
            returnKeyType="send"
          />
          <Pressable style={[styles.aiSendBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={sendAiMessage}>
            <Text style={[styles.aiSendText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Send</Text>
          </Pressable>
        </View>
      </View>

      {/* Status strip — sits above the action bar */}
      <View style={[styles.statusStrip, { backgroundColor: "#020810", borderTopColor: colors.border }]}>
        <Text style={[styles.statusText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {simStatus === "idle" ? "IDLE" : simStatus === "running" ? "RUNNING" : simStatus === "converged" ? "COMPLETE" : "FAILED"}
          {"  "}N {residual > 0 ? residual.toExponential(1) : "6.0e-4"}
          {"  "}CFL {config.cfl}
          {"  "}RE {Number(config.re) >= 1e6 ? `${(Number(config.re) / 1e6).toFixed(1)}M` : Number(config.re) >= 1e3 ? `${(Number(config.re) / 1e3).toFixed(0)}k` : config.re}
          {"  "}GRID {Math.pow(2, config.meshLX)}×{Math.pow(2, config.meshLY)}
          {"  "}SOLVER {config.solver}
        </Text>
      </View>

      {/* Action bar — last element, paddingBottom clears the floating tab bar on every platform */}
      <View style={[styles.actionBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: actionBarPad }]}>
        <Pressable
          style={[styles.runBtn, { backgroundColor: simStatus === "running" ? colors.muted : colors.primary, opacity: simStatus === "running" ? 0.7 : 1 }]}
          onPress={runSimulation}
          disabled={simStatus === "running"}
        >
          <Feather name="play" size={13} color={simStatus === "running" ? colors.mutedForeground : colors.primaryForeground} />
          <Text style={[styles.runBtnText, { color: simStatus === "running" ? colors.mutedForeground : colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
            {simStatus === "running" ? "SOLVING..." : "RUN SIMULATION"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Feather name="check-circle" size={13} color={colors.mutedForeground} />
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>VALIDATE</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={resetSimulation}
        >
          <Feather name="rotate-ccw" size={13} color={colors.mutedForeground} />
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>RESET</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MetricChip({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={[chipStyles.label, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[chipStyles.value, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{value}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: { alignItems: "center", gap: 1, flex: 1 },
  label: { fontSize: 8, letterSpacing: 0.5 },
  value: { fontSize: 12 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 4, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  logoLetter: { fontSize: 11 },
  headerTitle: { fontSize: 12, letterSpacing: 0.8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  sessionBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  sessionDot: { width: 5, height: 5, borderRadius: 2.5 },
  sessionText: { fontSize: 9, letterSpacing: 0.6 },
  backendChip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  backendDot: { width: 5, height: 5, borderRadius: 2.5 },
  backendLabel: { fontSize: 8, letterSpacing: 0.6 },
  backendType: { fontSize: 9 },
  backendLatency: { fontSize: 8 },
  presetBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, gap: 10, borderBottomWidth: 1 },
  presetLabel: { fontSize: 10, letterSpacing: 0.8 },
  presetBtn: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  presetBtnText: { fontSize: 13 },
  presetDropdown: { position: "absolute", top: 120, left: 14, right: 14, zIndex: 100, borderWidth: 1, borderRadius: 6, overflow: "hidden" },
  presetOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  presetOptionText: { fontSize: 14 },
  innerTabBar: { flexDirection: "row", borderBottomWidth: 1 },
  innerTab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  innerTabText: { fontSize: 10, letterSpacing: 0.5 },
  tabContent: { flex: 1 },
  liveViewArea: { flex: 1 },
  metricsRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 8, paddingHorizontal: 8 },
  logHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  logHeaderText: { fontSize: 10, letterSpacing: 0.8, flex: 1 },
  logLines: { fontSize: 10 },
  logList: { flex: 1 },
  logLine: { fontSize: 11, lineHeight: 16 },
  aiPanel: { borderTopWidth: 1, padding: 10, gap: 6 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  aiDot: { width: 5, height: 5, borderRadius: 2.5 },
  aiTitle: { fontSize: 11, letterSpacing: 0.4 },
  aiSubtitle: { fontSize: 11 },
  aiLastMsg: { fontSize: 11, lineHeight: 15 },
  aiSuggestions: { flexDirection: "row", gap: 5 },
  aiSuggestion: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 4 },
  aiSuggestionText: { fontSize: 10 },
  aiInputRow: { flexDirection: "row", gap: 6 },
  aiInput: { flex: 1, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12 },
  aiSendBtn: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, justifyContent: "center" },
  aiSendText: { fontSize: 11 },
  actionBar: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 8, borderTopWidth: 1 },
  runBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 5, paddingVertical: 10 },
  runBtnText: { fontSize: 12, letterSpacing: 0.3 },
  secondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1, borderRadius: 5, paddingVertical: 9 },
  secondaryBtnText: { fontSize: 10, letterSpacing: 0.3 },
  statusStrip: { paddingHorizontal: 14, paddingVertical: 5, borderTopWidth: 1 },
  statusText: { fontSize: 9, letterSpacing: 0.4 },
});

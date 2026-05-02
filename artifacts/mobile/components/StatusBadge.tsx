import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SimStatus } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";

const STATUS_LABEL: Record<SimStatus, string> = {
  running: "RUNNING",
  converged: "CONVERGED",
  failed: "FAILED",
  queued: "QUEUED",
};

const STATUS_COLOR: Record<SimStatus, string> = {
  running: "#00E5FF",
  converged: "#00C97A",
  failed: "#FF4D4D",
  queued: "#8A9AAB",
};

interface Props {
  status: SimStatus;
  small?: boolean;
}

export function StatusBadge({ status, small }: Props) {
  const colors = useColors();
  const color = STATUS_COLOR[status];
  const label = STATUS_LABEL[status];

  return (
    <View
      style={[
        styles.badge,
        { borderColor: color + "40", backgroundColor: color + "15" },
        small && styles.small,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: status === "running" ? color : color }, small && styles.dotSmall]} />
      <Text
        style={[
          styles.label,
          { color, fontFamily: "Inter_500Medium" },
          small && styles.labelSmall,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  labelSmall: {
    fontSize: 9,
  },
});

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  data: number[];
  color?: string;
  height?: number;
}

export function ResidualChart({ data, color = "#00E5FF", height = 80 }: Props) {
  const colors = useColors();

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data yet</Text>
      </View>
    );
  }

  const logData = data.map((v) => Math.log10(Math.max(v, 1e-12)));
  const minLog = Math.min(...logData);
  const maxLog = Math.max(...logData);
  const range = maxLog - minLog || 1;

  const normalizedHeights = logData.map((v) => {
    return ((v - minLog) / range) * (height - 16);
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.chartArea, { height }]}>
        {normalizedHeights.map((barH, i) => {
          const isLast = i === normalizedHeights.length - 1;
          const barColor = isLast ? color : color + "80";
          return (
            <View key={i} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barH, 2),
                    backgroundColor: barColor,
                    width: isLast ? 4 : 3,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {Math.pow(10, maxLog).toExponential(0)}
        </Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {Math.pow(10, minLog).toExponential(0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  chartArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    paddingBottom: 0,
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    borderRadius: 1,
  },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
  },
  labels: {
    justifyContent: "space-between",
    paddingLeft: 6,
    paddingBottom: 0,
    alignSelf: "stretch",
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
});

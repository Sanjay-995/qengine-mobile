import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

export type ObjectType = "cylinder" | "airfoil" | "ahmed";
export type SimStatus = "idle" | "running" | "converged" | "failed";

interface Props {
  width: number;
  height: number;
  objectType: ObjectType;
  status: SimStatus;
  meshLX: number;
  meshLY: number;
}

const COLORS = {
  bg: "#050D1A",
  grid: "#0D2535",
  border: "#0D3A55",
  inlet: "#00E5FF",
  symmetry: "#1A4060",
  object: "#0A2030",
  objectBorder: "#1E5570",
  runningGlow: "#00E5FF",
  convergedWake1: "#FF6B00",
  convergedWake2: "#FFB800",
  convergedBody: "#00C97A",
  label: "#3A6A85",
  flow: "#00E5FF",
};

function GridLines({ width, height, cols, rows }: { width: number; height: number; cols: number; rows: number }) {
  const lines: React.ReactElement[] = [];
  const insetX = 32;
  const insetY = 16;
  const w = width - insetX;
  const h = height - insetY * 2;

  for (let i = 0; i <= cols; i++) {
    const x = insetX + (i / cols) * w;
    lines.push(
      <Line key={`v${i}`} x1={x} y1={insetY} x2={x} y2={insetY + h} stroke={COLORS.grid} strokeWidth={0.5} />
    );
  }
  for (let i = 0; i <= rows; i++) {
    const y = insetY + (i / rows) * h;
    lines.push(
      <Line key={`h${i}`} x1={insetX} y1={y} x2={insetX + w} y2={y} stroke={COLORS.grid} strokeWidth={0.5} />
    );
  }
  return <G>{lines}</G>;
}

function FlowArrows({ x, yStart, yEnd, count }: { x: number; yStart: number; yEnd: number; count: number }) {
  const arrows: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const y = yStart + ((i + 0.5) / count) * (yEnd - yStart);
    const len = 10;
    arrows.push(
      <G key={i}>
        <Line x1={x - len} y1={y} x2={x} y2={y} stroke={COLORS.flow} strokeWidth={1} opacity={0.6} />
        <Path d={`M${x - 3} ${y - 2.5} L${x} ${y} L${x - 3} ${y + 2.5}`} fill={COLORS.flow} opacity={0.6} />
      </G>
    );
  }
  return <G>{arrows}</G>;
}

function CylinderObject({ cx, cy, r, status }: { cx: number; cy: number; r: number; status: SimStatus }) {
  const glowColor = status === "running" ? COLORS.runningGlow : status === "converged" ? COLORS.convergedBody : COLORS.objectBorder;
  return (
    <G>
      {status !== "idle" && (
        <Circle cx={cx} cy={cy} r={r + 6} fill={glowColor} opacity={0.08} />
      )}
      <Circle cx={cx} cy={cy} r={r} fill={COLORS.object} stroke={glowColor} strokeWidth={status === "idle" ? 1 : 1.5} />
    </G>
  );
}

function AirfoilObject({ cx, cy, chord, status }: { cx: number; cy: number; chord: number; status: SimStatus }) {
  const glowColor = status === "running" ? COLORS.runningGlow : status === "converged" ? COLORS.convergedBody : COLORS.objectBorder;
  const thickness = chord * 0.12;
  const path = `
    M ${cx} ${cy - thickness * 0.3}
    Q ${cx + chord * 0.3} ${cy - thickness}
    ${cx + chord * 0.7} ${cy - thickness * 0.5}
    Q ${cx + chord * 0.95} ${cy - thickness * 0.2}
    ${cx + chord} ${cy}
    Q ${cx + chord * 0.95} ${cy + thickness * 0.2}
    ${cx + chord * 0.7} ${cy + thickness * 0.5}
    Q ${cx + chord * 0.3} ${cy + thickness}
    ${cx} ${cy + thickness * 0.3}
    Q ${cx - chord * 0.08} ${cy}
    ${cx} ${cy - thickness * 0.3}
    Z
  `;
  return (
    <G>
      {status !== "idle" && (
        <Ellipse cx={cx + chord * 0.5} cy={cy} rx={chord * 0.55} ry={thickness + 5} fill={glowColor} opacity={0.07} />
      )}
      <Path d={path} fill={COLORS.object} stroke={glowColor} strokeWidth={status === "idle" ? 1 : 1.5} />
    </G>
  );
}

function AhmedObject({ cx, cy, w, h: objH, status }: { cx: number; cy: number; w: number; h: number; status: SimStatus }) {
  const glowColor = status === "running" ? COLORS.runningGlow : status === "converged" ? COLORS.convergedBody : COLORS.objectBorder;
  const slant = objH * 0.3;
  const path = `
    M ${cx} ${cy}
    L ${cx + w * 0.2} ${cy - objH}
    L ${cx + w * 0.85} ${cy - objH}
    L ${cx + w} ${cy - objH + slant}
    L ${cx + w} ${cy}
    Z
  `;
  return (
    <G>
      {status !== "idle" && (
        <Ellipse cx={cx + w * 0.5} cy={cy - objH * 0.5} rx={w * 0.6} ry={objH * 0.7} fill={glowColor} opacity={0.07} />
      )}
      <Path d={path} fill={COLORS.object} stroke={glowColor} strokeWidth={status === "idle" ? 1 : 1.5} />
    </G>
  );
}

function WakeEffect({ cx, cy, width: domW, height: domH, status }: { cx: number; cy: number; width: number; height: number; status: SimStatus }) {
  if (status !== "converged") return null;
  const wakeW = domW - cx - 32;
  const wakeH = domH * 0.35;
  return (
    <G opacity={0.35}>
      <Defs>
        <LinearGradient id="wake" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={COLORS.convergedWake1} stopOpacity="0.8" />
          <Stop offset="0.4" stopColor={COLORS.convergedWake2} stopOpacity="0.5" />
          <Stop offset="1" stopColor={COLORS.convergedWake2} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={cx + wakeW * 0.5} cy={cy} rx={wakeW * 0.5} ry={wakeH * 0.5} fill="url(#wake)" />
    </G>
  );
}

export function MeshVisualization({ width, height, objectType, status, meshLX, meshLY }: Props) {
  const insetX = 32;
  const insetY = 16;
  const domainW = width - insetX;
  const domainH = height - insetY * 2;

  const objCX = insetX + domainW * 0.28;
  const objCY = insetY + domainH * 0.5;
  const cylRadius = Math.min(domainW, domainH) * 0.06;
  const airfoilChord = domainW * 0.22;
  const ahmedW = domainW * 0.2;
  const ahmedH = domainH * 0.28;

  const cols = Math.min(meshLX - 3, 12);
  const rows = Math.min(meshLY - 2, 8);

  return (
    <View style={{ width, height, overflow: "hidden", borderRadius: 4 }}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={COLORS.bg} />

        <GridLines width={width} height={height} cols={cols} rows={rows} />

        {/* Domain border */}
        <Rect
          x={insetX}
          y={insetY}
          width={domainW}
          height={domainH}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={1}
        />

        {/* Inlet (left) highlight */}
        <Line
          x1={insetX}
          y1={insetY}
          x2={insetX}
          y2={insetY + domainH}
          stroke={COLORS.inlet}
          strokeWidth={2}
          opacity={0.7}
        />

        {/* Symmetry lines (top + bottom) */}
        <Line x1={insetX} y1={insetY} x2={insetX + domainW} y2={insetY} stroke={COLORS.symmetry} strokeWidth={1} strokeDasharray="4,3" />
        <Line x1={insetX} y1={insetY + domainH} x2={insetX + domainW} y2={insetY + domainH} stroke={COLORS.symmetry} strokeWidth={1} strokeDasharray="4,3" />

        {/* Flow arrows at inlet */}
        <FlowArrows x={insetX} yStart={insetY + 4} yEnd={insetY + domainH - 4} count={4} />

        {/* Boundary labels */}
        <SvgText x={insetX + domainW * 0.5} y={insetY - 4} fontSize={7} fill={COLORS.label} textAnchor="middle">
          SYMMETRY / FREE STREAM
        </SvgText>
        <SvgText x={insetX + domainW * 0.5} y={insetY + domainH + 10} fontSize={7} fill={COLORS.label} textAnchor="middle">
          SYMMETRY / FREE STREAM
        </SvgText>
        <SvgText x={insetX - 4} y={insetY + domainH * 0.5} fontSize={7} fill={COLORS.inlet} textAnchor="middle" rotation="-90" originX={insetX - 4} originY={insetY + domainH * 0.5}>
          INLET
        </SvgText>

        {/* Object coordinates */}
        <SvgText x={insetX + 4} y={insetY + 11} fontSize={7} fill={COLORS.label}>[0, 1]</SvgText>
        <SvgText x={insetX + domainW - 4} y={insetY + domainH - 4} fontSize={7} fill={COLORS.label} textAnchor="end">[0, 7]</SvgText>

        {/* Wake effect (converged state) */}
        <WakeEffect cx={objCX} cy={objCY} width={width} height={domainH} status={status} />

        {/* Object */}
        {objectType === "cylinder" && (
          <CylinderObject cx={objCX} cy={objCY} r={cylRadius} status={status} />
        )}
        {objectType === "airfoil" && (
          <AirfoilObject cx={objCX - airfoilChord / 2} cy={objCY} chord={airfoilChord} status={status} />
        )}
        {objectType === "ahmed" && (
          <AhmedObject cx={objCX - ahmedW / 2} cy={objCY + ahmedH / 2} w={ahmedW} h={ahmedH} status={status} />
        )}

        {/* Status overlay label */}
        {status !== "idle" && (
          <G>
            <Rect x={insetX + 6} y={insetY + 5} width={status === "running" ? 96 : 82} height={14} rx={2} fill={COLORS.bg} opacity={0.8} />
            <SvgText x={insetX + 10} y={insetY + 15} fontSize={8} fill={status === "running" ? COLORS.runningGlow : status === "converged" ? COLORS.convergedBody : "#FF4D4D"}>
              {status === "running" ? "PRE-PROCESSOR · SOLVING" : status === "converged" ? "COMPLETE · CONVERGED" : "SOLVER · FAILED"}
            </SvgText>
          </G>
        )}
        {status === "idle" && (
          <G>
            <Rect x={insetX + 6} y={insetY + 5} width={130} height={14} rx={2} fill={COLORS.bg} opacity={0.7} />
            <SvgText x={insetX + 10} y={insetY + 15} fontSize={8} fill={COLORS.label}>
              PRE-PROCESSOR · AWAITING RUN
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

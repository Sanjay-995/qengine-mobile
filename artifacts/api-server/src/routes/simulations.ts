import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface ValidationResult {
  meshTopology: boolean;
  boundaryConditions: boolean;
  cflStable: boolean;
  solverCompatible: boolean;
  memoryOk: boolean;
}

interface Simulation {
  id: string;
  name: string;
  preset: string;
  type: "CFD" | "FEA";
  status: "running" | "converged" | "failed" | "queued";
  reynoldsNumber: number | null;
  iterations: number;
  maxIterations: number;
  residual: number | null;
  residualTarget: number;
  strouhalNumber: number | null;
  dragCoefficient: number | null;
  liftCoefficient: number | null;
  solver: string;
  gridSize: string;
  domainWidth: number | null;
  domainHeight: number | null;
  inletVelocity: number | null;
  startedAt: string | null;
  completedAt: string | null;
  computeTimeMin: number | null;
  validation: ValidationResult | null;
  residualHistory: number[];
  aiAnalysis: string | null;
}

const store: Simulation[] = [
  {
    id: "sim_001",
    name: "Cylinder Wake",
    preset: "Cylinder Wake",
    type: "CFD",
    status: "converged",
    reynoldsNumber: 100000,
    iterations: 1249,
    maxIterations: 2000,
    residual: 3.1e-4,
    residualTarget: 1e-4,
    strouhalNumber: 0.198,
    dragCoefficient: 0.467,
    liftCoefficient: 1.312,
    solver: "RANS k-ω SST",
    gridSize: "8 (256 cells)",
    domainWidth: 4.0,
    domainHeight: 2.5,
    inletVelocity: 1.0,
    startedAt: "2026-05-02T08:12:00Z",
    completedAt: "2026-05-02T09:41:00Z",
    computeTimeMin: 89,
    validation: { meshTopology: true, boundaryConditions: true, cflStable: true, solverCompatible: true, memoryOk: true },
    residualHistory: [0.1, 0.06, 0.032, 0.018, 0.009, 0.005, 0.0028, 0.0016, 0.001, 0.00072, 0.00051, 0.00038, 0.00031],
    aiAnalysis: "Simulation converged at 1,249 iterations with residual 3.1e-4. St=0.198 is within expected range for Re=100,000. Cd=0.467 is consistent with published cylinder wake benchmarks.",
  },
  {
    id: "sim_002",
    name: "NACA 0012 Wing",
    preset: "Airfoil",
    type: "CFD",
    status: "running",
    reynoldsNumber: 3000000,
    iterations: 456,
    maxIterations: 3000,
    residual: 2.3e-3,
    residualTarget: 1e-5,
    strouhalNumber: null,
    dragCoefficient: 0.0082,
    liftCoefficient: 0.742,
    solver: "RANS k-ε",
    gridSize: "16 (1024 cells)",
    domainWidth: 10.0,
    domainHeight: 4.0,
    inletVelocity: 45.0,
    startedAt: "2026-05-02T11:05:00Z",
    completedAt: null,
    computeTimeMin: null,
    validation: { meshTopology: true, boundaryConditions: true, cflStable: true, solverCompatible: true, memoryOk: false },
    residualHistory: [0.5, 0.31, 0.19, 0.13, 0.082, 0.056, 0.039, 0.028, 0.0195, 0.0148, 0.012, 0.0095, 0.0082, 0.0068, 0.0057, 0.0048, 0.0041, 0.0035, 0.0029, 0.0023],
    aiAnalysis: "Convergence on track. Residual decay rate suggests convergence around 800–900 iterations. Warning: memory utilization at ~18 MB — monitor if approaching node limit.",
  },
  {
    id: "sim_003",
    name: "Pipe Flow Re=50k",
    preset: "Pipe Flow",
    type: "CFD",
    status: "queued",
    reynoldsNumber: 50000,
    iterations: 0,
    maxIterations: 1500,
    residual: null,
    residualTarget: 1e-5,
    strouhalNumber: null,
    dragCoefficient: null,
    liftCoefficient: null,
    solver: "LES",
    gridSize: "12 (512 cells)",
    domainWidth: 8.0,
    domainHeight: 1.0,
    inletVelocity: 5.0,
    startedAt: null,
    completedAt: null,
    computeTimeMin: null,
    validation: null,
    residualHistory: [],
    aiAnalysis: null,
  },
  {
    id: "sim_004",
    name: "Bracket Stress Test",
    preset: "Structural",
    type: "FEA",
    status: "failed",
    reynoldsNumber: null,
    iterations: 234,
    maxIterations: 1000,
    residual: 0.089,
    residualTarget: 1e-4,
    strouhalNumber: null,
    dragCoefficient: null,
    liftCoefficient: null,
    solver: "Linear Static",
    gridSize: "24 (2048 cells)",
    domainWidth: null,
    domainHeight: null,
    inletVelocity: null,
    startedAt: "2026-05-01T14:30:00Z",
    completedAt: "2026-05-01T15:18:00Z",
    computeTimeMin: 48,
    validation: null,
    residualHistory: [0.9, 0.78, 0.68, 0.61, 0.55, 0.5, 0.47, 0.44, 0.42, 0.089],
    aiAnalysis: "Solver diverged at iteration 234. Likely cause: element distortion near the fillet region. Recommend remeshing with smaller element size (max 0.5mm) around the fillet.",
  },
  {
    id: "sim_005",
    name: "Ahmed Body Drag",
    preset: "External Aero",
    type: "CFD",
    status: "converged",
    reynoldsNumber: 4200000,
    iterations: 2841,
    maxIterations: 3000,
    residual: 8.2e-6,
    residualTarget: 1e-5,
    strouhalNumber: null,
    dragCoefficient: 0.285,
    liftCoefficient: -0.042,
    solver: "DES",
    gridSize: "32 (4096 cells)",
    domainWidth: 20.0,
    domainHeight: 6.0,
    inletVelocity: 60.0,
    startedAt: "2026-04-30T06:00:00Z",
    completedAt: "2026-04-30T14:22:00Z",
    computeTimeMin: 502,
    validation: { meshTopology: true, boundaryConditions: true, cflStable: true, solverCompatible: true, memoryOk: true },
    residualHistory: [0.4, 0.22, 0.12, 0.065, 0.038, 0.021, 0.013, 0.0082, 0.0054, 0.0036, 0.0024, 0.0016, 0.0011, 0.00072, 0.00048, 0.00031, 0.0002, 0.000135, 0.000092, 0.000082],
    aiAnalysis: "Excellent convergence. Cd=0.285 agrees with Ahmed (1984) experimental data within 1.4%. The rear slant separation bubble was well-captured by DES. Results are publication-ready.",
  },
];

let simCounter = store.length;

router.get("/simulations", (_req, res) => {
  res.json({ simulations: store, total: store.length });
});

router.get("/simulations/:id", (req, res) => {
  const sim = store.find((s) => s.id === req.params.id);
  if (!sim) {
    res.status(404).json({ error: "Simulation not found" });
    return;
  }
  res.json(sim);
});

router.post("/simulations", (req, res) => {
  const { name, type, solver, preset, maxIterations, inletVelocity, meshLX, meshLY } = req.body as {
    name?: string;
    type?: string;
    solver?: string;
    preset?: string;
    maxIterations?: number;
    inletVelocity?: number;
    meshLX?: number;
    meshLY?: number;
  };

  simCounter++;
  const id = `sim_${String(simCounter).padStart(3, "0")}`;
  const lx = meshLX ?? 10;
  const ly = meshLY ?? 9;
  const cells = Math.pow(2, lx) * Math.pow(2, ly);
  const cellsLabel = cells >= 1e6 ? `${(cells / 1e6).toFixed(1)}M` : cells >= 1e3 ? `${Math.round(cells / 1e3)}k` : `${cells}`;

  const sim: Simulation = {
    id,
    name: name ?? `Simulation ${simCounter}`,
    preset: preset ?? "Custom",
    type: (type as "CFD" | "FEA") ?? "CFD",
    status: "queued",
    reynoldsNumber: null,
    iterations: 0,
    maxIterations: maxIterations ?? 1000,
    residual: null,
    residualTarget: 1e-5,
    strouhalNumber: null,
    dragCoefficient: null,
    liftCoefficient: null,
    solver: solver ?? "Laminar",
    gridSize: `${lx} (${cellsLabel} cells)`,
    domainWidth: 4.0,
    domainHeight: 2.5,
    inletVelocity: inletVelocity ?? 1.0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    computeTimeMin: null,
    validation: null,
    residualHistory: [],
    aiAnalysis: null,
  };

  store.push(sim);
  res.status(201).json(sim);
});

router.patch("/simulations/:id", (req, res) => {
  const idx = store.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Simulation not found" });
    return;
  }
  Object.assign(store[idx], req.body);
  res.json(store[idx]);
});

export default router;

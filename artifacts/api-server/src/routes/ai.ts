import { Router, type IRouter } from "express";

const router: IRouter = Router();

const RESPONSES: Record<string, string> = {
  converge:
    "Based on the current residual decay rate for NACA 0012 Wing, I estimate convergence in approximately 380 more iterations (~12 minutes at current compute rate).",
  residual:
    "The residual for NACA 0012 Wing is 2.3e-3 and decreasing at roughly 8% per 100 iterations. Target is 1e-5 — still 2-3 orders of magnitude to go.",
  mesh:
    "For the current Cylinder Wake mesh (256 cells, structured grid), mesh topology is valid. Boundary layer y+ is within acceptable range for RANS k-ω SST.",
  solver:
    "RANS k-ω SST is a good choice for this Reynolds regime. CFL=0.8 is within stability bounds. Consider tightening to 0.5 if residuals stall.",
  ahmed:
    "Ahmed Body Drag converged with Cd=0.285, within 1.4% of published experimental data. Results are publication-ready. I recommend exporting VTK field files before archiving.",
  run:
    "Ready to execute. All pre-run checks are nominal. Estimated runtime: 8–12 minutes at current mesh resolution.",
  memory:
    "Current memory utilisation is within safe limits. The largest active simulation is NACA 0012 Wing at ~18 MB. Node limit is 512 MB.",
  help:
    "I can help with: residual analysis, solver recommendations, mesh quality checks, boundary condition validation, result interpretation, and comparison with benchmark data. Just ask.",
  default:
    "I'm monitoring your simulation workspace. All active runs look nominal. What would you like to know?",
};

function getReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("converg")) return RESPONSES.converge;
  if (lower.includes("residual")) return RESPONSES.residual;
  if (lower.includes("mesh") || lower.includes("grid")) return RESPONSES.mesh;
  if (lower.includes("solver") || lower.includes("cfl") || lower.includes("rans")) return RESPONSES.solver;
  if (lower.includes("ahmed") || lower.includes("drag") || lower.includes("cd")) return RESPONSES.ahmed;
  if (lower.includes("run") || lower.includes("start") || lower.includes("launch")) return RESPONSES.run;
  if (lower.includes("memory") || lower.includes("ram")) return RESPONSES.memory;
  if (lower.includes("help") || lower.includes("what can")) return RESPONSES.help;
  return RESPONSES.default;
}

router.post("/ai/chat", (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }
  const reply = getReply(message);
  res.json({ reply, timestamp: new Date().toISOString() });
});

export default router;

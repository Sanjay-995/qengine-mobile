import { Router, type IRouter } from "express";

const router: IRouter = Router();

const startTime = Date.now();

router.get("/backend/status", (_req, res) => {
  const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    connected: true,
    type: "Local CPU (WASM)",
    load: parseFloat((Math.random() * 0.3 + 0.1).toFixed(2)),
    uptimeSec,
    version: "2.1.0",
    cores: 4,
    memoryMb: 512,
  });
});

export default router;

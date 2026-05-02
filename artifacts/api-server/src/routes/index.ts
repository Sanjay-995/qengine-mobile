import { Router, type IRouter } from "express";
import healthRouter from "./health";
import backendRouter from "./backend";
import simulationsRouter from "./simulations";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(backendRouter);
router.use(simulationsRouter);
router.use(aiRouter);

export default router;

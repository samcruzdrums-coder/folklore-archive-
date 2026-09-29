import { Router, type IRouter } from "express";
import healthRouter from "./health";
import recordingsRouter from "./recordings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(recordingsRouter);

export default router;

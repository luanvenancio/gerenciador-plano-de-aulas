import { Router } from "express";
import { lessonPlanRouter } from "./lesson-plan.routes";

const router = Router();

router.use("/lesson-plans", lessonPlanRouter);

export { router };

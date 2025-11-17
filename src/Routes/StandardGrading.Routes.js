import express from 'express';
import { getStandardGradingScale, SetStandardGradingScale } from '../Contollers/StandardGrading.controller.js';
import { isUser } from '../Middlewares/Auth.middleware.js';

const router = express.Router();

router.get("/get", isUser, getStandardGradingScale);
router.post("/set", isUser, SetStandardGradingScale);

export default router;
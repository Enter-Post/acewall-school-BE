import express from 'express';
import { getStandardGradingScale } from '../Contollers/StandardGrading.controller.js';
import { isUser } from '../Middlewares/Auth.middleware.js';

const router = express.Router();

router.post("/set", isUser, SetStandardGradingScale);
router.get("/get", isUser, getStandardGradingScale);

export default router;
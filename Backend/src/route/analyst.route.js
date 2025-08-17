import express from 'express';
const router = express.Router();
import { authenticate } from "../middleware/auth.js";
import {
    getWeekWiseWork,
    getDailyWork,
    getMonthlyStats,
    getAllSessions
} from '../controller/analyst.controller.js';

// Protect all routes with authentication
router.use(authenticate);

// Week-wise work analytics for the last 7 days
router.get('/week-wise-work', getWeekWiseWork);

// Daily work statistics
router.get('/daily-work', getDailyWork);

// Current month statistics
router.get('/monthly-stats', getMonthlyStats);

// Get all sessions with task details
router.get('/sessions', getAllSessions);

export default router;

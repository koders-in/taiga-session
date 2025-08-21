import express from "express";
const router = express.Router();
import { authenticate } from "../middleware/auth.js";
import {
  getUserWorkData,
  getDailyWork,
  getWeekWiseWork,
  getMonthlyWork,
  getSessionsofUser,
} from "../controller/analyst.controller.js";

// Protect all routes with authentication
router.use(authenticate);

// Get user work data
router.get("/user-work", getUserWorkData); // endpoint not for frontend only to test

// Middleware to validate daily work request
const validateDailyWorkRequest = (req, res, next) => {
  const { user_id, date } = req.body;

  if (!user_id || !date) {
    return res.status(400).json({
      success: false,
      message: "Both user_id and date are required in the request body",
    });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      success: false,
      message: "Invalid date format. Please use YYYY-MM-DD format",
    });
  }

  next();
};

// Daily work statistics
router.post("/daily-work", validateDailyWorkRequest, getDailyWork);

// Week-wise work statistics
router.post("/week-wise-work", validateDailyWorkRequest, getWeekWiseWork);

// Monthly statistics
router.post("/monthly-stats", validateDailyWorkRequest, getMonthlyWork);

// Get all sessions for a user
router.post("/sessions", getSessionsofUser);

export default router;

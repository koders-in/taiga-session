import { Router } from "express";
import {
  getUserProjects,
  getProjectTasks,
} from "../controller/taiga.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Apply centralized authentication middleware to all routes
router.use(authenticate);

// Get all projects for the authenticated user
router.get("/projects", getUserProjects);

// Get tasks for a specific project
router.get("/projects/:projectId/tasks", getProjectTasks);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("Taiga route error:", err);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
      error: "Invalid JSON format in request body",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

export default router;

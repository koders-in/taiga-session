import { Router } from "express";
import {
  getUserProjects,
  getProjectTasks,
} from "../controller/taiga.controller.js";

const router = Router();

// Middleware to check authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please provide a valid token.",
    });
  }
  next();
};

// Apply authentication middleware to all routes
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

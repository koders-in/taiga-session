import express from "express";
import { Router } from "express";
import { userLogin } from "../controller/auth.controller.js";

const router = Router();

// Login route with direct JSON parsing
router.post("/login", express.json(), userLogin);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Auth route error:', err);
  
  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload',
      error: 'Invalid JSON format in request body'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

export default router;

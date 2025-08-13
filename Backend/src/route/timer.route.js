import express from 'express';
import { 
  startTimer, 
  pauseTimer, 
  resumeTimer, 
  completeTimer 
} from '../controller/timer.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all timer routes
router.use(authenticate);

/**
 * @route   POST /api/timer/start
 * @desc    Start a new timer session
 * @access  Private
 * @body    {string} taskId - ID of the task
 * @body    {string} taskName - Name of the task
 */
router.post('/start', startTimer);

/**
 * @route   POST /api/timer/pause/:sessionId
 * @desc    Pause an active timer session
 * @access  Private
 * @param   {string} sessionId - ID of the session to pause
 * @header  {string} Authorization - Bearer token for authentication
 */
router.post('/pause/:sessionId', pauseTimer);

/**
 * @route   POST /api/timer/resume/:sessionId
 * @desc    Resume a paused timer session
 * @access  Private
 * @param   {string} sessionId - ID of the session to resume
 * @header  {string} Authorization - Bearer token for authentication
 */
router.post('/resume/:sessionId', resumeTimer);

/**
 * @route   POST /api/timer/complete/:sessionId
 * @desc    Complete a timer session
 * @access  Private
 * @param   {string} sessionId - ID of the session to complete
 * @header  {string} Authorization - Bearer token for authentication
 */
router.post('/complete/:sessionId', completeTimer);

export default router;
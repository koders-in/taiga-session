import express from 'express';
const router = express.Router();
import { authenticate } from "../middleware/auth.js";
import { getUserWorkData, 
        getDailyWork } from '../controller/analyst.controller.js';


// Protect all routes with authentication
router.use(authenticate);

// Get user work data
router.get('/user-work', getUserWorkData);



// // Week-wise work analytics
// router.post('/week-wise-work', validateAnalyticsRequest, getWeekWiseWork);

// Middleware to validate daily work request
const validateDailyWorkRequest = (req, res, next) => {
    const { user_id, date } = req.body;
    
    if (!user_id || !date) {
        return res.status(400).json({
            success: false,
            message: 'Both user_id and date are required in the request body'
        });
    }
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid date format. Please use YYYY-MM-DD format'
        });
    }
    
    next();
};

// Daily work statistics
router.get('/daily-work', validateDailyWorkRequest, getDailyWork);

// // Monthly statistics
// router.post('/monthly-stats', validateAnalyticsRequest, getMonthlyStats);

// // Get all sessions with task details
// router.post('/sessions', (req, res, next) => {
//     // Only validate user_id for sessions endpoint
//     if (!req.body.user_id) {
//         return res.status(400).json({
//             success: false,
//             message: 'User ID is required in the request body'
//         });
//     }
//     next();
// }, getAllSessions);

export default router;

import axios from "axios";

const TAIGA_API_URL = process.env.TAIGA_API_URL || "https://taiga.koders.in/api/v1";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Taiga
    const response = await axios.get(`${TAIGA_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      req.user = response.data; // Attach user data to request
      req.token = token; // Attach token for potential further use
      return next();
    }

    throw new Error('Invalid token');
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: error.response?.data?._error_message || "Invalid or expired token",
    });
  }
};

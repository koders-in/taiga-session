import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TAIGA_API_URL = process.env.TAIGA_API_URL || 'https://taiga.koders.in/api/v1';

// In-memory storage for tokens (in a production app, use a database)
const userTokens = new Map();

export const userLogin = async (req, res) => {
  console.log('Login request received:', { body: req.body });
  
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      console.log('Validation failed - missing username or password');
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Prepare login payload for Taiga
    const loginPayload = {
      type: 'normal',
      username: username,
      password: password
    };

    console.log('Sending request to Taiga API:', { url: `${TAIGA_API_URL}/auth` });
    
    // Make request to Taiga API
    const response = await axios.post(`${TAIGA_API_URL}/auth`, loginPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (response.status === 200 && response.data.auth_token) {
      const { auth_token, refresh, ...userData } = response.data;
      
      // Store the token in memory (in production, use a database)
      userTokens.set(username, {
        authToken: auth_token,
        refreshToken: refresh,
        ...userData
      });

      // Return success response with user data (excluding sensitive info)
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: userData.id,
          username: userData.username,
          full_name: userData.full_name,
          photo: userData.photo,
          // Add other non-sensitive user data as needed
        },
        // In production, consider using HTTP-only cookies for tokens
        token: auth_token,
        refreshToken: refresh
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or authentication failed'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || 'Authentication failed',
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(503).json({
        success: false,
        message: 'Taiga API is not responding. Please try again later.'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication'
      });
    }
  }
};

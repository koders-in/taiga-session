import axios from "axios";

const TAIGA_API_URL =
  process.env.TAIGA_API_URL || "https://taiga.koders.in/api/v1";

// NocoDB Configuration
const NOCODB_BASE_URL = process.env.nocodb_url || 'http://localhost:8080';
const NOCODB_USERS_TABLE = process.env.nocodb_table_users || 'mo90o7onz2d8oh1';
const NOCODB_TOKEN = process.env.nocodb_token || 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY';

// Validate required environment variables
if (!NOCODB_BASE_URL || !NOCODB_USERS_TABLE || !NOCODB_TOKEN) {
  console.error('Error: Missing required NocoDB configuration in environment variables');
  process.exit(1);
}

export const userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      // // console.log("Validation failed - missing username or password");
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Prepare login payload for Taiga
    const loginPayload = {
      type: "normal",
      username: username,
      password: password,
    };

    // Make request to Taiga API
    const response = await axios.post(`${TAIGA_API_URL}/auth`, loginPayload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000, // 10 second timeout
    });

    if (response.status === 200 && response.data.auth_token) {
      const { auth_token, refresh, ...userData } = response.data;

      // // // console.log(
      //   "Taiga user data:",
      //   userData.id,
      //   userData.username,
      //   userData.email
      // );

      // Prepare NocoDB API URL with correct base path
      const nocoUsersUrl = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USERS_TABLE}/records`;

      try {
        // Check if user exists in NocoDB by email or Taiga ID
        const nocoGetRes = await axios.get(nocoUsersUrl, {
          params: {
            where: `(Email,eq,${userData.email})~or(user_id,eq,${userData.id})`,
            limit: 1,
          },
          headers: {
            accept: "application/json",
            "xc-token": NOCODB_TOKEN,
            "xc-auth": `Bearer ${NOCODB_TOKEN}`,
          },
        });

        // Check if user exists
        const existingUser = nocoGetRes.data.list?.[0];
        let nocoUser = existingUser;

        if (!existingUser) {
          // User doesn't exist, create new user in NocoDB
          // // console.log("User not found in NocoDB, creating new user");

          // Create a clean payload with no duplicate fields
          const newUserPayload = {};
          const fields = {
            user_id: userData.id,
            Name: userData.full_name,
            Email: userData.email,
          };

          // Add only defined fields to the payload
          Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              newUserPayload[key] = value;
            }
          });

          // // console.log("Creating user with payload:", JSON.stringify(newUserPayload, null, 2));
          const nocoCreateRes = await axios.post(nocoUsersUrl, newUserPayload, {
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              "xc-token": NOCODB_TOKEN,
            },
          });

          nocoUser = nocoCreateRes.data;
        } else {
          // Check if user data has changed
          const hasChanges = 
            existingUser.Name !== userData.full_name ||
            existingUser.Email !== userData.email;
          
            if (hasChanges) {
              console.log(`User data changed for ${userData.email}. Updating record.`);
            
              const updatePayload = [
                {
                  Id: existingUser.Id,
                  Name: userData.full_name,
                  Email: userData.email,
                },
              ];
            
              try {
                await axios.patch(
                  nocoUsersUrl,          
                  updatePayload,
                  {
                    headers: {
                      "Content-Type": "application/json",
                      accept: "application/json",
                      "xc-token": NOCODB_TOKEN,
                    },
                  }
                );
            
                nocoUser = { ...existingUser, ...updatePayload[0] };
                console.log(`Successfully updated user ${userData.email}`);
              } catch (updateError) {
                console.error(`Failed to update user ${userData.email}:`, updateError.response?.data || updateError.message);
                // Continue with existing user data if update fails
                nocoUser = existingUser;
              }
            } else {
              console.log(`No changes detected for user ${userData.email}. Skipping update.`);
              nocoUser = existingUser;
            }
            
        }

        return res.status(200).json({
          success: true,
          message: "Login successful",
          user: {
            id: userData.id,
            full_name: userData.full_name,
            photo: userData.photo,
            email: userData.email,
            nocodb_record: nocoUser,
          },
          token: auth_token,
          refreshToken: refresh,
        });
      } catch (nocoError) {
        console.error("NocoDB operation error:", nocoError);

        // Even if NocoDB fails, we can still return successful login
        return res.status(200).json({
          success: true,
          message: "Login successful (NocoDB sync failed)",
          user: {
            id: userData.id,
            full_name: userData.full_name,
            photo: userData.photo,
            email: userData.email,
          },
          token: auth_token,
          refreshToken: refresh,
          warning: "User data sync with database failed",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or authentication failed",
      });
    }
  } catch (error) {
    console.error("Login error:", error);

    // Handle specific error cases
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || "Authentication failed",
        details: error.response.data,
      });
    } else if (error.request) {
      return res.status(503).json({
        success: false,
        message: "Taiga API is not responding. Please try again later.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal server error during authentication",
      });
    }
  }
};

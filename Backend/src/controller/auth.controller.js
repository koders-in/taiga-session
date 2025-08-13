import axios from "axios";

const TAIGA_API_URL =
  process.env.TAIGA_API_URL || "https://taiga.koders.in/api/v1";
const NOCO_BASEURL = process.env.NOCO_BASEURL;
const USERTABLE = process.env.NOCO_USERTABLE_ID;

export const userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      console.log("Validation failed - missing username or password");
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

      console.log(
        "Taiga user data:",
        userData.id,
        userData.username,
        userData.email
      );

      // Check if user exists in NocoDB
      const nocoUrl = `${NOCO_BASEURL}/${USERTABLE}/records`;
      console.log("NocoDB URL:", nocoUrl);

      try {
        // Get all users from NocoDB to check if user exists
        const nocoGetRes = await axios.get(nocoUrl, {
          headers: {
            Accept: "application/json",
            "xc-token": `${process.env.NOCO_TOKEN}`,
          },
        });

        // Check if user exists by email or Taiga ID
        const existingUser = nocoGetRes.data.list?.find(
          (user) =>
            user.email === userData.email || user.taiga_id === userData.id
        );

        let nocoUser = existingUser;

        if (!existingUser) {
          // User doesn't exist, create new user in NocoDB
          console.log("User not found in NocoDB, creating new user");

          const newUserPayload = {
            taiga_id: userData.id,
            username: userData.username,

            email: userData.email,
            created_at: new Date().toISOString(),
          };

          const nocoCreateRes = await axios.post(nocoUrl, newUserPayload, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "xc-token": `${process.env.NOCO_TOKEN}`,
            },
          });

          console.log("User created in NocoDB:", nocoCreateRes.data);
          nocoUser = nocoCreateRes.data;
        } else {
          console.log("User found in NocoDB:", existingUser);

          // Optionally update existing user data

          const updatePayload = {
            username: userData.username,
            full_name: userData.full_name,
          };

          // const updateUrl = `${nocoUrl}/${existingUser.Id}`;

          // const nocoUpdateRes = await axios.patch(updateUrl, updatePayload, {
          //   headers: {
          //     "Content-Type": "application/json",
          //     Accept: "application/json",
          //     "xc-token": `${process.env.NOCO_TOKEN}`,
          //   },
          // });

          // console.log("User updated in NocoDB:", nocoUpdateRes.data);
          // nocoUser = nocoUpdateRes.data;
        }

        return res.status(200).json({
          success: true,
          message: "Login successful",
          user: {
            id: userData.id,
            username: userData.username,
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
            username: userData.username,
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

import axios from "axios";

const API_URL = "http://localhost:4000/api/auth/";

// To save the token
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  }
};

export const Login = async (username, password) => {
  try {
    console.log("Sending to backend:", username, password);

    const res = await axios.post(`${API_URL}login`, {
      username,
      password,
    });

    const { token, message, refreshtoken } = res.data; // return backend response
    if (token) {
      setAuthToken(token);
    } else {
      console.warn("No token received from the backend");
    }
    console.log({ token });
    return { message, refreshtoken };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const logout = () => {
  setAuthToken(null);
  window.location.href = "/login";
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUserProfile = async () => {
  try {
    const res = await axios.get("https://taiga.koders.in/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
};

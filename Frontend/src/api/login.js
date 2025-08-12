import axios from "axios";

const API_URL = "http://localhost:4000/api/auth/";

export const Register = async (username, password) => {
  try {
    console.log("Sending to backend:", username, password);

    const res = await axios.post(`${API_URL}login`, {
      username,
      password,
    });

    return res.data; // return backend response
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
};

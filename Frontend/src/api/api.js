import axios from "axios";

// Use Vite environment variable
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "", // leave blank so relative URLs work
});

function setToken(token) {
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
}

export default {
  client,
  get: (url, opts) => client.get(url, opts).then((r) => r.data),
  post: (url, body, opts) => client.post(url, body, opts).then((r) => r.data),
  patch: (url, body, opts) => client.patch(url, body, opts).then((r) => r.data),
  setToken,
};

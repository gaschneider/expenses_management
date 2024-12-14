import axios from "axios";

// Create an axios instance with custom config
const api = axios.create({
  baseURL: "http://localhost:8081/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;

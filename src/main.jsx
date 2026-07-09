import React from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App";
import "./index.css";

// Attach JWT to all API calls (required after multi-tenant auth on backend)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

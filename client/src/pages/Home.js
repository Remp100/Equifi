import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../Home-page.css";

export default function Homepage() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/`, {
          withCredentials: true,
        });
        const { valid } = response.data;
        setIsLoggedIn(valid);
        console.log(isLoggedIn);
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    checkLoginStatus();
  }, [isLoggedIn, API_URL]);

  useEffect(() => {
    console.log(isLoggedIn);
    if (isLoggedIn === true) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="home-page">
      <div className="welcome-card">
        <h1>Welcome to EquiFi</h1>
        <p>A platform to invest and manage your Portfolios in finances.</p>
        <div className="welcome-buttons">
          <Link to="/login" className="login-btn">
            Login
          </Link>
          <Link to="/register" className="register-btn">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

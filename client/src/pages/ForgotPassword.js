import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamation,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../Login.css";

let isCooldown = false;

export default function ForgotPassword() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertFadeOut, setAlertFadeOut] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setIsLoggedIn(data.valid);
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    checkLoginStatus();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn === true) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (isAlertVisible) {
      setAlertFadeOut(false);
      const timer = setTimeout(() => {
        setAlertFadeOut(true);
        const fadeOutTimer = setTimeout(() => {
          setIsAlertVisible(false);
          setAlertFadeOut(false);
        }, 500);
        return () => clearTimeout(fadeOutTimer);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAlertVisible]);

  const triggerAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertVisible(true);
    setAlertFadeOut(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !confirmEmail) {
      triggerAlert("Please enter an email in both fields!", "error");
      return;
    }

    if (email !== confirmEmail) {
      triggerAlert("Emails do not match!", "error");
      return;
    }

    // ✅ No more multiple emails - this will persist across all renders!
    if (isCooldown) return;

    isCooldown = true; // Start cooldown immediately to prevent multiple emails

    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });

      // Change this condition
      if (response.data.message) {
        triggerAlert(response.data.message, "success");

        setTimeout(() => {
          isCooldown = false; // Reset cooldown after timeout
          navigate("/login"); // ✅ Redirect after success
        }, 5000); // Cooldown period (matches the alert timeout)
      } else {
        triggerAlert("An error occurred.", "error");
        isCooldown = false; // Reset cooldown on error
      }
    } catch (error) {
      triggerAlert(
        error.response?.data?.message || "An error occurred. Please try again.",
        "error"
      );
      isCooldown = false; // Reset cooldown on error
    }
  };

  const handleCloseWithFade = () => {
    setAlertFadeOut(true);
    setTimeout(() => {
      setIsAlertVisible(false);
      setAlertFadeOut(false);
    }, 500);
  };

  return (
    <div className="login-page forgot-password-page">
      <div className="login forgot-password">
        <div className="page-title">EquiFi</div>
        <div className="status-holder">
          {isAlertVisible && (
            <div
              className={`alert ${alertFadeOut ? "fade-out" : ""} ${
                alertType === "error" ? "alert error" : "alert success"
              }`}
            >
              <FontAwesomeIcon
                icon={alertType === "error" ? faExclamation : faCheckCircle}
                className="mr-2"
              />
              {alertMessage}
              <button className="alert close-btn" onClick={handleCloseWithFade}>
                X
              </button>
            </div>
          )}
        </div>
        <div className="wrapper">
          <form id="form" onSubmit={handleSubmit}>
            <h2 className="page-title-forgot-password">Forgot Password</h2>
            <div className="mb-3 input-box">
              <input
                className="form-control"
                placeholder="Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="mb-3 input-box">
              <input
                className="form-control"
                placeholder="Confirm Email Address"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
              />
            </div>
            <div className="forgot-password-container">
              <Link className="forgot-password" to="/login">
                Back to Login
              </Link>
            </div>
            <div className="mb-3">
              <button type="submit" className="btn-login">
                Send
              </button>
            </div>
            <div className="register-text mb-3">
              <p>
                Remember your password?
                <a href="/login" className="link-register">
                  {" "}
                  Login
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

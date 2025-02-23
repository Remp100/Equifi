import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamation,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../Login.css";

export default function ForgotPassword() {
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
        const response = await fetch("http://localhost:3002/", {
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
      setAlertFadeOut(false); // Reset fade-out if a new alert is triggered
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
    setAlertFadeOut(false); // Ensure fade-out is reset when triggering a new alert
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

    try {
      const response = await axios.post(
        "http://localhost:3002/forgot-password",
        { email }
      );

      if (response.data.message) {
        triggerAlert(response.data.message, "success");
      } else {
        triggerAlert("An error occurred.", "error");
      }
    } catch (error) {
      triggerAlert(
        error.response?.data?.message || "An error occurred. Please try again.",
        "error"
      );
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
              {/* FontAwesome Icon and Alert Content */}
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

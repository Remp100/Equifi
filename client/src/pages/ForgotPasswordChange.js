import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamation,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../Login.css";

export default function ResetPassword() {
  const { resetToken } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertFadeOut, setAlertFadeOut] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  const navigate = useNavigate();

  // Validate the reset token on mount
  useEffect(() => {
    axios
      .get(`http://localhost:3002/verify-reset/${resetToken}`)
      .catch((error) => {
        console.error(
          "Reset token verification error:",
          error.response?.data || error
        );
        // Redirect to invalid page if token is invalid or expired
        navigate("/404");
      });
  }, [resetToken, navigate]);

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

  const handleCloseWithFade = () => {
    setAlertFadeOut(true);
    setTimeout(() => {
      setIsAlertVisible(false);
      setAlertFadeOut(false);
    }, 500);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      triggerAlert("Please enter a password in both fields!", "error");
      return;
    }

    if (password !== confirmPassword) {
      triggerAlert("Passwords do not match!", "error");
      return;
    }

    if (password.length < 4) {
      triggerAlert("Password must be at least 4 characters long!", "error");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/reset-password",
        {
          password,
          token: resetToken,
        }
      );

      if (response.data.success) {
        triggerAlert("Password changed successfully!", "success");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        if (
          response.data.message &&
          response.data.message.toLowerCase().includes("expired")
        ) {
          navigate("/404");
        } else {
          triggerAlert(response.data.message || "An error occurred.", "error");
        }
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      if (
        error.response?.data?.message &&
        error.response.data.message.toLowerCase().includes("expired")
      ) {
        navigate("/404");
      } else {
        triggerAlert(
          error.response?.data?.message ||
            "An error occurred. Please try again.",
          "error"
        );
      }
    }
  };

  return (
    <div className="login-page reset-password-page">
      <div className="login reset-password">
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
            <h2 className="page-title-reset-password">Reset Password</h2>
            <div className="mb-3 input-box">
              <input
                type="password"
                className="form-control"
                id="password"
                autoComplete="off"
                placeholder="New Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="mb-3 input-box">
              <input
                type="password"
                className="form-control"
                id="confirm-password"
                autoComplete="off"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <div className="mb-3">
              <button type="submit" className="btn-login">
                Change Password
              </button>
            </div>
            <div className="register-text mb-3">
              <p>
                Remember your password?{" "}
                <Link to="/login" className="link-register">
                  Back to Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

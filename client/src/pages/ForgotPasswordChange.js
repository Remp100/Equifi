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
      const timer = setTimeout(() => {
        setAlertFadeOut(true);
        setTimeout(() => {
          setIsAlertVisible(false);
          setAlertFadeOut(false);
        }, 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAlertVisible]);

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
      setAlertMessage("Please enter a password in both fields!");
      setAlertType("error");
      setIsAlertVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setAlertMessage("Passwords do not match!");
      setAlertType("error");
      setIsAlertVisible(true);
      return;
    }

    if (password.length < 4) {
      setAlertMessage("Password must be at least 4 characters long!");
      setAlertType("error");
      setIsAlertVisible(true);
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
        setAlertMessage("Password changed successfully!");
        setAlertType("success");
        setIsAlertVisible(true);

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // If the server response indicates the token is invalid, redirect
        if (
          response.data.message &&
          response.data.message.toLowerCase().includes("expired")
        ) {
          navigate("/404");
        } else {
          setAlertMessage(response.data.message || "An error occurred.");
          setAlertType("error");
          setIsAlertVisible(true);
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
        setAlertMessage(
          error.response?.data?.message ||
            "An error occurred. Please try again."
        );
        setAlertType("error");
        setIsAlertVisible(true);
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

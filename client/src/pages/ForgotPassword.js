import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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
  const [alertType, setAlertType] = useState(""); // Track alert type (error or success)

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !confirmEmail) {
      setAlertMessage("Please enter an email in both fields!");
      setAlertType("error");
      setIsAlertVisible(true);
      return;
    }

    if (email !== confirmEmail) {
      setAlertMessage("Emails do not match!");
      setAlertType("error"); // Set alert type to error
      setIsAlertVisible(true);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/forgot-password",
        { email }
      );

      // Change this condition
      if (response.data.message) {
        setAlertMessage(response.data.message);
        setAlertType("success");
        setIsAlertVisible(true);
      } else {
        setAlertMessage("An error occurred.");
        setAlertType("error");
        setIsAlertVisible(true);
      }
    } catch (error) {
      setAlertMessage(
        error.response?.data?.message || "An error occurred. Please try again."
      );
      setAlertType("error");
      setIsAlertVisible(true);
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

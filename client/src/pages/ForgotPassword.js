import React, { useState } from "react";
import axios from "axios";
import "../Login.css";

export default function ForgotPassword() {
  // State variables for email inputs and status messages
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusClass, setStatusClass] = useState("");

  // Submit handler for the form
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if emails match
    if (email !== confirmEmail) {
      setStatusMessage("Emails do not match!");
      setStatusClass("errorMessage");
      return;
    }

    try {
      // Send request to forgot-password API
      const response = await axios.post(
        "http://localhost:3002/forgot-password",
        {
          email,
        }
      );

      if (response.data.success) {
        setStatusMessage("Password reset email sent. Check your inbox.");
        setStatusClass("successMessage");
      } else {
        setStatusMessage(response.data.message || "An error occurred.");
        setStatusClass("errorMessage");
      }
    } catch (error) {
      console.error("Error handling forgot password:", error);
      setStatusMessage("An error occurred. Please try again.");
      setStatusClass("errorMessage");
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password">
        <div className="page-title">EquiFi</div>
        <div className="wrapper">
          <form id="form" onSubmit={handleSubmit}>
            <h1>Forgot Password</h1>
            <div className="mb-3 input-box">
              <input
                className="form-control"
                id="email"
                autoComplete="off"
                placeholder="Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="mb-3 input-box">
              <input
                className="form-control"
                id="confirm-email"
                autoComplete="off"
                placeholder="Confirm Email Address"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
              />
            </div>
            <div className="status-message">
              <p className={statusClass}>{statusMessage}</p>
            </div>
            <div className="mb-3">
              <button type="submit" className="btn-login">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

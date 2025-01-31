import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../Login.css";

export default function ResetPassword() {
  const { resetToken } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusClass, setStatusClass] = useState("message");

  const navigate = useNavigate();

  // Effect to handle status messages
  useEffect(() => {
    if (statusMessage !== "") {
      setStatusClass("showMessage");
      setTimeout(() => {
        setStatusClass("message");
      }, 4000);
    }
  }, [statusMessage]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setStatusMessage("Passwords do not match!");
      setStatusClass("errorMessage");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/change-password",
        {
          password,
          token: resetToken, // Send the token with the request
        }
      );

      if (response.data.success) {
        setStatusMessage("Password changed successfully!");
        setStatusClass("successMessage");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setStatusMessage(response.data.message || "An error occurred.");
        setStatusClass("errorMessage");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setStatusMessage("An error occurred. Please try again.");
      setStatusClass("errorMessage");
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password">
        <div className="page-title">EquiFi</div>
        <div className="wrapper">
          <form id="form" onSubmit={handleSubmit}>
            <h1>Reset Password</h1>
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
            <div className={statusClass}>{statusMessage}</div>
          </form>
        </div>
      </div>
    </div>
  );
}

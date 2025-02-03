import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamation } from "@fortawesome/free-solid-svg-icons";

export default function Login() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
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

  const loginUser = (event) => {
    event.preventDefault();
    axios
      .post("http://localhost:3002/login", {
        LoginEmail: loginEmail,
        LoginPassword: loginPassword,
      })
      .then((response) => {
        if (response.data.message) {
          setLoginStatus(response.data.message);
          console.log(loginStatus);
        } else {
          localStorage.setItem("isLoggedIn", "true");
          navigate("/dashboard");
        }
      });
  };

  const handleCloseWithFade = () => {
    const alertElement = document.querySelector(".alert");
    if (alertElement) {
      alertElement.classList.add("fade-out"); // Add fade-out animation
      setTimeout(() => setLoginStatus(""), 500); // Wait for animation to complete
    }
  };

  const renderStatusMessage = () => {
    switch (loginStatus) {
      case "Email not verified":
        return (
          <div className="alert warning">
            <FontAwesomeIcon icon={faExclamation} className="mr-2" />
            Your email is not verified
            <button className="alert close-btn" onClick={handleCloseWithFade}>
              X
            </button>
          </div>
        );
      case "Admin approval rejected":
        return (
          <div className="alert error">
            <FontAwesomeIcon icon={faExclamation} className="mr-2" />
            <div className="alert-text">
              Admin approval rejected. Try again
              <Link to="/rejection" className="link-retry">
                {" "}
                here
              </Link>
            </div>
            <button className="alert close-btn" onClick={handleCloseWithFade}>
              X
            </button>
          </div>
        );
      case "Admin approval pending":
        return (
          <div className="alert warning">
            <FontAwesomeIcon icon={faExclamation} className="mr-2" />
            Your account is pending admin approval
            <button className="alert close-btn" onClick={handleCloseWithFade}>
              X
            </button>
          </div>
        );
      case "Credentials error":
        return (
          <div className="alert error">
            <FontAwesomeIcon icon={faExclamation} className="mr-2" />
            Incorrect email or password
            <button className="alert close-btn" onClick={handleCloseWithFade}>
              X
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (loginStatus !== "") {
      const timer = setTimeout(() => {
        handleCloseWithFade();
      }, 5000); // Automatically fade out after 5 seconds
      return () => clearTimeout(timer); // Cleanup on unmount
    }
  }, [loginStatus]);

  axios.defaults.withCredentials = true;

  return (
    <div className="login-page">
      <div className="login">
        <div className="status-holder">{renderStatusMessage()}</div>
        <div className="page-title">EquiFi</div>
        <div className="wrapper">
          <form id="form">
            <h1>Login</h1>
            <div className="mb-3 input-box">
              <input
                className="form-control"
                id="email"
                autoComplete="off"
                placeholder="Email Address"
                onChange={(event) => {
                  setLoginEmail(event.target.value);
                }}
              />
            </div>
            <div className="mb-3 input-box">
              <input
                type="password"
                className="form-control"
                id="password"
                autoComplete="off"
                placeholder="Password"
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                }}
              />
            </div>
            <div className="forgot-password-container">
              <Link className="forgot-password" to="/forgotpassword">
                Forgot Password?
              </Link>
            </div>
            <div className="mb-3">
              <button type="submit" className="btn-login" onClick={loginUser}>
                Login
              </button>
            </div>
            <div className="register-text mb-3">
              <p>
                Don't have an account?
                <a href="/register" className="link-register">
                  Sign-up
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import portrait from "../imgs/default-pp.jpg";
import axios from "axios";
import "../Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faChartLine,
  faEye,
  faFolder,
  faUser,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function DashboardProfile() {
  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [modal, setModal] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    country: "",
    pronoun: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [inputValues, setInputValues] = useState({
    firstName: "",
    lastName: "",
    country: "",
  });
  const [selectedPronoun, setSelectedPronoun] = useState("");
  const [pronounInput, setPronoun] = useState("");
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check login status on component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get("http://localhost:3002", {
          withCredentials: true,
        });
        const { valid, email } = response.data;
        setIsLoggedIn(valid);
        setEmail(email || "");
        fetchProfileData(email || "");
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  // Effect to navigate to login page if user is not logged in
  useEffect(() => {
    if (isLoggedIn === false) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Function to toggle the modal visibility
  const toggleModal = () => {
    setModal(!modal);
  };

  // Effect to add or remove active-modal class to body based on modal states
  useEffect(() => {
    if (modal) {
      document.body.classList.add("active-modal");
    } else {
      document.body.classList.remove("active-modal");
    }
  }, [modal]);

  // Function to handle pronoun selection
  const handlePronounSelect = (pronoun) => {
    setPronoun(pronoun);
    setSelectedPronoun(pronoun);
  };

  // Function to save user profile data
  const handleSaveUser = async () => {
    const userData = {
      firstName: inputValues.firstName || profileData.firstName,
      lastName: inputValues.lastName || profileData.lastName,
      country: inputValues.country || profileData.country,
      pronoun: pronounInput || profileData.pronoun,
    };

    try {
      const response = await axios.post(
        "http://localhost:3002/save-data-profile",
        {
          email: email,
          userData: userData,
        }
      );

      if (response.status === 200) {
        setProfileData(userData);
        setEditMode(false);
        setPronoun(pronounInput || profileData.pronoun);
        setChangePasswordMode(false);
      } else {
        console.error("Unexpected response status: ", response.status);
      }
    } catch (error) {
      console.error("Error saving user data: ", error.message);
    }
  };

  // Function to fetch profile data for the given email
  const fetchProfileData = async (email) => {
    try {
      const response = await axios.post(
        "http://localhost:3002/get-profile-data",
        {
          email: email,
        }
      );
      if (response.status === 200) {
        setProfileData(response.data);
        setInputValues(response.data);
        setSelectedPronoun(response.data.pronoun);
      } else {
        console.error("Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error.message);
    }
  };

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:3002/logout", {
        withCredentials: true,
      });
      localStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to cancel editing mode
  const handleCancel = () => {
    setInputValues(profileData);
    setEditMode(false);
  };

  // Function to handle password change
  const handlePasswordChange = async () => {
    if (newPassword.trim() === "") {
      setErrorMessage("Please enter a password");
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage("Please input a password with at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/change-password",
        {
          email: email,
          newPassword: newPassword,
        }
      );

      if (response.status === 200) {
        setSuccessMessage("Password changed successfully");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
        setNewPassword("");
        setConfirmPassword("");
        setChangePasswordMode(false);
      } else {
        console.error("Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error.message);
    }
  };

  // Effect to reset password inputs and error message when change password mode is toggled
  useEffect(() => {
    if (!changePasswordMode) {
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage("");
    }
  }, [changePasswordMode]);

  // Function for toggling change password mode
  const toggleChangePasswordMode = () => {
    setChangePasswordMode((prevMode) => !prevMode);
  };

  // Function to enter edit mode
  const enterEditMode = () => {
    setEditMode(true);
    setChangePasswordMode(false);
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <nav className="menu">
          <Link to="/dashboard" className="menu-item">
            <FontAwesomeIcon icon={faHome} className="menu-icon" /> Dashboard
          </Link>
          <Link to="/dashboard/invest" className="menu-item">
            <FontAwesomeIcon icon={faChartLine} className="menu-icon" /> Invest
          </Link>
          <Link to="/dashboard/watchlist" className="menu-item">
            <FontAwesomeIcon icon={faEye} className="menu-icon" /> Watchlist
          </Link>
          <Link to="/dashboard/portfolios" className="menu-item">
            <FontAwesomeIcon icon={faFolder} className="menu-icon" /> Portfolios
          </Link>
        </nav>
        <div className="bottom-links">
          <Link to="/dashboard/profile" className="menu-item active">
            <FontAwesomeIcon icon={faUser} className="menu-icon" /> Profile
          </Link>
          <div className="menu-item" onClick={toggleModal}>
            <FontAwesomeIcon icon={faSignOutAlt} className="menu-icon" /> Log
            out
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="app-title-container">
          <div className="app-title">
            <h3>EquiFi</h3>
          </div>
        </div>
        <div className="profile-form">
          <div className="profile-header">
            <img src={portrait} alt="Profile" className="profile-pic" />
            <h3 className="email-profile">{email || "\u00A0"}</h3>
          </div>
          <div className="profile-info">
            <label htmlFor="firstName">
              First Name:{" "}
              {editMode ? (
                <input
                  type="text"
                  value={inputValues.firstName}
                  onChange={(e) =>
                    setInputValues({
                      ...inputValues,
                      firstName: e.target.value,
                    })
                  }
                  placeholder={profileData.firstName}
                />
              ) : (
                <span>{profileData.firstName}</span>
              )}
            </label>
            <label htmlFor="lastName">
              Last Name:{" "}
              {editMode ? (
                <input
                  type="text"
                  value={inputValues.lastName}
                  onChange={(e) =>
                    setInputValues({
                      ...inputValues,
                      lastName: e.target.value,
                    })
                  }
                  placeholder={profileData.lastName}
                />
              ) : (
                <span>{profileData.lastName}</span>
              )}
            </label>
            <label htmlFor="country">
              Country:{" "}
              {editMode ? (
                <input
                  type="text"
                  value={inputValues.country}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, country: e.target.value })
                  }
                  placeholder={profileData.country}
                />
              ) : (
                <span>{profileData.country}</span>
              )}
            </label>
            <div className="pronoun-selection">
              {editMode ? (
                <>
                  <label>
                    <input
                      type="radio"
                      name="pronoun"
                      value="Mr."
                      checked={selectedPronoun === "Mr."}
                      onChange={() => handlePronounSelect("Mr.")}
                    />
                    Mr.
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="pronoun"
                      value="Mrs."
                      checked={selectedPronoun === "Mrs."}
                      onChange={() => handlePronounSelect("Mrs.")}
                    />
                    Mrs.
                  </label>
                </>
              ) : (
                <span>Pronoun: {selectedPronoun}</span>
              )}
            </div>
          </div>
          <div className="profile-actions">
            {editMode ? (
              <>
                <button className="btn save" onClick={handleSaveUser}>
                  Save
                </button>
                <button className="btn cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            ) : (
              <div className="edit-wrapper">
                <button className="btn edit" onClick={enterEditMode}>
                  Edit
                </button>
              </div>
            )}
          </div>
          {!editMode && (
            <>
              {changePasswordMode ? (
                <div className="change-password">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage("");
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage("");
                    }}
                  />
                  <div className="change-password-actions">
                    <button
                      className="btn confirm"
                      onClick={handlePasswordChange}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn cancel"
                      onClick={() => setChangePasswordMode(false)}
                    >
                      Cancel
                    </button>
                  </div>
                  <span className="error-message">{errorMessage}</span>
                </div>
              ) : (
                <div className="change-password-wrapper">
                  <button
                    className="btn change"
                    onClick={toggleChangePasswordMode}
                  >
                    Change Password
                  </button>
                </div>
              )}
            </>
          )}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
        </div>
      </div>
      {modal && (
        <div className="modal-container">
          <div className="modal">
            <div onClick={toggleModal} className="overlay"></div>
            <div className="modal-content">
              <h2>Are you sure you want to log out?</h2>
              <Link to="/" className="custom-link">
                <button className="btn modal-yes-btn" onClick={handleLogout}>
                  Yes
                </button>
              </Link>
              <button className="btn modal-no-btn" onClick={toggleModal}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

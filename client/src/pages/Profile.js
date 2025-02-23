import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faChartLine,
  faEye,
  faFolder,
  faCheck,
  faExclamation,
} from "@fortawesome/free-solid-svg-icons";

export default function DashboardProfile() {
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [email, setEmail] = useState("");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    pronoun: "",
    country: "",
    city: "",
    state: "",
    zipCode: "",
    street: "",
    number: "",
    phoneNumber: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [inputValues, setInputValues] = useState({
    firstName: "",
    lastName: "",
    pronoun: "",
    country: "",
    city: "",
    state: "",
    zipCode: "",
    street: "",
    number: "",
    phoneNumber: "",
  });
  const [selectedPronoun, setSelectedPronoun] = useState("");
  const [pronounInput, setPronoun] = useState("");
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

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

  // Function to fetch profile data for the given email
  const fetchProfileData = async (email) => {
    try {
      const response = await axios.post(
        "http://localhost:3002/get-profile-data",
        { email }
      );

      if (response.status === 200) {
        const data = response.data;
        console.log("Fetched profile data:", data);
        setProfileData(data);

        // Ensure all fields have default empty string values
        setInputValues({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          pronoun: data.pronoun || "",
          country: data.country || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
          street: data.street || "",
          number: data.number || "",
          phoneNumber: data.phoneNumber || "",
        });

        setSelectedPronoun(data.pronoun || "");
      }
    } catch (error) {
      console.error("Error fetching profile data:", error.message);
    }
  };

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
      city: inputValues.city || profileData.city,
      state: inputValues.state || profileData.state,
      zipCode: inputValues.zipCode || profileData.zipCode,
      street: inputValues.street || profileData.street,
      number: inputValues.number || profileData.number,
      phoneNumber: inputValues.phoneNumber || profileData.phoneNumber,
    };

    console.log("Saving userData:", userData);

    try {
      const response = await axios.post(
        "http://localhost:3002/save-data-profile",
        {
          email: email,
          userData: userData,
        }
      );

      if (response.status === 200) {
        console.log("Saved successfully:", response.data);
        setProfileData({
          ...userData,
          email: profileData.email,
        });
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

  const resetModes = () => {
    setEditMode(false);
    setChangePasswordMode(false);
    setAlert(null);
  };

  // Function to handle password change
  const handlePasswordChange = async () => {
    if (!currentPassword.trim()) {
      setAlert({
        type: "warning",
        message: "Please enter your current password",
      });
      return;
    }
    if (!newPassword.trim()) {
      setAlert({ type: "warning", message: "Please enter a new password" });
      return;
    }
    if (newPassword.length < 4) {
      setAlert({
        type: "warning",
        message: "Password must be at least 4 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ type: "warning", message: "Passwords do not match" });
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/change-password",
        {
          email,
          currentPassword,
          newPassword,
        }
      );

      if (response.status === 200) {
        setAlert({ type: "success", message: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setAlert(null);
          setChangePasswordMode(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error changing password:", error.message);

      // Check for specific error response
      if (error.response) {
        if (error.response.status === 401) {
          setAlert({
            type: "warning",
            message: "Incorrect current password",
          });
        } else {
          setAlert({
            type: "error",
            message:
              error.response.data.message || "Error occurred. Try again.",
          });
        }
      } else {
        setAlert({
          type: "error",
          message: "Error occurred. Try again.",
        });
      }
    }
  };

  // Effect to reset password inputs and error message when change password mode is toggled
  useEffect(() => {
    if (!changePasswordMode) {
      setNewPassword("");
      setConfirmPassword("");
      setAlert(null);
    }
  }, [changePasswordMode]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        handleCloseWithFade();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleCloseWithFade = () => {
    const alertElement = document.querySelector(".alert");
    if (alertElement) {
      alertElement.classList.add("fade-out");
      setTimeout(() => {
        if (alertElement.classList.contains("fade-out")) {
          setAlert(null);
        }
      }, 500);
    } else {
      setAlert(null);
    }
  };

  const renderAlert = () => {
    if (!alert) return null;
    const { type, message } = alert;
    const alertClass = `alert ${type}`;

    return (
      <div className={alertClass}>
        <FontAwesomeIcon
          icon={type === "success" ? faCheck : faExclamation}
          className="mr-2"
        />
        {message}
        <button className="alert close-btn" onClick={handleCloseWithFade}>
          X
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Sidebar Section */}
      <div className="sidebar">
        <div className="app-title-container">
          <div className="app-title">
            <h3>EquiFi</h3>
          </div>
        </div>
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
      </div>
      <div className="main-content profile-page">
        <div className="status-holder">{renderAlert()}</div>
        <div className="profile-container">
          <h2 className="profile-title">
            {changePasswordMode ? "Change Password" : "Profile Information"}
          </h2>
          <hr className="profile-divider" />
          <div className="profile-content">
            {changePasswordMode ? (
              <>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={inputValues.firstName ?? ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          firstName: e.target.value,
                        })
                      }
                      disabled={!editMode}
                    />
                  </div>
                  <div className="profile-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={inputValues.lastName ?? ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          lastName: e.target.value,
                        })
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData.email ?? ""}
                      disabled
                    />
                  </div>
                  <div className="profile-field">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={inputValues.phoneNumber ?? ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          phoneNumber: e.target.value,
                        })
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>Pronoun</label>
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
                        <input
                          type="text"
                          value={inputValues.pronoun}
                          onChange={(e) =>
                            setInputValues({
                              ...inputValues,
                              pronoun: e.target.value,
                            })
                          }
                          disabled={!editMode}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <hr className="profile-divider" />
                <div className="profile-row">
                  <div className="profile-field">
                    <label>Country</label>
                    <input
                      type="text"
                      value={profileData.country ?? ""}
                      disabled
                    />
                  </div>
                  <div className="profile-field">
                    <label>City</label>
                    <input
                      type="text"
                      value={inputValues.city ?? ""}
                      onChange={(e) =>
                        setInputValues({ ...inputValues, city: e.target.value })
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>State</label>
                    <input
                      type="text"
                      value={inputValues.state ?? ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          state: e.target.value,
                        })
                      }
                      disabled={!editMode}
                    />
                  </div>
                  <div className="profile-field">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={inputValues.zipCode ?? ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          zipCode: e.target.value,
                        })
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>
                <div className="profile-row">
                  <div className="profile-field">
                    <label>Street</label>
                    <input
                      type="text"
                      value={inputValues.street ?? ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          street: e.target.value,
                        })
                      }
                      disabled={!editMode}
                    />
                  </div>
                  <div className="profile-field">
                    <label>Street Number</label>
                    <input
                      type="text"
                      value={inputValues.number ?? ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          number: e.target.value,
                        })
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <hr className="profile-divider" />
          <div className="profile-actions">
            {editMode ? (
              <>
                <button className="btn-profile save" onClick={handleSaveUser}>
                  Save
                </button>
                <button className="btn-profile cancel" onClick={resetModes}>
                  Cancel
                </button>
              </>
            ) : changePasswordMode ? (
              <>
                <button
                  className="btn-profile update-password"
                  onClick={handlePasswordChange}
                >
                  Update Password
                </button>
                <button className="btn-profile exit" onClick={resetModes}>
                  Exit
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-profile edit"
                  onClick={() => {
                    setEditMode(true);
                    setChangePasswordMode(false);
                  }}
                >
                  Edit Profile
                </button>
                <button
                  className="btn-profile change-password"
                  onClick={() => {
                    setChangePasswordMode(true);
                    setEditMode(false);
                  }}
                >
                  Change Password
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

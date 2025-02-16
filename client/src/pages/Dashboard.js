import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import "../Modal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faChartLine,
  faEye,
  faFolder,
  faUser,
  faSignOutAlt,
  faUserCog,
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRequests, setAdminRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Effect to check login status when component mounts
  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log("Checking login status...");
      try {
        const response = await axios.get(`${API_URL}/`, {
          withCredentials: true,
        });
        const { valid, firstName, lastName, admin } = response.data;
        console.log("Login status response:", response.data);
        setIsLoggedIn(valid);
        setFirstName(firstName || "");
        setLastName(lastName || "");
        setIsAdmin(admin || false);

        if (admin) {
          fetchAdminRequests(); // Fetch admin verification requests if user is an admin
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    // Function to fetch admin requests if user is an admin
    const fetchAdminRequests = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/verify-requests`, {
          withCredentials: true,
        });
        setAdminRequests(response.data || []);
      } catch (error) {
        console.error("Error fetching admin requests:", error);
      }
    };

    checkLoginStatus();
  }, [API_URL]);

  // Effect to navigate to login page if user is not logged in
  useEffect(() => {
    console.log("isLoggedIn state updated:", isLoggedIn);
    if (isLoggedIn === false) {
      console.log("Redirecting to /...");
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      await axios.get(`${API_URL}/logout`, {
        withCredentials: true,
      });
      setIsLoggedIn(false);
      localStorage.setItem("isLoggedIn", "false");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to update admin status of a user
  const updateAdminStatus = async (email, status) => {
    try {
      await axios.post(
        `${API_URL}/admin/update-verify-status`,
        {
          email,
          status,
        },
        {
          withCredentials: true,
        }
      );
      setAdminRequests(
        adminRequests.filter((request) => request.email !== email)
      );
    } catch (error) {
      console.error("Error updating admin status:", error);
    }
  };

  const menuRef = useRef(null);
  useEffect(() => {
    let handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        console.log(
          "Clicked outside:",
          e.target,
          menuRef.current.contains(e.target)
        );
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [menuRef]);

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a reason for rejection.",
      });
      return;
    }

    if (!selectedRequest) {
      setMessage({
        type: "error",
        text: "No application selected for rejection.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send rejection reason and status update
      await axios.post(
        `${API_URL}/admin/reject-application`,
        {
          email: selectedRequest.email,
          rejectionReason,
        },
        { withCredentials: true }
      );

      setMessage({
        type: "success",
        text: "Rejection email sent successfully.",
      });

      await updateAdminStatus(selectedRequest.email, "Rejected");

      // Remove the rejected request from the list
      setAdminRequests((prevRequests) => {
        const newRequests = prevRequests.filter(
          (req) => req.email !== selectedRequest.email
        );
        // Adjust currentIndex if it's out-of-bounds:
        if (currentIndex >= newRequests.length) {
          setCurrentIndex(newRequests.length - 1);
        }
        return newRequests;
      });

      // Clear the form and UI state
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting application:", error);
      setMessage({ type: "error", text: "Failed to reject application." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = `${firstName.charAt(0).toUpperCase()}${lastName
    .charAt(0)
    .toUpperCase()}`;

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === adminRequests.length - 1 ? prevIndex : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? prevIndex : prevIndex - 1
    );
  };

  return (
    <div className="dashboard">
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
      <div className="main-content-dashboard">
        <div className="profile-dropdown-dashboard">
          <div className="nav-menu" ref={menuRef}>
            <div className="menu-trigger">
              <button className="avatar-button" onClick={() => setOpen(!open)}>
                <div className="avatar-wrapper">
                  <div className="avatar-placeholder">{initials}</div>
                </div>
              </button>
            </div>
            <div
              className={`dropdown-menu-dashboard ${
                open ? "active" : "inactive"
              }`}
            >
              <div className="account-info">
                <div className="account-initial">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="account-details">
                  <div className="full-name">
                    {firstName} {lastName}
                  </div>
                </div>
              </div>
              <div className="dropdown-links">
                <Link to="/dashboard/profile" className="dropdown-item">
                  <FontAwesomeIcon icon={faUser} className="menu-icon" />
                  Profile
                </Link>
                <Link to="/dashboard/profile" className="dropdown-item">
                  <FontAwesomeIcon icon={faUserCog} className="menu-icon" />
                  Settings
                </Link>
                <div className="dropdown-item" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="menu-icon" />
                  Log out
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content">
          {isAdmin && adminRequests.length > 0 ? (
            <div className="admin-requests">
              <h3 className="admin-title">Admin Verification Requests</h3>
              {message.text && message.type === "success" && (
                <div className="message message-success">{message.text}</div>
              )}

              <div className="request-carousel">
                <div className="carousel-controls">
                  <button
                    className="carousel-nav-button"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                  >
                    ← Previous
                  </button>
                  <span className="carousel-counter">
                    Request {currentIndex + 1} of {adminRequests.length}
                  </span>
                  <button
                    className="carousel-nav-button"
                    onClick={goToNext}
                    disabled={currentIndex === adminRequests.length - 1}
                  >
                    Next →
                  </button>
                </div>

                <div className="request-card">
                  <div className="request-info">
                    <div className="info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].email}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">First Name</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].firstName}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Name</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].lastName}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Country</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].country}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">State</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].state}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Street</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].street}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Number</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].number}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Zip Code</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].zipCode}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone Number</span>
                      <span className="info-value">
                        {adminRequests[currentIndex].phoneNumber}
                      </span>
                    </div>
                  </div>

                  <div className="ci-photo-container">
                    <img
                      src={adminRequests[currentIndex].CIPhoto}
                      alt="CI"
                      className="ci-photo"
                    />
                  </div>

                  <div className="button-group">
                    <button
                      className="btn btn-reject"
                      onClick={() =>
                        setSelectedRequest(adminRequests[currentIndex])
                      }
                    >
                      Reject
                    </button>
                    <button
                      className="btn btn-accept"
                      onClick={() =>
                        updateAdminStatus(
                          adminRequests[currentIndex].email,
                          "Accepted"
                        )
                      }
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>

              {selectedRequest && (
                <div
                  className="rejection-overlay"
                  onClick={() => setSelectedRequest(null)}
                ></div>
              )}

              {selectedRequest && message.text && message.type === "error" && (
                <div className="message message-error rejection-message">
                  {message.text}
                </div>
              )}

              {selectedRequest && (
                <div className="rejection-form">
                  <h3>Reject Application</h3>
                  <p>
                    Rejecting application for:{" "}
                    <strong>{selectedRequest.email}</strong>
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                    rows={4}
                  />
                  <div className="rejection-actions">
                    <button
                      className="btn btn-cancel"
                      onClick={() => setSelectedRequest(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-submit"
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="welcome-content">
              <h2 className="welcome-title">
                Welcome to EquiFi, {firstName} {lastName}!
              </h2>
              <p className="welcome-description">
                We're excited to have you on board. EquiFi is your gateway to
                building and managing your financial portfolios with ease.
              </p>
              <div className="welcome-cta">
                <p>Ready to take the first step?</p>
                <Link to="/dashboard/invest" className="btn-primary">
                  Create Your First Portfolio
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamation, faCheck } from "@fortawesome/free-solid-svg-icons"; // Imported both icons
import "../Register.css";
import "../Login.css";

export default function ResubmitData() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    email: "",
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
    CIPhoto: null,
  });
  const [confirmEmail, setConfirmEmail] = useState("");
  const [fileName, setFileName] = useState("No file chosen");
  const [alert, setAlert] = useState(null);
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

  // Function to trim the file name if too long
  const truncateFileName = (name, maxLength = 14) => {
    if (name.length <= maxLength) return name;
    const fileExtension = name.slice(name.lastIndexOf("."));
    const baseName = name.slice(0, maxLength - fileExtension.length - 2);
    return `${baseName}..${fileExtension}`;
  };

  // Auto-dismiss alert after 5 seconds (with fade-out)
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
      setTimeout(() => setAlert(null), 500);
    }
  };

  const renderErrorMessage = () => {
    if (!alert) return null;
    const { type, message } = alert;
    let alertClass = "";
    if (type === "error") {
      alertClass = "alert error";
    } else if (type === "success") {
      alertClass = "alert success";
    } else {
      alertClass = "alert warning";
    }
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

  // Fetch existing profile data (e.g., from localStorage)
  useEffect(() => {
    const email = localStorage.getItem("userEmail"); // adjust as needed
    if (email) {
      axios
        .post("http://localhost:3002/get-profile-data", { email })
        .then((response) => {
          const data = response.data;
          setUserData({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            pronoun: data.pronoun,
            country: data.country,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            street: data.street,
            number: data.number,
            phoneNumber: data.phoneNumber,
            CIPhoto: null, // File not auto-filled
          });
          setConfirmEmail(data.email);
        })
        .catch((err) => console.error("Error fetching profile data", err));
    }
  }, []);

  // Handle file input changes
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUserData({ ...userData, CIPhoto: file });
      setFileName(truncateFileName(file.name));
    }
  };

  const handleNextStep = () => {
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      setAlert({ type: "warning", message: "Please enter a valid email." });
      return;
    }
    if (userData.email !== confirmEmail) {
      setAlert({ type: "warning", message: "Emails do not match." });
      return;
    }
    // Then, check email fields
    if (!userData.firstName || !/^[\p{L}\s'-]+$/u.test(userData.firstName)) {
      setAlert({ type: "warning", message: "Invalid First name." });
      return;
    }
    // Validate last name
    if (!userData.lastName || !/^[\p{L}\s'-]+$/u.test(userData.lastName)) {
      setAlert({ type: "warning", message: "Invalid Last name." });
      return;
    }
    // Then, check phone number (only digits)
    if (!userData.phoneNumber || !/^\d+$/.test(userData.phoneNumber)) {
      setAlert({
        type: "warning",
        message: "Phone Number can only contain numbers.",
      });
      return;
    }
    // And check pronoun selection
    if (!userData.pronoun) {
      setAlert({ type: "warning", message: "Please select a pronoun." });
      return;
    }
    setStep(2);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleResubmit = (e) => {
    e.preventDefault();
    // Validate address fields using similar checks as Register
    if (!userData.country || !/^[\p{L}\s'-]+$/u.test(userData.country)) {
      setAlert({
        type: "warning",
        message: "Invalid Country.",
      });
      return;
    }
    if (!userData.city || !/^[\p{L}\s'-]+$/u.test(userData.city)) {
      setAlert({
        type: "warning",
        message: "Invalid City.",
      });
      return;
    }
    if (!userData.state || !/^[\p{L}\s'-]+$/u.test(userData.state)) {
      setAlert({
        type: "warning",
        message: "Invalid State.",
      });
      return;
    }
    if (!userData.zipCode || !/^\d{4,10}$/.test(userData.zipCode)) {
      setAlert({
        type: "warning",
        message: "Zip/Postal Code must contain 4 to 10 digits.",
      });
      return;
    }
    if (!userData.street) {
      setAlert({
        type: "warning",
        message: "Please enter a street name.",
      });
      return;
    }
    if (!userData.number || !/^\d+$/.test(userData.number)) {
      setAlert({
        type: "warning",
        message: "Street Number must be a valid number.",
      });
      return;
    }
    if (!userData.CIPhoto) {
      setAlert({
        type: "warning",
        message: "Please upload a CI photo.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("Email", userData.email);
    formData.append("FirstName", userData.firstName);
    formData.append("LastName", userData.lastName);
    formData.append("Pronoun", userData.pronoun);
    formData.append("Country", userData.country);
    formData.append("City", userData.city);
    formData.append("State", userData.state);
    formData.append("ZipCode", userData.zipCode);
    formData.append("Street", userData.street);
    formData.append("Number", userData.number);
    formData.append("PhoneNumber", userData.phoneNumber);
    formData.append("CIPhoto", userData.CIPhoto);

    axios
      .post("http://localhost:3002/resubmit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        if (response.data.message) {
          setAlert({ type: "success", message: response.data.message });
          // Navigate to Log in page after a short delay
          setTimeout(() => navigate("/login"), 3000);
        }
      })
      .catch((error) => {
        console.error("Resubmit error:", error);
        setAlert({ type: "error", message: "Resubmit failed. Try again." });
      });
  };

  return (
    <div className="register-page">
      <div className="register">
        <div className="page-title">EquiFi</div>
        <div className="status-holder">{renderErrorMessage()}</div>
        <div className="wrapper">
          {step === 1 && (
            <>
              <h1>Update Your Data</h1>
              <form>
                {/* Email Fields first */}
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Email"
                    value={userData.email}
                    onChange={(e) =>
                      setUserData({ ...userData, email: e.target.value })
                    }
                  />
                </div>
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Confirm Email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                  />
                </div>
                {/* Then Name Fields */}
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={userData.firstName}
                    onChange={(e) =>
                      setUserData({ ...userData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={userData.lastName}
                    onChange={(e) =>
                      setUserData({ ...userData, lastName: e.target.value })
                    }
                  />
                </div>
                {/* Then Phone Number */}
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={userData.phoneNumber}
                    onChange={(e) =>
                      setUserData({ ...userData, phoneNumber: e.target.value })
                    }
                  />
                </div>
                {/* Pronoun selection */}
                <div className="input-box pronouns">
                  <label>Pronouns:</label>
                  <label>
                    <input
                      type="radio"
                      name="pronoun"
                      value="Mr"
                      checked={userData.pronoun === "Mr"}
                      onChange={(e) =>
                        setUserData({ ...userData, pronoun: e.target.value })
                      }
                    />
                    Mr.
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="pronoun"
                      value="Mrs"
                      checked={userData.pronoun === "Mrs"}
                      onChange={(e) =>
                        setUserData({ ...userData, pronoun: e.target.value })
                      }
                    />
                    Mrs.
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-next"
                >
                  Next
                </button>
              </form>
            </>
          )}
          {step === 2 && (
            <>
              <h1>Update Your Address & CI Photo</h1>
              <form onSubmit={handleResubmit}>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Country"
                    value={userData.country}
                    onChange={(e) =>
                      setUserData({ ...userData, country: e.target.value })
                    }
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="City"
                    value={userData.city}
                    onChange={(e) =>
                      setUserData({ ...userData, city: e.target.value })
                    }
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="State/Province"
                    value={userData.state}
                    onChange={(e) =>
                      setUserData({ ...userData, state: e.target.value })
                    }
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Zip/Postal Code"
                    value={userData.zipCode}
                    onChange={(e) =>
                      setUserData({ ...userData, zipCode: e.target.value })
                    }
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Street"
                    value={userData.street}
                    onChange={(e) =>
                      setUserData({ ...userData, street: e.target.value })
                    }
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Number"
                    value={userData.number}
                    onChange={(e) =>
                      setUserData({ ...userData, number: e.target.value })
                    }
                  />
                </div>
                <div className="input-box file-input">
                  <label className="file-label" htmlFor="CIPhoto">
                    Upload CI Photo
                  </label>
                  <input
                    type="file"
                    id="CIPhoto"
                    name="CIPhoto"
                    onChange={handleFileChange}
                  />
                  <span className="file-chosen">{fileName}</span>
                </div>
                <div className="register-buttons-wrapper">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="btn-back"
                  >
                    Back
                  </button>
                  <button type="submit" className="btn-register">
                    Resubmit
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamation, faCheck } from "@fortawesome/free-solid-svg-icons";
import "../Register.css";
import "../Login.css";

export default function Register() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3002";

  // State variables
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [CIPhoto, setCIPhoto] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [alert, setAlert] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/`, {
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
  }, [isLoggedIn, API_URL]);

  useEffect(() => {
    if (isLoggedIn === true) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        handleCloseWithFade(); // Use fade-out animation
      }, 5000); // 5000 ms (5 seconds)
      return () => clearTimeout(timer); // Cleanup on unmount or alert change
    }
  }, [alert]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        handleCloseWithFade(); // Use fade-out animation
      }, 5000); // 5000 ms (5 seconds)
      return () => clearTimeout(timer); // Cleanup on unmount or alert change
    }
  }, [alert]);

  const handleCloseWithFade = () => {
    const alertElement = document.querySelector(".alert");
    if (alertElement) {
      alertElement.classList.add("fade-out"); // Add fade-out animation class
      setTimeout(() => setAlert(null), 500); // Wait for the animation to finish before clearing
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
        {/* Use a check icon for success and exclamation for others */}
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

  // Function to handle user registration
  const handleNextStep = () => {
    if (step === 1) {
      if (
        !firstName ||
        !/^(?!.*[-'’]{2})[A-Za-zÀ-ÖØ-öø-ÿ\s-'’]{1,50}$/.test(firstName)
      ) {
        setAlert({
          type: "warning",
          message: "Invalid First name.",
        });
        return;
      }
      if (
        !lastName ||
        !/^(?!.*[-'’]{2})[A-Za-zÀ-ÖØ-öø-ÿ\s-'’]{1,50}$/.test(lastName)
      ) {
        setAlert({
          type: "warning",
          message: "Invalid Last name.",
        });
        return;
      }
      if (
        email.trim() === "" ||
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
      ) {
        setAlert({ type: "warning", message: "Please enter a valid email." });
        return;
      }
      if (email !== confirmEmail) {
        setAlert({ type: "warning", message: "Emails do not match." });
        return;
      }
      if (password.trim() === "") {
        setAlert({
          type: "warning",
          message: "Password cannot be empty.",
        });
        return;
      }

      if (password.length < 12) {
        setAlert({
          type: "warning",
          message: "Password must be at least 12 characters long.",
        });
        return;
      }

      if (!/[A-Z]/.test(password)) {
        setAlert({
          type: "warning",
          message: "Password must contain at least one uppercase letter.",
        });
        return;
      }

      if (!/[a-z]/.test(password)) {
        setAlert({
          type: "warning",
          message: "Password must contain at least one lowercase letter.",
        });
        return;
      }

      if (!/\d/.test(password)) {
        setAlert({
          type: "warning",
          message: "Password must contain at least one number.",
        });
        return;
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setAlert({
          type: "warning",
          message:
            "Password must contain at least one special character (!@#$%^&*).",
        });
        return;
      }
      if (password !== confirmPassword) {
        setAlert({ type: "warning", message: "Passwords do not match." });
        return;
      }
      if (phoneNumber.trim() === "" || !/^\d+$/.test(phoneNumber)) {
        setAlert({
          type: "warning",
          message: "Phone Number can only contain numbers.",
        });
        return;
      }
      if (!pronoun) {
        setAlert({ type: "warning", message: "Please select a pronoun." });
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleRegister = (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    if (!country || !/^[\p{L}\s'-]+$/u.test(country)) {
      setAlert({
        type: "warning",
        message: "Invalid Country.",
      });
      setIsSubmitting(false);
      return;
    }
    if (!city || !/^[\p{L}\s'-]+$/u.test(city)) {
      setAlert({
        type: "warning",
        message: "Invalid City.",
      });
      setIsSubmitting(false);
      return;
    }
    if (!state || !/^[\p{L}\s'-]+$/u.test(state)) {
      setAlert({
        type: "warning",
        message: "Invalid State.",
      });
      setIsSubmitting(false);
      return;
    }
    if (!zipCode || !/^\d{4,10}$/.test(zipCode)) {
      setAlert({
        type: "warning",
        message: "Zip/Postal Code must contain 4 to 10 digits.",
      });
      setIsSubmitting(false);
      return;
    }
    if (!street) {
      setAlert({ type: "warning", message: "Please enter a street name." });
      setIsSubmitting(false);
      return;
    }
    if (!number || !/^\d+$/.test(number)) {
      setAlert({
        type: "warning",
        message: "Street Number must be a valid number.",
      });
      setIsSubmitting(false);
      return;
    }
    if (!CIPhoto) {
      setAlert({ type: "warning", message: "Please upload a CI photo." });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("Email", email);
    formData.append("Password", password);
    formData.append("FirstName", firstName);
    formData.append("LastName", lastName);
    formData.append("Pronoun", pronoun);
    formData.append("Country", country);
    formData.append("City", city);
    formData.append("State", state);
    formData.append("ZipCode", zipCode);
    formData.append("Street", street);
    formData.append("Number", number);
    formData.append("PhoneNumber", phoneNumber);
    formData.append("CIPhoto", CIPhoto);

    axios
      .post(`${API_URL}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        if (response.data.message === "User added!") {
          // Show success alert with check icon
          setAlert({ type: "success", message: "Registration successful!" });
          // Redirect to Log in page after 3 seconds
          setTimeout(() => navigate("/login"), 4000);
        } else {
          setAlert({ type: "error", message: "Email is already registered." });
          setIsSubmitting(false);
        }
      })
      .catch(() => {
        setAlert({
          type: "error",
          message: "Registration failed. Please try again.",
        });
        setIsSubmitting(false);
      });
  };

  const truncateFileName = (name, maxLength = 14) => {
    if (name.length <= maxLength) return name;

    const fileExtension = name.slice(name.lastIndexOf("."));
    const baseName = name.slice(0, maxLength - fileExtension.length - 2); // Leave space for ".."
    return `${baseName}..${fileExtension}`;
  };

  return (
    <div className="register-page">
      <div className="register">
        <div className="page-title">EquiFi</div>
        <div className="status-holder">{renderErrorMessage()}</div>
        <div className="wrapper">
          {step === 1 && (
            <>
              <h1>Sign-Up</h1>
              <form>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <div className="input-box">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="input-box pronouns">
                  <label>Pronouns:</label>
                  <label>
                    <input
                      type="radio"
                      name="pronoun"
                      value="Mr"
                      checked={pronoun === "Mr"}
                      onChange={(event) => {
                        setPronoun(event.target.value);
                      }}
                    />
                    Mr.
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="pronoun"
                      value="Mrs"
                      checked={pronoun === "Mrs"}
                      onChange={(event) => {
                        setPronoun(event.target.value);
                      }}
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
                <div className="register-link">
                  <p>
                    Already have an account? <a href="/login">Log in</a>
                  </p>
                </div>
              </form>
            </>
          )}
          {step === 2 && (
            <>
              <h1>Sign-Up</h1>
              <form onSubmit={handleRegister}>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="State/Province"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Zip/Postal Code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
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
                    onChange={(event) => {
                      if (event.target.files && event.target.files[0]) {
                        const file = event.target.files[0];
                        if (!file.type.startsWith("image/")) {
                          setCIPhoto(null);
                          setFileName("No file chosen");
                        } else {
                          setCIPhoto(file);
                          setFileName(truncateFileName(file.name));
                        }
                      } else {
                        setCIPhoto(null);
                        setFileName("No file chosen");
                      }
                    }}
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
                    Register
                  </button>
                </div>
              </form>
              <div className="register-link">
                <p>
                  Already have an account? <a href="/login">Log in</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

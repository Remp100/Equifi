import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamation, faCheck } from "@fortawesome/free-solid-svg-icons";
import "../Register.css";
import "../Login.css";

export default function Register() {
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

  const navigateTo = useNavigate();

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
      if (email.trim() === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setAlert({ type: "warning", message: "Please enter a valid email." });
        return;
      }
      if (email !== confirmEmail) {
        setAlert({ type: "warning", message: "Emails do not match." });
        return;
      }
      if (password.trim() === "" || password.length < 4) {
        setAlert({
          type: "warning",
          message: "Password must be at least 4 characters long.",
        });
        return;
      }
      if (password !== confirmPassword) {
        setAlert({ type: "warning", message: "Passwords do not match." });
        return;
      }
      if (!firstName || !/^[\p{L}\s'-]+$/u.test(firstName)) {
        setAlert({
          type: "warning",
          message: "Invalid First name.",
        });
        return;
      }
      if (!lastName || !/^[\p{L}\s'-]+$/u.test(lastName)) {
        setAlert({
          type: "warning",
          message: "Invalid Last name.",
        });
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
    if (!country || !/^[\p{L}\s'-]+$/u.test(country)) {
      setAlert({
        type: "warning",
        message: "Invalid Country.",
      });
      return;
    }
    if (!city || !/^[\p{L}\s'-]+$/u.test(city)) {
      setAlert({
        type: "warning",
        message: "Invalid City.",
      });
      return;
    }
    if (!state || !/^[\p{L}\s'-]+$/u.test(state)) {
      setAlert({
        type: "warning",
        message: "Invalid State.",
      });
      return;
    }
    if (!zipCode || !/^\d{4,10}$/.test(zipCode)) {
      setAlert({
        type: "warning",
        message: "Zip/Postal Code must contain 4 to 10 digits.",
      });
      return;
    }
    if (!street) {
      setAlert({ type: "warning", message: "Please enter a street name." });
      return;
    }
    if (!number || !/^\d+$/.test(number)) {
      setAlert({
        type: "warning",
        message: "Street Number must be a valid number.",
      });
      return;
    }
    if (!CIPhoto) {
      setAlert({ type: "warning", message: "Please upload a CI photo." });
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
      .post("http://localhost:3002/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        if (response.data.message === "User added!") {
          // Show success alert with check icon
          setAlert({ type: "success", message: "Registration successful!" });
          // Redirect to Log in page after 3 seconds
          setTimeout(() => navigateTo("/login"), 4000);
        } else {
          setAlert({ type: "error", message: "Email is already registered." });
        }
      })
      .catch(() => {
        setAlert({
          type: "error",
          message: "Registration failed. Please try again.",
        });
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
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Last Name"
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Confirm Email"
                    onChange={(e) => setConfirmEmail(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Phone Number"
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
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="City"
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="State/Province"
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Zip/Postal Code"
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Street"
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Number"
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

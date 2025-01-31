import React from "react";

export default function NoPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.errorCode}>404</h1>
      <h2 style={styles.errorMessage}>Oops! Page Not Found</h2>
      <p style={styles.errorDescription}>
        The page you are looking for doesn't exist or an error occurred.
      </p>
      <a href="/" style={styles.homeLink}>
        Go Back to Home
      </a>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    color: "#333",
    fontFamily: "Arial, sans-serif",
  },
  errorCode: {
    fontSize: "6rem",
    fontWeight: "bold",
    color: "#ff6b6b",
  },
  errorMessage: {
    fontSize: "2rem",
    margin: "1rem 0",
  },
  errorDescription: {
    fontSize: "1rem",
    marginBottom: "2rem",
    color: "#555",
  },
  homeLink: {
    fontSize: "1rem",
    textDecoration: "none",
    padding: "0.5rem 1rem",
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: "5px",
    transition: "background-color 0.3s",
  },
};

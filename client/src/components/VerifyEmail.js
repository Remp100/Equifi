import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

const EmailVerify = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:3002/verify/${token}`).catch((error) => {
      console.error("Verification error:", error.response?.data || error);
      // Redirect to your invalid page (assuming your 404 route is '/404')
      navigate("/404");
    });
  }, [token, navigate]);

  return (
    <div className="login-page">
      <div className="login">
        <div className="page-title">EquiFi</div>
        <div className="wrapper">
          <div className="check-circle">
            <svg
              className="check-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1>Email verified</h1>
          <div className="button-box">
            <Link to="/login">
              <button className="btn-login">Log in</button>
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        .wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 420px;
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
          color: #fff;
          border-radius: 10px;
          padding: 30px 40px;
        }
        .check-circle {
          width: 80px;
          height: 80px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .check-icon {
          width: 40px;
          height: 40px;
          color: #fff;
        }
        h1 {
          font-size: 36px;
          text-align: center;
          margin: 20px 0;
          color: #fff;
        }
        .button-box {
          width: 100%;
          margin: 30px 0;
        }
        .btn-login {
          width: 100%;
          height: 45px;
          background: #fff;
          color: #333;
          border: none;
          outline: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .btn-login:hover {
          background-color: rgba(255, 255, 255, 0.9);
        }
        a {
          text-decoration: none;
          color: inherit;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default EmailVerify;

import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

const EmailVerify = () => {
  const { token } = useParams();
  const navigateTo = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:3002/verify/${token}`).catch((error) => {
      console.error(error);
    });
  }, [token, navigateTo]);

  return (
    <div>
      <h2>Email verified</h2>
      <Link to="/login">
        <button>Log in</button>
      </Link>
    </div>
  );
};

export default EmailVerify;

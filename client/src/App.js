import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordChange from "./pages/ForgotPasswordChange";
import Dashboard from "./pages/Dashboard";
import Invest from "./pages/Invest";
import Portfolios from "./pages/Portfolios";
import Profile from "./pages/Profile";
import Watchlist from "./pages/Watchlist";
import NoPage from "./pages/NoPage";
import VerifyEmail from "./components/VerifyEmail";

export default function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" index element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route
            path="/forgotpasswordchange/:resetToken"
            element={<ForgotPasswordChange />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/invest" element={<Invest />} />
          <Route path="/dashboard/portfolios" element={<Portfolios />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/watchlist" element={<Watchlist />} />
          <Route path="*" element={<NoPage />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

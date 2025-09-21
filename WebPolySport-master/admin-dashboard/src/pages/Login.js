// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}> Admin Login</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            name="email"
            placeholder="📧 Email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="🔑 Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              style={{ ...styles.input, paddingRight: "40px" }}
              required
            />
            <span
              style={styles.eyeIcon}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "⏳ Đang đăng nhập..." : "Đăng nhập"}
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "sans-serif",
  },
  card: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    width: "100%",
    maxWidth: "420px",
    animation: "fadeIn 0.5s ease",
  },
  title: {
    textAlign: "center",
    marginBottom: "2rem",
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  input: {
    padding: "0.85rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    outline: "none",
    transition: "0.3s",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: "12px",
    cursor: "pointer",
    fontSize: "1.2rem",
    userSelect: "none",
  },
  button: {
    padding: "0.9rem",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s",
  },
  error: {
    color: "red",
    fontSize: "0.9rem",
    textAlign: "center",
  },
};


export default Login;

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // Adjust this import based on your project structure
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/login"); // redirect after successful signup
    } catch (error) {
      console.error("Signup error:", error.message);
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ width: "28rem" }}>
        <h2 className="text-center mb-4 text-success">Create Your ZenList Account</h2>

        {errorMsg && (
          <div className="alert alert-danger text-center" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup}>
        <div className="mb-3">
            <label htmlFor="email" className="form-label fw-bold">User Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              required
              placeholder="Enter your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-bold">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-bold">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              required
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label fw-bold">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="d-grid mb-3">
            <button type="submit" className="btn btn-success fw-bold">Sign Up</button>
          </div>

          <div className="text-center">
            <small>
              Already have an account?{" "}
              <a href="/login" className="text-decoration-none text-primary fw-semibold">Login here</a>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

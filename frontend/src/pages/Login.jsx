import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Firebase config
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate inputs
    if (!email || !password) {
      return setError("Please fill in all fields");
    }
    
    try {
      setLoading(true);
      
      if (isLogin) {
        // Handle login
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Handle signup
        await createUserWithEmailAndPassword(auth, email, password);
      }
      
      // Redirect to home page on success
      navigate("/");
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        err.message || 
        "Failed to authenticate. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle p-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi text-primary" viewBox="0 0 16 16">
                    {isLogin ? (
                      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    ) : (
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    )}
                  </svg>
                </div>
                <h2 className="fw-bold mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-muted">
                  {isLogin ? 'Sign in to access your tasks' : 'Sign up to get started with ZenList'}
                </p>
              </div>
              
              {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  <div>{error}</div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* Email field */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    placeholder="you@example.com"
                  />
                </div>
                
                {/* Password field */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0" htmlFor="password">
                      Password
                    </label>
                    {isLogin && (
                      <a href="#" className="small text-primary">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    placeholder="••••••••"
                  />
                </div>
                
                {/* Submit button */}
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary py-2"
                  >
                    {loading ? (
                      <span className="d-flex align-items-center justify-content-center">
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </span>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </button>
                </div>
                
                {/* Toggle between login and signup */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={toggleAuthMode}
                      className="btn btn-link p-0 text-primary text-decoration-none"
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-b from-[#1a1c2e]/50 to-[#2a2d4c]/50 backdrop-blur-md rounded-xl border border-gray-700/30 shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-[#2a2d4c]/50 p-4 rounded-full">
                <div className="text-blue-500 w-12 h-12 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi text-primary" viewBox="0 0 16 16">
                    {isLogin ? (
                      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    ) : (
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    )}
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-200 mb-2">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400">
                  {isLogin ? 'Sign in to access your tasks' : 'Sign up to get started with ZenList'}
                </p>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  <div>{error}</div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#2a2d4c]/30 border border-gray-700/30 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                
                {/* Password field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300" htmlFor="password">
                      Password
                    </label>
                    {isLogin && (
                      <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#2a2d4c]/30 border border-gray-700/30 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                
                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
                
                {/* Toggle between login and signup */}
                <div className="text-center">
                  <p className="text-gray-400">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={toggleAuthMode}
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
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

import React, { useEffect, useState } from "react";
import API from "../api/config";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import useInstallPrompt from "../hooks/useInstallPrompt";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const installPromptEvent = useInstallPrompt();
  const [isInstalled, setIsInstalled] = useState(
    localStorage.getItem("pwaInstalled") === "true"
  );

  const handleInstallApp = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("PWA Installed");
          localStorage.setItem("pwaInstalled", "true");
          setIsInstalled(true);
          alert("🎉 Thanks for installing ZenList App!");
        }
      });
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const response = await API.get(`/user/profile/${currentUser.uid}`);
          setUserProfile({
            ...currentUser,
            photoURL: response.data.profileImage || currentUser.photoURL,
            displayName: response.data.username || currentUser.displayName,
          });
        } catch (error) {
          console.error("Failed to fetch user profile in Navbar:", error);
          setUserProfile(currentUser);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      setIsMobileMenuOpen(false);
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".mobile-menu") &&
        !event.target.closest(".hamburger-btn")
      ) {
        setIsMobileMenuOpen(false);
      }
      if (
        !event.target.closest(".profile-menu") &&
        !event.target.closest(".profile-btn")
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="mt-0.5 py-3 px-4 rounded-2xl fixed w-full z-[9999] bg-gradient-to-r from-[#0f172a]/95 via-[#1e293b]/90 to-[#334155]/85 backdrop-blur-xl shadow-xl shadow-black/20 border border-white/10">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link className="flex items-center space-x-3 group" to="/">
            <div className="relative">
              <img
                src="/assets/zenList.png"
                alt="ZenList"
                width="36"
                height="36"
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="font-bold text-xl drop-shadow-lg bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
              ZenList
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              className="relative px-4 py-2 text-white/90 hover:text-white transition-all duration-300 font-medium group"
              to="/"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              className="relative px-4 py-2 text-white/90 hover:text-white transition-all duration-300 font-medium group"
              to="/TodoDashboard"
            >
              My Lists
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              className="relative px-4 py-2 text-white/90 hover:text-white transition-all duration-300 font-medium group"
              to="/prices"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {!currentUser ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-6 py-2.5 border border-white/20 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium hover:scale-105 hover:border-white/30"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 font-medium hover:scale-105"
                >
                  Sign up free
                </Link>
              </div>
            ) : (
              <>
                {/* Install App Button - Properly positioned */}
                {!isInstalled && installPromptEvent && (
                  <button
                    onClick={handleInstallApp}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Install App</span>
                  </button>
                )}

                {/* Notification Bell */}
                <NotificationBell userId={currentUser.uid} />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={toggleProfileMenu}
                    className="profile-btn flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                  >
                    <img
                      src={
                        userProfile?.photoURL ||
                        `https://ui-avatars.com/api/?name=${userProfile?.email}&background=random`
                      }
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"
                    />
                    <span className="text-white/90 font-medium group-hover:text-white transition-colors duration-300">
                      {userProfile?.displayName ||
                        userProfile?.email.split("@")[0]}
                    </span>
                    <svg
                      className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="profile-menu absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 py-2 border border-white/10">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-white font-medium">
                          {userProfile?.displayName || "User"}
                        </p>
                        <p className="text-white/60 text-sm truncate">
                          {userProfile?.email}
                        </p>
                      </div>
                      <Link
                        className="flex items-center px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300"
                        to="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        className="flex items-center px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300"
                        to="/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-3">
            {currentUser && (
              <NotificationBell userId={currentUser.uid} />
            )}
            <button
              onClick={toggleMobileMenu}
              className="hamburger-btn p-2 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              <div className="space-y-1.5">
                <div
                  className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                    isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                ></div>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm lg:hidden">
          <div className="mobile-menu fixed top-20 left-4 right-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/30 border border-white/10 py-6">
            {/* Mobile Navigation Links */}
            <div className="space-y-2 px-6">
              <Link
                className="flex items-center px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium"
                to="/"
                onClick={closeMobileMenu}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </Link>
              <Link
                className="flex items-center px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium"
                to="/TodoDashboard"
                onClick={closeMobileMenu}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                My Lists
              </Link>
              <Link
                className="flex items-center px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium"
                to="/prices"
                onClick={closeMobileMenu}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                Pricing
              </Link>
            </div>

            {/* Mobile Auth Section */}
            <div className="border-t border-white/10 mt-6 pt-6 px-6">
              {!currentUser ? (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full px-6 py-3 border border-white/20 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium"
                    onClick={closeMobileMenu}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 font-medium"
                    onClick={closeMobileMenu}
                  >
                    Sign up free
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Install App Button for Mobile */}
                  {!isInstalled && installPromptEvent && (
                    <button
                      onClick={handleInstallApp}
                      className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-emerald-500/25 space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Install ZenList App</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-3 px-4 py-3 bg-white/5 rounded-xl">
                    <img
                      src={
                        userProfile?.photoURL ||
                        `https://ui-avatars.com/api/?name=${userProfile?.email}&background=random`
                      }
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {userProfile?.displayName || "User"}
                      </p>
                      <p className="text-white/60 text-sm truncate">
                        {userProfile?.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    className="flex items-center px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                    to="/profile"
                    onClick={closeMobileMenu}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    className="flex items-center px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                    to="/settings"
                    onClick={closeMobileMenu}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-300"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
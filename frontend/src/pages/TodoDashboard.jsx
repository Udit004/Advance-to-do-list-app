import React, { useState, useEffect } from "react";
import {
  List,
  FolderOpen,
  Menu,
  X,
  Sparkles,
  Lock,
  Crown,
  ArrowRight,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext"; // Import useAuth hook
import API from "../api/config";

// Import your separate components here when using in your project
import TodoList from "./TodoList";
import AICreator from "./AICreator";
import ProjectDashboard from "./ProjecDashboard";

// Premium Preview Overlay Component - Mobile Optimized
const PremiumPreviewOverlay = ({ featureName, onUpgrade }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 text-center border border-white/40 ring-1 ring-gray-200/50">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
            Premium Feature
          </h2>

          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
            <strong>{featureName}</strong> is available exclusively to premium
            subscribers. Upgrade now to unlock this feature and many more!
          </p>

          <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
              <span>Advanced project organization</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
              <span>AI-powered task suggestions</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
              <span>Priority support & unlimited tasks</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform active:scale-95 shadow-lg text-sm sm:text-base"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>View Pricing Plans</span>
                <ArrowRight size={16} />
              </div>
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full text-gray-500 hover:text-gray-700 active:text-gray-800 py-2 sm:py-3 px-6 rounded-xl font-medium transition-colors text-sm sm:text-base"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Protected Feature Component
const ProtectedFeature = ({ children, isPaid, isLoading, featureName }) => {
  const handleUpgrade = () => {
    window.location.href = "/prices";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Show the actual content (blurred for non-paid users) */}
      <div
        className={`h-full transition-all duration-300 ${
          !isPaid
            ? "filter blur-[2px] sm:blur-[4px] pointer-events-none select-none"
            : ""
        }`}
      >
        {children}
      </div>

      {/* Show overlay for non-paid users */}
      {!isPaid && (
        <PremiumPreviewOverlay
          featureName={featureName}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
};

// Mobile Bottom Navigation Component
const MobileBottomNav = ({
  activeItem,
  setActiveItem,
  userProfile,
  isLoading,
}) => {
  const menuItems = [
    {
      id: "todoList",
      label: "Tasks",
      icon: List,
      isPremium: false,
    },
    {
      id: "projectDashboard",
      label: "Projects",
      icon: FolderOpen,
      isPremium: true,
    },
    {
      id: "aiCreator",
      label: "AI Creator",
      icon: Sparkles,
      isPremium: true,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-40 lg:hidden">
      <div className="flex justify-around items-center py-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeItem === item.id;
          const isPremiumFeature =
            item.isPremium && !userProfile?.isPaid && !isLoading;

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`
                flex flex-col items-center py-2 px-3 rounded-lg min-w-[70px] relative
                transition-all duration-200 ease-in-out
                ${
                  isActive
                    ? "text-blue-400 bg-blue-900/30"
                    : isPremiumFeature
                    ? "text-slate-500"
                    : "text-slate-300 hover:text-white active:bg-slate-800"
                }
              `}
            >
              <div className="relative">
                <IconComponent
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {isPremiumFeature && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Lock size={6} className="text-white" />
                  </div>
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isActive ? "text-blue-400" : ""
                }`}
              >
                {item.label}
              </span>
              {isPremiumFeature && (
                <div className="flex items-center mt-0.5">
                  <Crown size={8} className="text-yellow-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Sidebar Component - Mobile Optimized
const Sidebar = ({
  isExpanded,
  setIsExpanded,
  activeItem,
  setActiveItem,
  userProfile,
  isLoading,
}) => {
  const menuItems = [
    {
      id: "todoList",
      label: "Todo List",
      icon: List,
      isPremium: false,
    },
    {
      id: "projectDashboard",
      label: "Project Todo",
      icon: FolderOpen,
      isPremium: true,
    },
    {
      id: "aiCreator",
      label: "AI Creator",
      icon: Sparkles,
      isPremium: true,
    },
  ];

  const handleUpgrade = () => {
    window.location.href = "/prices";
  };

  return (
    <div
      className={`
        relative z-40 h-full bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl flex flex-col 
        transition-all duration-300 ease-in-out hidden lg:flex
        ${isExpanded ? "w-64" : "w-16"}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between min-h-[64px]">
        <div
          className={`transition-opacity duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          {isExpanded && (
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Dashboard
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {userProfile?.isPaid ? "Premium Account" : "Manage your tasks"}
              </p>
              {userProfile?.isPaid && (
                <div className="flex items-center mt-2">
                  <Crown className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-xs text-yellow-400 font-medium">
                    Premium
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-slate-700/50 active:bg-slate-700/70 text-slate-300 hover:text-white transition-all duration-200"
        >
          {isExpanded ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeItem === item.id;
          const isPremiumFeature =
            item.isPremium && !userProfile?.isPaid && !isLoading;

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                transition-all duration-200 ease-in-out group relative
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : isPremiumFeature
                    ? "text-slate-300 hover:bg-slate-700/30 active:bg-slate-700/50 hover:text-white border border-slate-600/50"
                    : "text-slate-300 hover:bg-slate-700/50 active:bg-slate-700/70 hover:text-white"
                }
                ${!isExpanded ? "justify-center" : ""}
              `}
              title={!isExpanded ? item.label : ""}
            >
              <div className="flex items-center relative">
                <IconComponent
                  size={20}
                  className={`
                    transition-transform duration-200 flex-shrink-0
                    ${isActive ? "scale-110" : "group-hover:scale-105"}
                  `}
                />
                {isPremiumFeature && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Lock size={8} className="text-white" />
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="flex items-center justify-between flex-1">
                  <span className="font-medium text-sm transition-opacity duration-300">
                    {item.label}
                  </span>
                  {isPremiumFeature && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-yellow-400 font-medium">
                        PRO
                      </span>
                      <Crown size={12} className="text-yellow-400" />
                    </div>
                  )}
                </div>
              )}

              {!isExpanded && (
                <div className="absolute left-full ml-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                  {item.label}
                  {isPremiumFeature && (
                    <div className="flex items-center mt-1">
                      <Crown size={10} className="text-yellow-400 mr-1" />
                      <span className="text-yellow-400">Premium</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        {isExpanded && (
          <div className="space-y-3">
            {!userProfile?.isPaid && !isLoading && (
              <div className="space-y-2">
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 transition-all duration-200 transform active:scale-95 shadow-lg"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Crown size={16} />
                    <span>Upgrade to Premium</span>
                  </div>
                </button>
                <p className="text-xs text-slate-400 text-center">
                  Unlock all features & unlimited access
                </p>
              </div>
            )}
            <div className="text-xs text-slate-500 text-center transition-opacity duration-300">
              Stay organized, stay productive
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileHeader = ({ userProfile, activeItem }) => {
  const getPageTitle = () => {
    switch (activeItem) {
      case "todoList":
        return "Todo List";
      case "projectDashboard":
        return "Project Dashboard";
      case "aiCreator":
        return "AI Creator";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between lg:hidden">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ZL</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {getPageTitle()}
            </h1>
            {userProfile?.isPaid && (
              <div className="flex items-center">
                <Crown className="w-3 h-3 text-yellow-400 mr-1" />
                <span className="text-xs text-yellow-400 font-medium">
                  Premium
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {userProfile?.photoURL && (
        <img
          src={userProfile.photoURL}
          alt="Profile"
          className="w-8 h-8 rounded-full border border-slate-600"
        />
      )}
    </div>
  );
};

// Main TodoDashboard Component - Mobile Optimized
const TodoDashboard = () => {
  const { currentUser: user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false); // Default to closed on mobile
  const [activeItem, setActiveItem] = useState("todoList");
  const [userProfile, setUserProfile] = useState({
    isPaid: false,
    username: "",
    email: "",
    age: "",
    profession: "",
    photoURL: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Close sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Changed from 768 to 1024 (lg breakpoint)
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.uid) {
        try {
          setIsLoading(true);
          console.log("Fetching profile for user:", user.uid);

          const response = await API.get(`/user/profile/${user.uid}`);
          console.log("Profile fetch successful:", response.data);

          setUserProfile({
            ...response.data,
            email: response.data.email || user?.email || "",
            photoURL: response.data.profileImage || "",
            isPaid: response.data.isPaid || false,
          });
          setError(null);
        } catch (error) {
          console.error("Error fetching user profile:", error);

          if (error.response && error.response.status === 404) {
            setUserProfile((prevData) => ({
              ...prevData,
              email: user?.email || "",
              username: user?.displayName || "",
              isPaid: false,
            }));
            setError(
              "Profile not found. You can create your profile in the Profile section."
            );
          } else {
            setError("Failed to fetch profile.");
            setUserProfile((prevData) => ({
              ...prevData,
              email: user?.email || "",
              username: user?.displayName || "",
              isPaid: false,
            }));
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setUserProfile({
          isPaid: false,
          username: "",
          email: "",
          age: "",
          profession: "",
          photoURL: "",
        });
        setError("Please log in to access your dashboard.");
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">
              Loading your dashboard...
            </p>
            {user?.uid && (
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                Fetching profile for: {user.displayName || user.email}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="text-center max-w-sm">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-4">
              <h3 className="text-yellow-800 font-semibold mb-2 text-base sm:text-lg">
                Authentication Required
              </h3>
              <p className="text-yellow-600 mb-4 text-sm sm:text-base">
                You need to be logged in to access your dashboard.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base touch-manipulation"
              >
                Go to Login
              </button>
              <button
                onClick={() => (window.location.href = "/register")}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium text-sm sm:text-base touch-manipulation"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (error && error.includes("Failed to fetch")) {
      return (
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="text-center max-w-sm">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 mb-4">
              <h3 className="text-red-800 font-semibold mb-2 text-base sm:text-lg">
                Connection Error
              </h3>
              <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base touch-manipulation"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium text-sm sm:text-base touch-manipulation"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeItem) {
      case "todoList":
        return <TodoList />;
      case "projectDashboard":
        return (
          <ProtectedFeature
            isPaid={userProfile?.isPaid}
            isLoading={isLoading}
            featureName="Project Dashboard"
          >
            <ProjectDashboard />
          </ProtectedFeature>
        );
      case "aiCreator":
        return (
          <ProtectedFeature
            isPaid={userProfile?.isPaid}
            isLoading={isLoading}
            featureName="AI Creator"
          >
            <AICreator />
          </ProtectedFeature>
        );
      default:
        return (
          <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Welcome{userProfile?.username ? `, ${userProfile.username}` : ""}!
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              Select a menu item to get started with your productivity
              dashboard.
            </p>

            {/* Mobile-friendly quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setActiveItem("todoList")}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors text-left touch-manipulation"
              >
                <List className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-800">Todo List</h3>
                <p className="text-sm text-gray-600">Manage your daily tasks</p>
              </button>

              <button
                onClick={() => setActiveItem("projectDashboard")}
                className={`p-4 border rounded-lg text-left transition-colors touch-manipulation ${
                  userProfile?.isPaid
                    ? "bg-green-50 border-green-200 hover:bg-green-100 active:bg-green-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                }`}
                disabled={!userProfile?.isPaid}
              >
                <div className="flex items-center mb-2">
                  <FolderOpen className="w-6 h-6 text-green-600 mr-2" />
                  {!userProfile?.isPaid && (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <h3 className="font-medium text-gray-800">Project Dashboard</h3>
                <p className="text-sm text-gray-600">
                  {userProfile?.isPaid
                    ? "Organize complex projects"
                    : "Premium feature"}
                </p>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="text-yellow-700 text-sm">{error}</p>
              </div>
            )}

            {/* Debug info - mobile optimized */}
            {window.location.hostname === "localhost" && (
              <div className="p-4 bg-gray-100 rounded-lg text-xs sm:text-sm">
                <strong>Debug Info:</strong>
                <br />
                User: {user ? "Logged in ✅" : "Not logged in ❌"}
                <br />
                User UID: {user?.uid || "N/A"}
                <br />
                User Email: {user?.email || "N/A"}
                <br />
                Is Premium: {userProfile?.isPaid ? "Yes" : "No"}
                <br />
                Profile Username: {userProfile?.username || "Not set"}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 relative">
      {/* Desktop Sidebar Only */}
      <Sidebar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        userProfile={userProfile}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <main className="flex-1 bg-slate-900 overflow-auto flex flex-col">
        {/* Mobile Header */}
        <MobileHeader userProfile={userProfile} activeItem={activeItem} />

        {/* Content Area */}
        <div className="flex-1 overflow-auto pb-16 lg:pb-0">
          {renderMainContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        userProfile={userProfile}
        isLoading={isLoading}
      />
    </div>
  );
};

export default TodoDashboard;

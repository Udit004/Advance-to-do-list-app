import React, { useState, useEffect } from "react";
import { List, FolderOpen, Menu, X, Sparkles, Lock, Crown, ArrowRight } from "lucide-react";
import API from "../api/config";

// Import your separate components here when using in your project
import TodoList from "./TodoList";
import ProjectTodo from "./ProjectTodo";
import AICreator from "./AICreator";

// Premium Preview Overlay Component
const PremiumPreviewOverlay = ({ featureName, onUpgrade }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border border-white/40 ring-1 ring-gray-200/50">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Premium Feature
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            <strong>{featureName}</strong> is available exclusively to premium subscribers. 
            Upgrade now to unlock this feature and many more!
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Advanced project organization
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              AI-powered task suggestions
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Priority support & unlimited tasks
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>View Pricing Plans</span>
                <ArrowRight size={16} />
              </div>
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full text-gray-500 hover:text-gray-700 py-2 px-6 rounded-xl font-medium transition-colors"
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
    window.location.href = '/prices';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Show the actual content (blurred for non-paid users) */}
      <div className={`h-full transition-all duration-300 ${!isPaid ? 'filter blur-[4px] pointer-events-none select-none' : ''}`}>
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

// Enhanced Sidebar Component
const Sidebar = ({ isExpanded, setIsExpanded, activeItem, setActiveItem, userProfile, isLoading }) => {
  const menuItems = [
    {
      id: "todoList",
      label: "Todo List",
      icon: List,
      isPremium: false,
    },
    {
      id: "projectTodo",
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
    window.location.href = '/prices';
  };

  return (
    <div
      className={`h-screen bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div
          className={`transition-opacity duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          {isExpanded && (
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Dashboard
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {userProfile?.isPaid ? "Premium Account" : "Manage your tasks"}
              </p>
              {userProfile?.isPaid && (
                <div className="flex items-center mt-2">
                  <Crown className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-xs text-yellow-400 font-medium">Premium</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hamburger Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200"
        >
          {isExpanded ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeItem === item.id;
          const isPremiumFeature = item.isPremium && !userProfile?.isPaid && !isLoading;

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                transition-all duration-200 ease-in-out group relative
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105"
                    : isPremiumFeature
                    ? "text-slate-300 hover:bg-slate-700/30 hover:text-white hover:scale-102 border border-slate-600/50"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-102"
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
                      <span className="text-xs text-yellow-400 font-medium">PRO</span>
                      <Crown size={12} className="text-yellow-400" />
                    </div>
                  )}
                </div>
              )}

              {/* Tooltip for collapsed state */}
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
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

// Main TodoDashboard Component
const TodoDashboard = ({ user, profileData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState("todoList");
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        const userId = profileData?._id || user?.uid;
        
        if (!userId) {
          console.log('No user ID found, setting default profile');
          setUserProfile({ isPaid: false });
          setError(null);
          setIsLoading(false);
          return;
        }
        
        console.log('Fetching profile for user:', userId);
        const response = await API.get(`/user/profile/${userId}`);
        setUserProfile(response.data);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
        setUserProfile({ isPaid: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, profileData]);

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeItem) {
      case "todoList":
        return <TodoList />;
      case "projectTodo":
        return (
          <ProtectedFeature 
            isPaid={userProfile?.isPaid} 
            isLoading={isLoading}
            featureName="Project Todo"
          >
            <ProjectTodo />
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
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800">Welcome</h1>
            <p className="text-gray-600 mt-2">
              Select a menu item from the sidebar
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        userProfile={userProfile}
        isLoading={isLoading}
      />
      <main className="flex-1 bg-gray-50 overflow-auto">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default TodoDashboard;
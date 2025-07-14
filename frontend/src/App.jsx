import { Toaster } from 'react-hot-toast';
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAuth, AuthProvider } from "./context/AuthContext"; // Fixed import
import { askNotificationPermission, subscribeUserToPush } from "./utils/pushNotifications";

// Import your components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import TodoList from "./pages/TodoList";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Prices from "./pages/Prices";
import TodoDashboard from "./pages/TodoDashboard";
import Project from "./pages/projectComponents/ProjectTodos"
import PaymentSuccess from "./pages/PaymentSuccess";

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2a2d4c] to-[#0f1225] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
      <p className="text-white/80 text-lg">Loading...</p>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2a2d4c] to-[#0f1225] flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-white/80 mb-6">Please refresh the page to try again</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Push notification setup component
const PushSetupWrapper = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    async function setupPush() {
      try {
        const granted = await askNotificationPermission();
        if (granted && currentUser && currentUser.uid) {
          const subscribed = await subscribeUserToPush(currentUser.uid);
          console.log(
            subscribed
              ? "✅ Push subscription successful"
              : "❌ Failed to subscribe"
          );
        } else if (!granted) {
          console.log("🔕 Notification permission not granted");
        } else {
          console.log("🔑 User not authenticated, cannot subscribe to push notifications");
        }
      } catch (error) {
        console.error("Push setup error:", error);
      }
    }

    if (currentUser) {
      setupPush();
    }
  }, [currentUser]);

  return null;
};

// Main App Content
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2a2d4c] to-[#0f1225] text-gray-100">
      <Navbar />
      <main className="container mx-auto pt-20 pb-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/todolist" element={<TodoList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/TodoDashboard" element={<TodoDashboard />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/project/:projectId/todos" element={<Project />} />
          {/* Add a 404 route */}
          <Route path="*" element={
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold text-white mb-4">404 - Page Not Found</h2>
              <p className="text-white/80 mb-6">The page you're looking for doesn't exist.</p>
              <button 
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300"
              >
                Go Back
              </button>
            </div>
          } />
        </Routes>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid #475569",
          },
        }}
      />
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Helmet>
          <meta
            name="google-site-verification"
            content="SGSmDTkUcfGUOsfWJWVBksxsbCZptyQ15tqK1e-SF3M"
          />
        </Helmet>
        <AuthProvider>
          <PushSetupWrapper />
          <ScrollToTop />
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
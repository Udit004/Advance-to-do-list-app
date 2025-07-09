import { Toaster } from 'react-hot-toast';
import React, { useEffect } from "react";
import {
  subscribeUserToPush,
  askNotificationPermission,
} from "./utils/pushNotifications";
import { Helmet } from "react-helmet";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TodoList from "./pages/TodoList";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import Footer from "./components/Footer";
import Prices from "./pages/Prices";
import ScrollToTop from "./components/ScrollToTop";
import Profile from "./pages/Profile";
import TodoDashboard from "./pages/TodoDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import ProjectTodos from "./pages/projectComponents/ProjectTodos";

const App = () => {
  useEffect(() => {
    async function setupPush() {
      try {
        const granted = await askNotificationPermission();
        if (granted) {
          const subscribed = await subscribeUserToPush();
          console.log(
            subscribed
              ? "✅ Push subscription successful"
              : "❌ Failed to subscribe"
          );
        } else {
          console.log("🔕 Notification permission not granted");
        }
      } catch (error) {
        console.error("Push setup error:", error);
      }
    }

    setupPush();
  }, []);

  return (
    <Router>
      <Helmet>
        <meta
          name="google-site-verification"
          content="SGSmDTkUcfGUOsfWJWVBksxsbCZptyQ15tqK1e-SF3M"
        />
      </Helmet>
      <AuthProvider>
        <ScrollToTop />
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
              <Route
                path="/project/:projectId/todos"
                element={<ProjectTodos />}
              />
              <Route path="/payment-success" element={<PaymentSuccess />} />
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
      </AuthProvider>
    </Router>
  );
};

export default App;

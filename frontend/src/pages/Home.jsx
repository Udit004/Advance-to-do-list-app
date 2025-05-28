import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ScrollAnimation from "../components/ScrollAnimation";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#232526]/80 via-[#2c5364]/80 to-[#0f2027]/80 rounded-2xl shadow-lg backdrop-blur-xl bg-gray-800/40  py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200">
                  The to-do list that helps you think
                </span>
              </h1>
              <p className="text-lg text-gray-400 mb-6">
                ZenList is a minimalist to-do list app that helps you focus on
                what matters. It's like having a clean desk for your mind.
              </p>
              <div className="flex gap-4">
                {!currentUser ? (
                  <Link
                    to="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    role="button"
                  >
                    Sign up for free
                  </Link>
                ) : (
                  <Link
                    to="/todolist"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    role="button"
                  >
                    Go to My Lists
                  </Link>
                )}
                <Link
                  to="#watch-video"
                  className="border border-gray-300 hover:bg-gray-700 hover:text-white text-gray-500 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  role="button"
                >
                  Watch the video
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="mt-8 md:mt-0 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/20 via-amber-400/20 to-amber-200/20 rounded-lg blur-lg group-hover:blur-xl transition-all duration-500 group-hover:opacity-75 opacity-50"></div>
                <div className="relative p-2 bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-700/30">
                  <img
                    src="/assets/Zen-Workspace-Design.png"
                    alt="ZenList Interface"
                    className="w-full rounded-lg shadow-xl transform transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-[#232526]/80 via-[#2c5364]/80 to-[#0f2027]/80 rounded-2xl shadow-lg backdrop-blur-xl bg-gray-800/40 py-12 md:py-16 transform transition-all duration-500 hover:shadow-2xl hover:border hover:border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/20 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-800/30 hover:-translate-y-1 border border-gray-700/30 h-full group hover:border-amber-500/30">
              <div className="mb-4 text-gray-300 transform transition-all duration-300 group-hover:scale-110 group-hover:text-amber-400">
                <i className="bi bi-check2-circle text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-300 group-hover:text-amber-400 transition-colors duration-300">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200">
                  Simple & Clean
                </span>
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Focus on what's important with our clutter-free interface
              </p>
            </div>
            <div className="bg-gray-800/20 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-800/30 hover:-translate-y-1 border border-gray-700/30 h-full group hover:border-amber-500/30">
              <div className="mb-4 text-gray-300 transform transition-all duration-300 group-hover:scale-110 group-hover:text-amber-400">
                <i className="bi bi-lightning text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-amber-400 transition-colors duration-300">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200">
                  Lightning Fast
                </span>
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Quick and responsive, helping you stay productive
              </p>
            </div>
            <div className="bg-gray-800/20 backdrop-blur-md p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-800/30 hover:-translate-y-1 border border-gray-700/30 h-full group hover:border-amber-500/30">
              <div className="mb-4 text-gray-300 transform transition-all duration-300 group-hover:scale-110 group-hover:text-amber-400">
                <i className="bi bi-shield-check text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-amber-400 transition-colors duration-300">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200">
                  Secure & Private
                </span>
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Your data is encrypted and safely stored
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-12 bg-gradient-to-br from-[#232526]/60 via-[#2c5364]/60 to-[#0f2027]/60 rounded-2xl shadow-lg backdrop-blur-xl bg-gray-800/20 transform transition-all duration-500 hover:shadow-2xl hover:border hover:border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 hover:from-amber-400 hover:via-amber-300 hover:to-amber-100 transition-all duration-300">
            Choose Your Perfect Plan
          </h2>
          <p className="text-gray-500 mb-6 hover:text-gray-300 transition-colors duration-300">
            Unlock premium features and boost your productivity with our flexible pricing plans
          </p>
          <Button 
            variant="secondary" 
            onClick={() => navigate("/prices")} 
            className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-white"
          >
            View Pricing Plans
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 md:p-12 transition-all duration-200 hover:scale-[1.01] hover:shadow-3xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500">
                  The to-do list that helps you think
                </span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                ZenList is a minimalist to-do list app that helps you focus on
                what matters. It's like having a clean desk for your mind.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!currentUser ? (
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-105 text-center"
                    role="button"
                  >
                    Sign up for free
                  </Link>
                ) : (
                  <Link
                    to="/todolist"
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-105 text-center"
                    role="button"
                  >
                    Go to My Lists
                  </Link>
                )}
                <Link
                  to="#watch-video"
                  className="border border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 backdrop-blur-sm text-center"
                  role="button"
                >
                  Watch the video
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-500 opacity-60 group-hover:opacity-80"></div>
                <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 shadow-2xl">
                  <img
                    src="/assets/Zen-Workspace-Design.png"
                    alt="ZenList Interface"
                    className="w-full rounded-lg shadow-xl transform transition-all duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 md:p-12 transition-all duration-200 hover:scale-[1.01] hover:shadow-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500">
                Why Choose ZenList?
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Discover the features that make ZenList the perfect productivity companion
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 backdrop-blur-sm p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 border border-slate-600/50 hover:border-orange-500/30 group">
              <div className="mb-6 text-slate-300 transform transition-all duration-200 group-hover:scale-110 group-hover:text-orange-400">
                <i className="bi bi-check2-circle text-5xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors duration-200">
                Simple & Clean
              </h3>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-200 leading-relaxed">
                Focus on what's important with our clutter-free interface designed for clarity and peace of mind.
              </p>
            </div>
            
            <div className="bg-slate-700/50 backdrop-blur-sm p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 border border-slate-600/50 hover:border-orange-500/30 group">
              <div className="mb-6 text-slate-300 transform transition-all duration-200 group-hover:scale-110 group-hover:text-orange-400">
                <i className="bi bi-lightning text-5xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors duration-200">
                Lightning Fast
              </h3>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-200 leading-relaxed">
                Quick and responsive interface that keeps up with your thoughts and helps you stay in flow.
              </p>
            </div>
            
            <div className="bg-slate-700/50 backdrop-blur-sm p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 border border-slate-600/50 hover:border-orange-500/30 group">
              <div className="mb-6 text-slate-300 transform transition-all duration-200 group-hover:scale-110 group-hover:text-orange-400">
                <i className="bi bi-shield-check text-5xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors duration-200">
                Secure & Private
              </h3>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-200 leading-relaxed">
                Your data is encrypted and safely stored with enterprise-grade security measures.
              </p>
            </div>
          </div>
        </section>

        {/* Membership Section */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 md:p-12 text-center transition-all duration-200 hover:scale-[1.01] hover:shadow-3xl">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500">
                Choose Your Perfect Plan
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Unlock premium features and boost your productivity with our flexible pricing plans designed to grow with you
            </p>
            <div className="pt-4">
              <Button 
                onClick={() => navigate("/prices")} 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-orange-500/25 transition-all duration-200 hover:scale-105 border-0 text-lg"
              >
                View Pricing Plans
              </Button>
            </div>
          </div>
        </section>

        {/* Additional CTA Section */}
        <section className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/30 p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-bold text-white">
              Ready to get organized?
            </h3>
            <p className="text-slate-400">
              Join thousands of users who have transformed their productivity with ZenList
            </p>
            {!currentUser && (
              <Link
                to="/signup"
                className="inline-block bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50 backdrop-blur-sm"
              >
                Get Started Today
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
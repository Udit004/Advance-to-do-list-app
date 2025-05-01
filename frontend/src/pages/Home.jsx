import React from "react";
import ScrollAnimation from "../components/ScrollAnimation";

const Home = () => {
  return (
    <div className="container mt-5">
      <ScrollAnimation className="text-center mb-5">
        <h1>Welcome to ZenList 🧘‍♂️</h1>
        <p className="lead">Your peaceful productivity companion.</p>
      </ScrollAnimation>

      <div className="row mt-5 pt-5">
        <ScrollAnimation className="col-md-4 mb-4" animationType="slide-left">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <h3 className="card-title">✅ Stay Organized</h3>
              <p className="card-text">Keep track of all your tasks in one place with our intuitive interface.</p>
            </div>
          </div>
        </ScrollAnimation>

        <ScrollAnimation className="col-md-4 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <h3 className="card-title">⏰ Never Miss Deadlines</h3>
              <p className="card-text">Set due dates and get reminders for your important tasks.</p>
            </div>
          </div>
        </ScrollAnimation>

        <ScrollAnimation className="col-md-4 mb-4" animationType="slide-right">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <h3 className="card-title">🔄 Sync Across Devices</h3>
              <p className="card-text">Access your to-do list from anywhere, anytime.</p>
            </div>
          </div>
        </ScrollAnimation>
      </div>

      <ScrollAnimation className="text-center mt-5 pt-5">
        <h2>Ready to boost your productivity?</h2>
        <p className="lead mb-4">Join thousands of users who have transformed their workflow with ZenList.</p>
        <a href="/signup" className="btn btn-primary btn-lg">Get Started</a>
      </ScrollAnimation>
    </div>
  );
};

export default Home;

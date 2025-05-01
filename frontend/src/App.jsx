import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import TodoList from './pages/Todolist';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

import Navbar from './components/Navbar';
import Footer from './components/footer';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-wrapper d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1 mb-5 pb-5">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/todolist" element={<TodoList />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
          <ScrollToTop />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

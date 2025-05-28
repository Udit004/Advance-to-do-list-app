import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import TodoList from './pages/TodoList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import Footer from './components/Footer';
import Prices from './pages/Prices';
import ScrollToTop from './components/ScrollToTop';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2a2d4c] to-[#0f1225] text-gray-100">
          <Navbar />
          <main className="container mx-auto pt-20 pb-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/todolist" element={<TodoList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/prices" element={<Prices />} />
            </Routes>
          </main>
          <Footer/>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
import React, { useState, useEffect } from "react";
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="mt-0.5 py-1.5 rounded-2xl fixed w-full z-[9999] bg-gradient-to-r from-[#0f172a]/90 via-[#1e293b]/85 to-[#334155]/80 backdrop-blur-xl shadow-lg shadow-black/10 border-b border-white/10 dark:border-white/5">
      <div className="container flex mx-auto px-4">
        <Link className="flex items-center" to="/">
          <img src="/assets/zenList.png" alt="ZenList" width="32" height="32" className="mr-2" />
          <span className="font-bold text-white drop-shadow-lg">ZenList</span>
        </Link>

        <div className="flex items-center flex-grow">
          <ul className="flex mx-auto space-x-2">
            <li>
              <Link className="px-3 py-2 text-white hover:text-cyan-300 transition-colors font-medium" to="/">Home</Link>
            </li>
            <li>
              <Link className="px-3 py-2 text-white hover:text-cyan-300 transition-colors font-medium" to="/todolist">My Lists</Link>
            </li>
            <li>
              <Link className="px-3 py-2 text-white hover:text-cyan-300 transition-colors font-medium" to="/prices">Pricing</Link>
            </li>
          </ul>

          <div className="flex z-50 items-center gap-4">
            <button className="relative p-2 text-white hover:bg-slate-100/10 rounded-full" title="Notifications">
              <i className="bi bi-bell text-xl"></i>
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 p-1 bg-red-500 border border-white dark:border-slate-800 rounded-full">
                <span className="sr-only">New notifications</span>
              </span>
            </button>

            {!user ? (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 border border-slate-300/20 text-slate-200 hover:bg-white/10 rounded-lg transition-all duration-300 ease-out hover:scale-105">Sign in</Link>
                <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 ease-out hover:scale-105">Sign up free</Link>
              </div>
            ) : (
              <div className=" z-50 relative group">
                <div className="flex items-center gap-2 cursor-pointer">
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
                    alt="Profile"
                    className="rounded-full"
                    width="38"
                    height="38"
                  />
                  <span className="hidden md:block text-white/80 font-medium">
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                  <i className="bi bi-chevron-down text-white/60 text-sm"></i>
                </div>
                <div className="z-10000 absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl rounded-lg shadow-xl shadow-black/20 py-1 border border-white/10 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100">
                  <Link className="block px-4 py-2 text-slate-200 hover:bg-white/10 hover:text-white transition-colors" to="/profile">Profile</Link>
                  <Link className="block px-4 py-2 text-slate-200 hover:bg-white/10 hover:text-white transition-colors" to="/settings">Settings</Link>
                  <hr className="my-1 border-white/10" />
                  <Button variant="" onClick={handleLogout}>
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

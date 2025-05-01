import React, { useState, useEffect } from "react";
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

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
    <nav className="navbar fw-bold border-bottom border-primary border-opacity-50 bg-body-tertiary z-3 top-1/12 p-2 rounded-3 shadow-lg mb-2 my-1 bg-info-subtle text-info-emphasis">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src="/assets/zenList.png" alt="ZenList" width="50" className="me-2" />
          ZenList
        </Link>

        <ul className="nav justify-content-center align-items-center">
          <li className="nav-item">
            <Link className="nav-link active" to="/">Home</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/todolist">YourToDo</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/contact">Contact Us</Link>
          </li>

          {!user ? (
            <>
              <li className="nav-item">
                <Link to="/login">
                  <button type="button" className="btn btn-success mx-2">Login</button>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/signup">
                  <button type="button" className="btn btn-primary mx-2">Signup</button>
                </Link>
              </li>
            </>
          ) : (
            <div className="dropdown mx-3">
              <button
                className="btn btn-info dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {user.name || "Profile"}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/profile">Profile</Link>
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

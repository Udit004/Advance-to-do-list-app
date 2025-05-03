import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import UserService from '../api/userService';
import { auth } from '../firebase';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: 'user.email',
    contactNumber: '',
    location: '',
    profession: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const res = await UserService.getUserProfile(currentUser.uid);
          setProfileData(prev => ({ ...prev, ...res.data }));
        } catch (err) {
          console.error('Failed to fetch profile', err);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await UserService.updateUserProfile(user.uid, profileData);
      alert('Profile saved successfully!');
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h2>User Profile</h2>
      {profileData.name?(
      <p className="disable"><strong>Name:</strong> {profileData.name }</p>):(
        <p><strong>Name:</strong> Not set</p>
      )}
      <p><strong>Email:</strong> {profileData.email = user?.email}</p>

      <div className="form-group">
        <label>Name:</label>
        <input type="text" name="name" value={profileData.name} onChange={handleChange} className="form-control" />
      </div>

      <div className="form-group">
        <label>Contact Number:</label>
        <input type="text" name="contactNumber" value={profileData.contactNumber} onChange={handleChange} className="form-control" />
      </div>

      <div className="form-group">
        <label>Location:</label>
        <input type="text" name="location" value={profileData.location} onChange={handleChange} className="form-control" />
      </div>

      <div className="form-group">
        <label>Profession:</label>
        <input type="text" name="profession" value={profileData.profession} onChange={handleChange} className="form-control" />
      </div>

      <button onClick={handleSave} className="btn btn-primary mt-3">Save Profile</button>
    </div>
  );
};

export default Profile;

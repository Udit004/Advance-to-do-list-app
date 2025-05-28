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
    <div className="min-h-[60vh] flex items-center justify-center px-2 py-8 bg-transparent">
      <div className="w-full max-w-2xl bg-gradient-to-br from-[#232526]/80 via-[#2c5364]/80 to-[#0f2027]/80 p-8 rounded-2xl shadow-2xl backdrop-blur-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">User Profile</h2>
        {profileData.name ? (
          <p className="text-white/90 mb-2"><strong>Name:</strong> {profileData.name}</p>
        ) : (
          <p className="text-white/70 mb-2"><strong>Name:</strong> Not set</p>
        )}
        <p className="text-white/90 mb-4"><strong>Email:</strong> {user?.email}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white/80 mb-1">Name:</label>
            <input type="text" name="name" value={profileData.name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <div>
            <label className="block text-white/80 mb-1">Contact Number:</label>
            <input type="text" name="contactNumber" value={profileData.contactNumber} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <div>
            <label className="block text-white/80 mb-1">Location:</label>
            <input type="text" name="location" value={profileData.location} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <div>
            <label className="block text-white/80 mb-1">Profession:</label>
            <input type="text" name="profession" value={profileData.profession} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
        </div>
        <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all mt-2">Save Profile</button>
      </div>
    </div>
  );
};

export default Profile;

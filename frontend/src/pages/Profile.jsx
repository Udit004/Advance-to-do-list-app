// Profile.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from "../context/AuthContext";
import API from "../api/config";
import { toast } from "sonner";

const Profile = () => {
  const { currentUser: user } = useAuth();

  const [profileData, setProfileData] = useState({
    username: user?.displayName || '',
    email: user?.email || '',
    age: '',
    profession: '',
    photoURL: '',
    isPremium: false,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.uid) {
        try {
          const response = await API.get(`/user/profile/${profileData._id || user.uid}`);
          if (response.data) {
            setProfileData({
              ...response.data,
              email: response.data.email || user?.email || '',
              photoURL: response.data.profileImage || '',
              isPremium: response.data.isPaid || false,
            });
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setProfileData(prevData => ({
              ...prevData,
              email: user?.email || '',
            }));
          } else {
            toast.error('Failed to fetch profile.');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setProfileData(prevData => ({
          ...prevData,
          email: user?.email || '',
        }));
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      const objectUrl = URL.createObjectURL(e.target.files[0]);
      setProfileData(prev => ({
        ...prev,
        photoURL: objectUrl
      }));
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("username", profileData.username);
      formData.append("email", profileData.email);
      formData.append("age", profileData.age);
      formData.append("profession", profileData.profession);
      formData.append("uid", user.uid);
      if (photoFile) {
        formData.append("image", photoFile);
      }

      let response;
      if (profileData._id) {
        response = await API.put(`/user/profile/${profileData._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Profile updated successfully!");
      } else {
        response = await API.post('/user/create', formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Profile created successfully!");
      }

      setProfileData(prevData => ({
        ...prevData,
        ...response.data,
        photoURL: response.data.profileImage || prevData.photoURL
      }));
      setIsEditing(false);
      setPhotoFile(null);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const isPremium = profileData.isPremium;

  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <p>Loading profile...</p>
        </div>
      ) : (
        <div className={`min-h-screen relative overflow-hidden ${
          isPremium 
            ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900' 
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        }`}>
          {isPremium ? (
            <>
              <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-40 right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </>
          ) : (
            <>
              <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </>
          )}

          <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-3xl">
              <div className={`backdrop-blur-sm rounded-2xl shadow-2xl border p-8 mb-8 ${
                isPremium 
                  ? 'bg-purple-800/30 border-purple-500/30' 
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}>
                <div className="text-center mb-8">
                  <h1 className={`text-3xl font-bold ${
                    isPremium 
                      ? 'text-purple-300' 
                      : 'text-slate-300'
                  }`}>
                    {isPremium ? 'Premium Profile' : 'User Profile'}
                  </h1>
                  <p className="text-slate-400">
                    {isPremium 
                      ? 'Exclusive premium experience with advanced features' 
                      : 'Manage your personal information'}
                  </p>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className={`absolute -inset-2 rounded-full blur-lg opacity-60 group-hover:opacity-90 transition-all duration-500 ${
                      isPremium 
                        ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 animate-pulse' 
                        : ''
                    }`}></div>

                    <img
                      src={profileData.photoURL}
                      alt="Profile"
                      className={`relative rounded-full border-4 shadow-2xl object-cover transition-all duration-300 group-hover:scale-105 ${
                        isPremium 
                          ? 'w-44 h-44 md:w-52 md:h-52 border-purple-400/60 ring-4 ring-indigo-500/30' 
                          : 'w-32 h-32 md:w-40 md:h-40 border-slate-600/50'
                      }`}
                    />

                    {isPremium && (
                      <div className="absolute bottom-0 right-0 w-7 h-7 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg animate-bounce">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-white">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-1">Username</h3>
                    <p className="text-lg">{profileData.username}</p>
                  </div>
                  <div className="text-white">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-1">Email</h3>
                    <p className="text-lg break-all">{profileData.email}</p>
                  </div>
                  <div className="text-white">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-1">Age</h3>
                    <p className="text-lg">{profileData.age || 'Not set'}</p>
                  </div>
                  <div className="text-white">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-1">Profession</h3>
                    <p className="text-lg">{profileData.profession || 'Not set'}</p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                        isPremium
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-purple-400/40'
                          : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md hover:shadow-orange-400/40'
                      }`}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="mt-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-slate-400">Username</label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={profileData.username}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-400">Email</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="age" className="block text-sm font-medium text-slate-400">Age</label>
                          <input
                            type="number"
                            id="age"
                            name="age"
                            value={profileData.age}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="profession" className="block text-sm font-medium text-slate-400">Profession</label>
                          <input
                            type="text"
                            id="profession"
                            name="profession"
                            value={profileData.profession}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="photo" className="block text-sm font-medium text-slate-400">Profile Photo</label>
                          <input
                            type="file"
                            id="photo"
                            name="photo"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={handleSave}
                          className={`font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                            isPremium
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-purple-400/40'
                              : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md hover:shadow-orange-400/40'
                          }`}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 bg-slate-600 text-white shadow-md hover:shadow-slate-400/40"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;

import React, { useEffect, useState } from 'react';
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import API from "../api/config";
import { toast } from "sonner";
import { Input } from "../components/ui/input";

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
            console.log('Profile data from API:', response.data);
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log('Profile not found, will create on save.');
            setProfileData(prevData => ({
              ...prevData,
              email: user?.email || '',
            }));
          } else {
            console.error('Error fetching profile:', error);
            toast.error('Failed to fetch profile.');
            setProfileData(prevData => ({
              ...prevData,
              email: user?.email || '',
            }));
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
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
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
    } catch (err) {
      console.error("Failed to save profile", err);
      toast.error("Failed to save profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPhotoFile(null);
    setProfileData(prev => ({
      ...prev,
      photoURL: prev.profileImage || prev.photoURL
    }));
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        profileData.isPremium 
          ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900' 
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
      }`}>
        <div className={`backdrop-blur-sm rounded-xl p-8 border ${
          profileData.isPremium 
            ? 'bg-purple-800/30 border-purple-500/30' 
            : 'bg-slate-800/50 border-slate-700/50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`animate-spin h-6 w-6 border-2 border-t-transparent rounded-full ${
              profileData.isPremium ? 'border-purple-400' : 'border-orange-500'
            }`}></div>
            <p className="text-slate-300 text-lg">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const isPremium = profileData.isPremium;

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isPremium 
        ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900' 
        : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    }`}>
      {/* Premium Background Effects */}
      {isPremium ? (
        <>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-40 right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-500"></div>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-indigo-400 rounded-full animate-ping delay-700"></div>
            <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping delay-300"></div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
        </>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl">
          {/* Premium Badge - Only for premium users */}
          {isPremium && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur-sm border border-purple-400/30 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-white font-semibold">Premium Member</span>
                </div>
              </div>
            </div>
          )}

          {/* Profile Header Card */}
          <div className={`backdrop-blur-sm rounded-2xl shadow-2xl border p-8 mb-8 transition-all duration-200 hover:scale-[1.01] ${
            isPremium 
              ? 'bg-purple-800/30 border-purple-500/30 hover:shadow-purple-500/20' 
              : 'bg-slate-800/50 border-slate-700/50 hover:shadow-3xl'
          }`}>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className={`bg-clip-text text-transparent ${
                  isPremium 
                    ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400' 
                    : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                }`}>
                  {isPremium ? 'Premium Profile' : 'User Profile'}
                </span>
              </h1>
              <p className="text-slate-400">
                {isPremium 
                  ? 'Exclusive premium experience with advanced features' 
                  : 'Manage your account information and preferences'
                }
              </p>
            </div>

            {/* Profile Photo Section */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                {profileData.photoURL ? (
                  <div className="relative">
                    <div className={`absolute -inset-1 rounded-full blur-lg group-hover:blur-xl transition-all duration-500 opacity-60 group-hover:opacity-80 ${
                      isPremium 
                        ? 'bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-indigo-500/40' 
                        : 'bg-gradient-to-r from-orange-500/30 to-yellow-500/30'
                    }`}></div>
                    <img
                      src={profileData.photoURL}
                      alt="Profile"
                      className={`relative rounded-full border-2 shadow-2xl object-cover transition-all duration-200 group-hover:scale-105 ${
                        isPremium 
                          ? 'w-40 h-40 md:w-48 md:h-48 border-purple-400/50' 
                          : 'w-32 h-32 md:w-40 md:h-40 border-slate-600/50'
                      }`}
                    />
                    {isPremium && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center border-2 border-white">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`rounded-full border-2 flex items-center justify-center backdrop-blur-sm ${
                    isPremium 
                      ? 'w-40 h-40 md:w-48 md:h-48 bg-purple-700/30 border-purple-500/50' 
                      : 'w-32 h-32 md:w-40 md:h-40 bg-slate-700/50 border-slate-600/50'
                  }`}>
                    <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Bio Section - Premium Feature */}
            {isPremium && (
              <div className="text-center mb-8">
                <div className="bg-purple-800/20 backdrop-blur-sm rounded-xl p-6 border border-purple-600/20 max-w-2xl mx-auto">
                  <p className="text-slate-200 text-lg leading-relaxed italic">"Premium users get enhanced visual experience with exclusive styling and animations"</p>
                </div>
              </div>
            )}

            {/* Profile Information Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className={`backdrop-blur-sm rounded-xl p-6 border ${
                isPremium 
                  ? 'bg-purple-700/20 border-purple-600/20' 
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Username</h3>
                <p className="text-white text-lg">{profileData.username || 'Not set'}</p>
              </div>
              <div className={`backdrop-blur-sm rounded-xl p-6 border ${
                isPremium 
                  ? 'bg-purple-700/20 border-purple-600/20' 
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Email</h3>
                <p className="text-white text-lg break-all">{profileData.email}</p>
              </div>
              <div className={`backdrop-blur-sm rounded-xl p-6 border ${
                isPremium 
                  ? 'bg-purple-700/20 border-purple-600/20' 
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Age</h3>
                <p className="text-white text-lg">{profileData.age || 'Not set'}</p>
              </div>
              <div className={`backdrop-blur-sm rounded-xl p-6 border ${
                isPremium 
                  ? 'bg-purple-700/20 border-purple-600/20' 
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Profession</h3>
                <p className="text-white text-lg">{profileData.profession || 'Not set'}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <button
                onClick={() => setIsEditing(true)}
                className={`font-semibold px-8 py-3 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 ${
                  isPremium
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white hover:shadow-purple-500/25'
                    : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white hover:shadow-orange-500/25'
                }`}
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Edit Profile Card - Only show when isEditing is true */}
          {isEditing && (
            <div className={`backdrop-blur-sm rounded-2xl shadow-2xl border p-8 transition-all duration-200 hover:scale-[1.01] ${
              isPremium 
                ? 'bg-purple-800/30 border-purple-500/30 hover:shadow-purple-500/20' 
                : 'bg-slate-800/50 border-slate-700/50 hover:shadow-3xl'
            }`}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Edit Profile</h2>
                <p className="text-slate-400">Update your personal information below</p>
              </div>

              <div className="space-y-6">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      value={profileData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg text-white border transition-all duration-200 backdrop-blur-sm placeholder-slate-400 ${
                        isPremium
                          ? 'bg-purple-700/30 border-purple-600/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50'
                          : 'bg-slate-700/50 border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={profileData.email}
                      onChange={handleChange}
                      readOnly
                      className={`w-full px-4 py-3 rounded-lg text-slate-400 border cursor-not-allowed backdrop-blur-sm ${
                        isPremium
                          ? 'bg-purple-700/20 border-purple-600/20'
                          : 'bg-slate-700/30 border-slate-600/30'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      placeholder="Enter your age"
                      value={profileData.age}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg text-white border transition-all duration-200 backdrop-blur-sm placeholder-slate-400 ${
                        isPremium
                          ? 'bg-purple-700/30 border-purple-600/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50'
                          : 'bg-slate-700/50 border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Profession
                    </label>
                    <input
                      type="text"
                      name="profession"
                      placeholder="What do you do?"
                      value={profileData.profession}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg text-white border transition-all duration-200 backdrop-blur-sm placeholder-slate-400 ${
                        isPremium
                          ? 'bg-purple-700/30 border-purple-600/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50'
                          : 'bg-slate-700/50 border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50'
                      }`}
                    />
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Profile Photo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="profilePic"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label 
                      htmlFor="photo-upload" 
                      className={`flex items-center justify-center w-full px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer group backdrop-blur-sm ${
                        isPremium
                          ? 'bg-purple-700/30 border-purple-600/30 hover:border-purple-500/50'
                          : 'bg-slate-700/50 border-slate-600/50 hover:border-orange-500/50'
                      }`}
                    >
                      <svg className={`w-5 h-5 mr-2 transition-colors duration-200 ${
                        isPremium
                          ? 'text-slate-400 group-hover:text-purple-400'
                          : 'text-slate-400 group-hover:text-orange-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className={`transition-colors duration-200 ${
                        isPremium
                          ? 'text-slate-400 group-hover:text-purple-400'
                          : 'text-slate-400 group-hover:text-orange-400'
                      }`}>
                        {photoFile ? photoFile.name : 'Choose a photo to upload'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    className={`font-semibold px-8 py-3 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 ${
                      isPremium
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white hover:shadow-purple-500/25'
                        : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white hover:shadow-orange-500/25'
                    }`}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`border font-medium px-8 py-3 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                      isPremium
                        ? 'border-purple-600/30 hover:bg-purple-700/30 hover:border-purple-500/50 text-slate-300 hover:text-white'
                        : 'border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
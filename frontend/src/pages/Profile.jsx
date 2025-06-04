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
    photoURL: '', // To hold the profile photo URL
  });

  const [photoFile, setPhotoFile] = useState(null); // To hold uploaded photo file
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode

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
        photoURL: response.data.profileImage || prevData.photoURL // Update photoURL with the actual Cloudinary URL
      }));
      setIsEditing(false); // Close edit form after saving
      setPhotoFile(null); // Reset photo file
    } catch (err) {
      console.error("Failed to save profile", err);
      toast.error("Failed to save profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPhotoFile(null);
    // Reset form data to original state
    setProfileData(prev => ({
      ...prev,
      photoURL: prev.profileImage || prev.photoURL
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-300 text-lg">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Profile Header Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 mb-8 transition-all duration-200 hover:scale-[1.01] hover:shadow-3xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500">
                  User Profile
                </span>
              </h1>
              <p className="text-slate-400">Manage your account information and preferences</p>
            </div>

            {/* Profile Photo Section */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                {profileData.photoURL ? (
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-yellow-500/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-500 opacity-60 group-hover:opacity-80"></div>
                    <img
                      src={profileData.photoURL}
                      alt="Profile"
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-slate-600/50 shadow-2xl object-cover transition-all duration-200 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-700/50 border-2 border-slate-600/50 flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Username</h3>
                <p className="text-white text-lg">{profileData.username || 'Not set'}</p>
              </div>
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Email</h3>
                <p className="text-white text-lg">{profileData.email}</p>
              </div>
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Age</h3>
                <p className="text-white text-lg">{profileData.age || 'Not set'}</p>
              </div>
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Profession</h3>
                <p className="text-white text-lg">{profileData.profession || 'Not set'}</p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <div className="text-center">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-orange-500/25 transition-all duration-200 hover:scale-105"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Edit Profile Card - Only show when isEditing is true */}
          {isEditing && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8 transition-all duration-200 hover:scale-[1.01] hover:shadow-3xl">
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
                      className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 backdrop-blur-sm placeholder-slate-400"
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
                      className="w-full px-4 py-3 rounded-lg bg-slate-700/30 text-slate-400 border border-slate-600/30 cursor-not-allowed backdrop-blur-sm"
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
                      className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 backdrop-blur-sm placeholder-slate-400"
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
                      className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 backdrop-blur-sm placeholder-slate-400"
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
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 hover:border-orange-500/50 transition-all duration-200 cursor-pointer group backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-orange-400 mr-2 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-slate-400 group-hover:text-orange-400 transition-colors duration-200">
                        {photoFile ? photoFile.name : 'Choose a photo to upload'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-orange-500/25 transition-all duration-200 hover:scale-105"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="border border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300 hover:text-white font-medium px-8 py-3 rounded-lg transition-all duration-200 backdrop-blur-sm"
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
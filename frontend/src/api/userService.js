import API from './config';

// User API services
const UserService = {
  // Get user profile
  getUserProfile: (userId) => {
    return API.get(`/user/${userId}`);
  },

  // Update user profile
  updateUserProfile: (userId, profileData) => {
    return API.post(`/user/${userId}`, profileData);
  }
};

export default UserService;

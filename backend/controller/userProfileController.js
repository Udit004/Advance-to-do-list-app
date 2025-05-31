const userProfile = require("../models/userProfileModel");

exports.createUserProfile = async (req, res) => {
    try {
      const profileData = { ...req.body };
  
      if (req.file && req.file.path) {
        profileData.profileImage = req.file.path; // ✅ Save image URL from Cloudinary
      }
  
      delete profileData._id;
      const newProfile = new userProfile(profileData);
      const savedProfile = await newProfile.save();
      res.status(201).json(savedProfile);
  
    } catch (error) {
      console.error('Error creating user profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

exports.getUserProfile = async (req, res) =>{
    try {
        const id = req.params.id;
        const profile = await userProfile.findOne({uid: id});
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    }catch(error){
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
      const { id } = req.params;
      const profileData = { ...req.body };
  
      if (req.file && req.file.path) {
        profileData.profileImage = req.file.path; // ✅ Update image URL if a new one is provided
      }
  
      delete profileData._id;
      const updatedProfile = await userProfile.findByIdAndUpdate(id, profileData, { new: true });
  
      if (!updatedProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
  
      res.json(updatedProfile);
  
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
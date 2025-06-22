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

exports.getUserProfile = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Searching for profile with ID:', id);
        
        // Try to find by uid first (preferred method)
        let profile = await userProfile.findOne({uid: id});
        
        // If not found by uid, try finding by MongoDB _id
        if (!profile) {
            console.log('Profile not found by uid, trying _id');
            try {
                profile = await userProfile.findById(id);
            } catch (err) {
                // If _id format is invalid, this will throw an error
                console.log('Invalid _id format:', err.message);
            }
        }
        
        if (!profile) {
            console.log('Profile not found with any method for ID:', id);
            return res.status(404).json({ 
                error: 'Profile not found',
                searchedId: id,
                message: 'No profile found with the provided identifier'
            });
        }
        
        console.log('Profile found:', profile._id, 'for uid:', profile.uid);
        res.json(profile);
        
    } catch(error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
      const { id } = req.params;
      const profileData = { ...req.body };
      
      console.log('Updating profile for ID:', id);
  
      if (req.file && req.file.path) {
        profileData.profileImage = req.file.path; // ✅ Update image URL if a new one is provided
      }
  
      delete profileData._id;
      
      // Try to update by MongoDB _id first (since this is an update operation)
      let updatedProfile = await userProfile.findByIdAndUpdate(id, profileData, { new: true });
      
      // If not found by _id, try finding by uid and then update
      if (!updatedProfile) {
        console.log('Profile not found by _id, trying uid');
        const profileToUpdate = await userProfile.findOne({uid: id});
        if (profileToUpdate) {
          updatedProfile = await userProfile.findByIdAndUpdate(profileToUpdate._id, profileData, { new: true });
        }
      }
  
      if (!updatedProfile) {
        return res.status(404).json({ 
          error: 'Profile not found',
          searchedId: id,
          message: 'No profile found with the provided identifier for update'
        });
      }
  
      console.log('Profile updated successfully:', updatedProfile._id);
      res.json(updatedProfile);
  
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

// Additional helper function to get profile by multiple identifiers
exports.getProfileByAnyId = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Flexible search for profile with ID:', id);
        
        // Try multiple search strategies
        let profile = null;
        
        // 1. Search by uid
        profile = await userProfile.findOne({uid: id});
        if (profile) {
            console.log('Found profile by uid');
            return res.json(profile);
        }
        
        // 2. Search by email if it looks like an email
        if (id.includes('@')) {
            profile = await userProfile.findOne({email: id});
            if (profile) {
                console.log('Found profile by email');
                return res.json(profile);
            }
        }
        
        // 3. Search by MongoDB _id
        try {
            profile = await userProfile.findById(id);
            if (profile) {
                console.log('Found profile by _id');
                return res.json(profile);
            }
        } catch (err) {
            console.log('Invalid _id format for MongoDB');
        }
        
        // 4. Search by username
        profile = await userProfile.findOne({username: id});
        if (profile) {
            console.log('Found profile by username');
            return res.json(profile);
        }
        
        // If nothing found
        return res.status(404).json({ 
            error: 'Profile not found',
            searchedId: id,
            message: 'No profile found with any matching identifier'
        });
        
    } catch(error) {
        console.error('Error in flexible profile search:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
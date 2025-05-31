// routes/userProfileRoutes.js

const express = require("express");
const router = express.Router();
const userProfileController = require("../controller/userProfileController");
const parser = require('../middleware/cloudinaryStorage');

// Upload standalone image (already exists)
router.post('/upload-profile-image', parser.single('image'), (req, res) => {
  try {
    const imageUrl = req.file.path;
    return res.status(200).json({ imageUrl });
  } catch (err) {
    console.error('Image Upload Failed:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// Get profile
router.get("/profile/:id", userProfileController.getUserProfile);

// ✅ Create profile with image
router.post("/create", parser.single('image'), userProfileController.createUserProfile);

// ✅ Update profile with image
router.put("/profile/:id", parser.single('image'), userProfileController.updateUserProfile);

module.exports = router;

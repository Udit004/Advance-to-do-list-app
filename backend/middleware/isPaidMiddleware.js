const UserProfile = require('../models/userProfileModel');

const isPaidUser = async (req, res, next) => {
    try {
        const user = await UserProfile.findById(req.user.id); // Assuming req.user.id contains the user's ID from authentication middleware
        if (user && user.isPaid) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. You must be a paid user to access this feature.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during payment status check', error: error.message });
    }
};

module.exports = isPaidUser;
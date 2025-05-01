const express = require('express');
const router = express.Router(); // ✅ define the router correctly
const { db } = require('../config/firebase'); // make sure this path is correct

// GET user profile by UID
router.get('/:uid', async (req, res) => {
    const uid = req.params.uid;
    try {
        const userDoc = await db.collection('userdb').doc(uid).get();
        if (userDoc.exists) {
            res.json(userDoc.data());
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST update/create profile
router.post('/:uid', async (req, res) => {
    const uid = req.params.uid;
    const profileData = req.body;

    try {
        await db.collection('userdb').doc(uid).set(profileData, { merge: true });
        res.status(200).json({ message: 'Profile updated successfully' }); // ✅ fixed typo from "josn"
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

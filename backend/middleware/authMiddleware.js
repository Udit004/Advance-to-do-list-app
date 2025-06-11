const admin = require('firebase-admin');
console.log('Auth Middleware executed');

const authMiddleware = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    console.log('Received ID Token:', idToken); // Log the received ID token

    if (!idToken) {
      return res.status(401).json({ message: 'No authentication token provided.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded Token:', decodedToken); // Log the decoded token
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

module.exports = authMiddleware;
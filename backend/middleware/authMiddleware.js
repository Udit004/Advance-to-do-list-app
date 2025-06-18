const admin = require('firebase-admin');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth Middleware executed');
    console.log('Request Headers:', req.headers); // Log all request headers
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    console.log('Received ID Token:', idToken ? 'Token received' : 'No token received'); // Log if token is present

    if (!idToken) {
      return res.status(401).json({ message: 'No authentication token provided.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded Token:', decodedToken); // Log the decoded token
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error.message); // Log only the error message
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

module.exports = authMiddleware;
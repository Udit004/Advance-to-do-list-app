const admin = require('firebase-admin');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth Middleware executed');
    // console.log('Request Headers:', req.headers); // Log all request headers
    
    // Extract the token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found in Authorization header');
      return res.status(401).json({ message: 'No authentication token provided.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    console.log('Received ID Token:', idToken ? 'Token received' : 'No token received');

    if (!idToken) {
      return res.status(401).json({ message: 'No authentication token provided.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // console.log('Decoded Token:', decodedToken);
    
    // Set req.user with the expected structure
    req.user = {
      _id: decodedToken.uid,           // Map Firebase uid to _id
      uid: decodedToken.uid,           // Keep original uid
      email: decodedToken.email,       // Include email
      name: decodedToken.name || decodedToken.displayName, // Include name if available
      displayName: decodedToken.displayName,
      ...decodedToken                  // Include all other Firebase token properties
    };
    
    // console.log('Set req.user:', req.user);
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Authentication token has expired. Please sign in again.' });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ message: 'Authentication token has been revoked. Please sign in again.' });
    } else if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ message: 'Invalid authentication token format.' });
    }
    
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

module.exports = authMiddleware;
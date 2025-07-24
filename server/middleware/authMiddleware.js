const jwt = require('jsonwebtoken');

// This middleware will protect routes by verifying JWT tokens
module.exports = function (req, res, next) {
    // Get token from header
    // Tokens are typically sent in the 'x-auth-token' header or 'Authorization: Bearer <token>'
    // We'll use 'x-auth-token' for simplicity, as it's common in MERN tutorials.
    const token = req.header('x-auth-token');

    // Check if no token is provided
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token using the JWT_SECRET from environment variables
        // The decoded object will contain the payload we signed (user: { id, role })
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user data (id, role) from the token payload to the request object
        // This makes req.user.id and req.user.role accessible in subsequent route handlers
        req.user = decoded.user;
        next(); // Call next() to pass control to the next middleware function or route handler
    } catch (err) {
        // If the token is not valid (e.g., expired, malformed, tampered with)
        console.error(err.message); // Log the error for debugging
        res.status(401).json({ msg: 'Token is not valid or expired' });
    }
};
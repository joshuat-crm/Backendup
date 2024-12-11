// middlewares/verifyRole.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as necessary

const verifyRole = (requiredRole) => {
    return async (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1]; // Assuming Bearer token format

        if (!token) {
            return res.status(403).json({ message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.role !== requiredRole) {
                return res.status(403).json({ message: 'Permission denied' });
            }

            req.user = user; // Attach user info to request for further use
            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to authenticate token', error });
        }
    };
};

module.exports = verifyRole;

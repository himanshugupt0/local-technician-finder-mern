const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For generating JWT tokens
const User = require('../models/User'); // Import the User Mongoose model
const Technician = require('../models/Technician'); // Import the Technician Mongoose model

// @route   POST /api/auth/register
// @desc    Register a new user or technician
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // 1. Check if a user with this email already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // 2. Create a new User instance
        user = new User({
            name,
            email,
            password, // This will be hashed before saving
            role: role || 'user' // Default to 'user' if role is not specified
        });

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10); // Generate a salt for hashing (cost factor 10)
        user.password = await bcrypt.hash(password, salt); // Hash the user's password with the salt

        // 4. Save the user to the database
        await user.save();

        // 5. If the registered user is a technician, create a basic technician profile
        if (user.role === 'technician') {
            const technician = new Technician({
                user: user._id, // Link to the newly created User document's _id
                servicesOffered: ['Other'], // Default initial service, can be changed by tech
                location: 'To be specified', // Placeholder location
                contactNumber: '0000000000', // Placeholder contact number
                serviceAreas: [], // <--- UPDATED: Initialize as empty array for new technicians
            });
            await technician.save();
        }

        // 6. Generate JWT token for the newly registered user
        const payload = {
            user: {
                id: user.id, // Mongoose virtual 'id' getter returns _id as string
                role: user.role
            }
        };

        // Sign the token with the secret and set expiration
        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Your secret key from .env
            { expiresIn: '1h' }, // Token expiration time (e.g., 1 hour)
            (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.role, userId: user.id }); // Send the token, role, and user ID in the response
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if a user with the provided email exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 2. Compare the provided plain-text password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 3. Generate JWT token for the logged-in user
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Sign the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.role, userId: user.id }); // Send token, role, and user ID
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
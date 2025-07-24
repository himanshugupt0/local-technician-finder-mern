const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Import our authentication middleware
const User = require('../models/User'); // Import User model
const Technician = require('../models/Technician'); // Import Technician model

// @route   GET /api/profile/me
// @desc    Get current logged-in user's profile (general user or technician's linked user data)
// @access  Private (requires authentication)
router.get('/me', auth, async (req, res) => {
    try {
        // req.user will contain the user ID and role from the JWT payload
        // We use .select('-password') to exclude the password field from the result
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/profile/technician/me
// @desc    Get current logged-in technician's detailed profile
// @access  Private (requires authentication and technician role)
router.get('/technician/me', auth, async (req, res) => {
    try {
        // Check if the authenticated user has the 'technician' role
        if (req.user.role !== 'technician') {
            return res.status(403).json({ msg: 'Access denied: Not a technician' });
        }

        // Find the technician profile linked to the authenticated user ID
        // .populate('user', ['name', 'email']) will fetch user details (name, email)
        // and include them in the technician object
        const technicianProfile = await Technician.findOne({ user: req.user.id }).populate('user', ['name', 'email']);

        if (!technicianProfile) {
            return res.status(404).json({ msg: 'Technician profile not found' });
        }

        res.json(technicianProfile);
    } catch (err) {
        console.error(err.message);
        // If the ID format is invalid (e.g., not a valid ObjectId)
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Technician not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/profile/technician
// @desc    Create or update a technician's profile
// @access  Private (requires authentication and technician role)
router.post('/technician', auth, async (req, res) => {
    // Check if the authenticated user has the 'technician' role
    if (req.user.role !== 'technician') {
        return res.status(403).json({ msg: 'Access denied: Only technicians can create/update profiles' });
    }

    // Destructure fields from the request body
    const { servicesOffered, specializations, contactNumber, location, description, availability, serviceAreas } = req.body; // <--- UPDATED: Add serviceAreas

    // Build technicianProfile object
    const technicianFields = {};
    technicianFields.user = req.user.id; // Link to the user ID from the token

    if (servicesOffered) {
        // Ensure servicesOffered is an array and unique
        technicianFields.servicesOffered = Array.isArray(servicesOffered)
            ? [...new Set(servicesOffered)]
            : servicesOffered.split(',').map(service => service.trim()).filter(service => service.length > 0);
    }
    if (specializations) {
         // Ensure specializations is an array and unique
        technicianFields.specializations = Array.isArray(specializations)
            ? [...new Set(specializations)]
            : specializations.split(',').map(spec => spec.trim()).filter(spec => spec.length > 0);
    }
    if (contactNumber) technicianFields.contactNumber = contactNumber;
    if (location) technicianFields.location = location;
    if (description) technicianFields.description = description;
    if (availability) technicianFields.availability = availability;
    if (serviceAreas) { // <--- NEW: Handle serviceAreas
        technicianFields.serviceAreas = Array.isArray(serviceAreas)
            ? [...new Set(serviceAreas)]
            : serviceAreas.split(',').map(area => area.trim()).filter(area => area.length > 0);
    }

    try {
        let technician = await Technician.findOne({ user: req.user.id });

        if (technician) {
            // Update existing profile
            technician = await Technician.findOneAndUpdate(
                { user: req.user.id },
                { $set: technicianFields },
                { new: true, runValidators: true } // Return the updated document and run schema validators
            ).populate('user', ['name', 'email']);
            return res.json(technician);
        }

        // Create new profile (this case should ideally be covered during registration, but good for robustness)
        technician = new Technician(technicianFields);
        await technician.save();
        await technician.populate('user', ['name', 'email']);
        res.status(201).json(technician);

    } catch (err) {
        console.error(err.message);
        // Mongoose validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
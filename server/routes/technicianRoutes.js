const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician'); // Import Technician model
const User = require('../models/User'); // Import User model (for population)
const auth = require('../middleware/authMiddleware'); // Import auth middleware (for some future protected routes)

// @route   GET /api/technicians
// @desc    Get all VERIFIED technicians with their user data
// @access  Public
router.get('/', async (req, res) => {
    try {
        const technicians = await Technician.find({ isVerifiedByAdmin: true })
                                            .populate('user', ['name', 'email'])
                                            .select('-__v');

        res.json(technicians);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- CRITICAL FIX: /search route MUST come BEFORE /:id route ---

// @route   GET /api/technicians/search
// @desc    Search and filter technicians by service and/or location and/or serviceArea
// @access  Public
router.get('/search', async (req, res) => {
    const { service, location, serviceArea } = req.query;

    const query = { isVerifiedByAdmin: true };

    if (service) {
        query.servicesOffered = { $in: [new RegExp(service, 'i')] };
    }
    if (location) {
        query.location = { $regex: new RegExp(location, 'i') };
    }
    if (serviceArea) {
        query.serviceAreas = { $in: [new RegExp(serviceArea, 'i')] };
    }

    try {
        const technicians = await Technician.find(query)
                                            .populate('user', ['name', 'email'])
                                            .select('-__v');

        if (technicians.length === 0) {
            return res.status(404).json({ msg: 'No technicians found matching your criteria' });
        }

        res.json(technicians);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/technicians/:id
// @desc    Get single technician by ID (public profile)
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const technician = await Technician.findById(req.params.id)
                                            .populate('user', ['name', 'email'])
                                            .select('-__v');

        if (!technician) {
            return res.status(404).json({ msg: 'Technician not found' });
        }

        res.json(technician);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Technician not found' });
        }
        res.status(500).send('Server Error');
    }
});


module.exports = router;
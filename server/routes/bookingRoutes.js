const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Import our authentication middleware
const Booking = require('../models/Booking'); // Import Booking model
const Technician = require('../models/Technician'); // Import Technician model (to check availability)

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (only authenticated users can book)
router.post('/', auth, async (req, res) => {
    // Ensure only 'user' role can create a booking
    if (req.user.role !== 'user') {
        return res.status(403).json({ msg: 'Access denied: Only regular users can create bookings' });
    }

    const { technicianId, service, bookingDate, bookingTime, notes, totalPrice } = req.body;

    try {
        // 1. Check if technician exists and is verified
        const technician = await Technician.findById(technicianId);
        if (!technician || !technician.isVerifiedByAdmin) {
            return res.status(404).json({ msg: 'Technician not found or not verified' });
        }

        // 2. Simple availability check (can be expanded later)
        // For now, check if the requested day is in technician's availability array
        const requestedDay = new Date(bookingDate).toLocaleString('en-US', { weekday: 'long' });
        if (!technician.availability.includes(requestedDay)) {
            return res.status(400).json({ msg: `${technician.user.name} is not available on ${requestedDay}` });
        }

        // 3. Check for existing bookings to prevent double-booking for the same technician at the same time
        const existingBooking = await Booking.findOne({
            technician: technicianId,
            bookingDate: new Date(bookingDate), // Compare as Date objects
            bookingTime: bookingTime,
            status: { $in: ['pending', 'confirmed'] } // Only check active bookings
        });

        if (existingBooking) {
            return res.status(400).json({ msg: 'This time slot is already booked for this technician.' });
        }

        // 4. Create new booking
        const newBooking = new Booking({
            user: req.user.id, // User ID from the token
            technician: technicianId,
            service,
            bookingDate: new Date(bookingDate), // Store as Date object
            bookingTime,
            notes,
            totalPrice: totalPrice || 0,
            status: 'pending' // Default status
        });

        const booking = await newBooking.save();
        res.status(201).json(booking); // 201 Created

    } catch (err) {
        console.error(err.message);
        // Handle Mongoose validation errors or other specific errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/bookings/me
// @desc    Get all bookings for the authenticated user (user or technician)
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        let bookings;
        if (req.user.role === 'user') {
            // Get bookings made BY this user
            bookings = await Booking.find({ user: req.user.id })
                                    .populate('technician', ['name', 'email', 'contactNumber']) // Populate technician's user info
                                    .select('-__v')
                                    .sort({ createdAt: -1 }); // Latest bookings first
        } else if (req.user.role === 'technician') {
            // Get bookings made FOR this technician
            // First find the technician profile linked to this user's ID
            const technicianProfile = await Technician.findOne({ user: req.user.id });
            if (!technicianProfile) {
                return res.status(404).json({ msg: 'Technician profile not found.' });
            }
            bookings = await Booking.find({ technician: technicianProfile._id })
                                    .populate('user', ['name', 'email']) // Populate the user who booked
                                    .select('-__v')
                                    .sort({ createdAt: -1 });
        } else {
            return res.status(403).json({ msg: 'Access denied: Invalid user role.' });
        }
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (e.g., confirmed, completed, cancelled)
// @access  Private (only technician or admin)
router.put('/:id/status', auth, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid booking status provided.' });
    }

    try {
        let booking = await Booking.findById(id).populate('technician');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Authorization: Only the associated technician or an admin can update status
        const technicianProfile = await Technician.findOne({ user: req.user.id });

        if (!technicianProfile || booking.technician._id.toString() !== technicianProfile._id.toString()) {
            // This assumes only a technician can update their own bookings. Admin role check can be added here.
            return res.status(403).json({ msg: 'Access denied: You are not authorized to update this booking status.' });
        }

        booking.status = status;
        await booking.save();
        res.json(booking);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        res.status(500).send('Server Error');
    }
});


module.exports = router;
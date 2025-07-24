const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Our general authentication middleware
const User = require('../models/User'); // User model
const Technician = require('../models/Technician'); // Technician model
const Review = require('../models/Review'); // Review model (will be used for deletion cascade)
const Booking = require('../models/Booking'); // Booking model (will be used for deletion cascade)

// Middleware to restrict access to only admin users
const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed
    } else {
        return res.status(403).json({ msg: 'Access denied: Admin privileges required' });
    }
};

// @route   GET /api/admin/unverified-technicians
// @desc    Get all technicians awaiting admin verification
// @access  Private (Admin only)
router.get('/unverified-technicians', [auth, authorizeAdmin], async (req, res) => {
    try {
        const unverifiedTechnicians = await Technician.find({ isVerifiedByAdmin: false })
                                                      .populate('user', ['name', 'email'])
                                                      .select('-__v');

        if (unverifiedTechnicians.length === 0) {
            return res.status(200).json([]); // Return empty array if no unverified technicians
        }

        res.json(unverifiedTechnicians);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/technicians/:id/verify
// @desc    Verify/Approve a technician by their Technician ID
// @access  Private (Admin only)
router.put('/technicians/:id/verify', [auth, authorizeAdmin], async (req, res) => {
    try {
        const technicianId = req.params.id;

        let technician = await Technician.findById(technicianId);

        if (!technician) {
            return res.status(404).json({ msg: 'Technician not found' });
        }

        if (technician.isVerifiedByAdmin) {
            return res.status(400).json({ msg: 'Technician is already verified.' });
        }

        technician.isVerifiedByAdmin = true; // Mark as verified
        await technician.save();

        // Optionally, update the associated user's role to technician if they were 'user' before
        const user = await User.findById(technician.user);
        if (user && user.role !== 'technician') {
            user.role = 'technician';
            await user.save();
        }

        res.json({ msg: 'Technician verified successfully', technician });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Technician not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/technicians/:id/disapprove
// @desc    Disapprove/Unverify a technician by their Technician ID
// @access  Private (Admin only)
router.put('/technicians/:id/disapprove', [auth, authorizeAdmin], async (req, res) => {
    try {
        const technicianId = req.params.id;

        let technician = await Technician.findById(technicianId);

        if (!technician) {
            return res.status(404).json({ msg: 'Technician not found' });
        }

        if (!technician.isVerifiedByAdmin) {
            return res.status(400).json({ msg: 'Technician is already unverified.' });
        }

        technician.isVerifiedByAdmin = false; // Mark as unverified
        await technician.save();

        res.json({ msg: 'Technician disapproved successfully', technician });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Technician not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role (e.g., set to admin)
// @access  Private (Admin only) - Use with extreme caution!
router.put('/users/:id/role', [auth, authorizeAdmin], async (req, res) => {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['user', 'technician', 'admin'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role provided' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent an admin from demoting themselves or the primary admin
        if (req.user.id === userId && role !== 'admin') {
            return res.status(403).json({ msg: 'Cannot demote yourself' });
        }

        user.role = role;
        await user.save();

        // If changing to 'technician' and no technician profile exists, create one
        if (role === 'technician') {
            let technician = await Technician.findOne({ user: user._id });
            if (!technician) {
                technician = new Technician({
                    user: user._id,
                    servicesOffered: ['Other'],
                    location: 'To be specified',
                    contactNumber: '0000000000'
                });
                await technician.save();
            }
        }

        res.json({ msg: `User ${user.email} role updated to ${role}`, user: { id: user._id, email: user.email, role: user.role } });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});


// Task 30.2 - Add routes for getting all technicians and all users
// @route   GET /api/admin/all-technicians
// @desc    Get all technicians (verified or not)
// @access  Private (Admin only)
router.get('/all-technicians', [auth, authorizeAdmin], async (req, res) => {
    try {
        const technicians = await Technician.find({}) // Find all, no filter for verification status
                                            .populate('user', ['name', 'email', 'role']) // Also get user role
                                            .sort({ createdAt: -1 })
                                            .select('-__v');
        res.json(technicians);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users
// @desc    Get all users (including admins and technicians)
// @access  Private (Admin only)
router.get('/users', [auth, authorizeAdmin], async (req, res) => {
    try {
        const users = await User.find({})
                                .sort({ createdAt: -1 })
                                .select('-password -__v'); // Exclude password and __v
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Task 30.3 - Add routes for deleting technicians and users
// @route   DELETE /api/admin/technicians/:id
// @desc    Delete a technician profile and associated user (if no other technician profile linked)
// @access  Private (Admin only)
router.delete('/technicians/:id', [auth, authorizeAdmin], async (req, res) => {
    try {
        const technicianId = req.params.id;

        // 1. Find the technician profile
        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({ msg: 'Technician profile not found' });
        }

        const userId = technician.user;

        // 2. Remove associated reviews
        await Review.deleteMany({ technician: technicianId });

        // 3. Remove associated bookings
        await Booking.deleteMany({ technician: technicianId });

        // 4. Remove the technician profile
        await technician.deleteOne(); // Use deleteOne() for Mongoose 6+

        // 5. Optionally remove the associated user if they are *only* a technician
        // Check if there are other technician profiles linked to this user, or if user is admin
        const user = await User.findById(userId);
        if (user) {
            const otherTechnicianProfiles = await Technician.find({ user: userId });
            if (otherTechnicianProfiles.length === 0 && user.role !== 'admin') {
                // If no other technician profiles and not an admin, delete the user too
                await user.deleteOne();
                res.json({ msg: 'Technician and associated user deleted successfully' });
            } else {
                // If user has other tech profiles or is admin, just update role if needed
                if (user.role === 'technician') {
                    user.role = 'user'; // Demote to regular user if technician role was primary
                    await user.save();
                }
                res.json({ msg: 'Technician profile deleted successfully, user role updated if necessary' });
            }
        } else {
             res.json({ msg: 'Technician profile deleted successfully (associated user not found or already deleted)' });
        }

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Technician profile not found' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and all associated technician profiles, bookings, reviews
// @access  Private (Admin only) - EXTREMELY DANGEROUS, USE WITH CAUTION
router.delete('/users/:id', [auth, authorizeAdmin], async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (req.user.id === userId) {
            return res.status(403).json({ msg: 'Cannot delete your own admin account' });
        }

        // 1. Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // 2. If user is a technician, delete associated technician profile(s)
        const technicianProfiles = await Technician.find({ user: userId });
        for (let techProfile of technicianProfiles) {
            await Review.deleteMany({ technician: techProfile._id }); // Delete reviews for this technician
            await Booking.deleteMany({ technician: techProfile._id }); // Delete bookings for this technician
            await techProfile.deleteOne(); // Delete the technician profile
        }

        // 3. Delete reviews made by this user
        await Review.deleteMany({ user: userId });

        // 4. Delete bookings made by this user
        await Booking.deleteMany({ user: userId });

        // 5. Delete the user
        await user.deleteOne();

        res.json({ msg: 'User and all associated data deleted successfully' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});


module.exports = router;
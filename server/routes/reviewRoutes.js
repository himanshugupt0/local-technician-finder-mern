const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Import our authentication middleware
const Review = require('../models/Review');       // Import Review model
const Technician = require('../models/Technician'); // Import Technician model (to update ratings)
const User = require('../models/User');           // Import User model (to populate user info)


// Helper function to calculate and update technician's average rating
const updateTechnicianAverageRating = async (technicianId) => {
    try {
        // Find all reviews for this technician
        const reviews = await Review.find({ technician: technicianId });

        let averageRating = 0;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = totalRating / reviews.length;
        }

        // Update the Technician document
        await Technician.findByIdAndUpdate(
            technicianId,
            { averageRating: averageRating, reviewCount: reviews.length },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        );
    } catch (error) {
        console.error(`Error updating technician ${technicianId} average rating:`, error.message);
        // Don't rethrow, as this helper shouldn't block the main review submission
    }
};


// @route   POST /api/reviews
// @desc    Submit a review for a technician
// @access  Private (Only authenticated users with 'user' role can submit reviews)
router.post('/', auth, async (req, res) => {
    // Ensure only regular users can submit reviews
    if (req.user.role !== 'user') {
        return res.status(403).json({ msg: 'Access denied: Only regular users can submit reviews' });
    }

    const { technicianId, rating, comment } = req.body;

    try {
        // 1. Check if technician exists
        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({ msg: 'Technician not found' });
        }

        // 2. Check if the user has already reviewed this technician
        // (Optional: You might allow multiple reviews, but typically it's one per user for a given service/technician)
        const existingReview = await Review.findOne({
            technician: technicianId,
            user: req.user.id
        });

        if (existingReview) {
            return res.status(400).json({ msg: 'You have already reviewed this technician.' });
        }

        // 3. Create new review
        const newReview = new Review({
            technician: technicianId,
            user: req.user.id, // User ID from authenticated token
            rating,
            comment
        });

        const review = await newReview.save();

        // 4. Update the technician's average rating and review count
        await updateTechnicianAverageRating(technicianId);

        res.status(201).json(review); // 201 Created

    } catch (err) {
        console.error(err.message);
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/reviews/:technicianId
// @desc    Get all reviews for a specific technician
// @access  Public
router.get('/:technicianId', async (req, res) => {
    try {
        const reviews = await Review.find({ technician: req.params.technicianId })
                                    .populate('user', ['name']) // Populate reviewer's name
                                    .sort({ createdAt: -1 })    // Latest reviews first
                                    .select('-__v');

        if (reviews.length === 0) {
            return res.status(200).json([]); // Return empty array if no reviews
        }

        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Technician not found or invalid ID' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
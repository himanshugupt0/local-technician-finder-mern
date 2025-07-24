const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician', // Reference to the Technician being reviewed
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who wrote the review
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optional: Add a compound unique index to ensure a user can only review a specific technician once
// ReviewSchema.index({ technician: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
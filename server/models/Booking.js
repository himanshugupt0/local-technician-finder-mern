const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who made the booking
        required: true
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician', // Reference to the Technician being booked
        required: true
    },
    service: {
        type: String,
        required: true,
        trim: true
    },
    bookingDate: {
        type: Date, // The date the service is booked for
        required: true
    },
    bookingTime: {
        type: String, // e.g., "09:00 AM", "02:30 PM" - string for simplicity, can be more complex
        required: true
    },
    // Consider adding an array for available slots if using exact time slots
    // bookedSlots: [{ type: Date }], // For specific time slot management

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        default: 0 // Optional: If you want to calculate price per service
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [300, 'Notes cannot be more than 300 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to update `updatedAt` field automatically
BookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Booking', BookingSchema);
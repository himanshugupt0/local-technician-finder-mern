const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    servicesOffered: [{
        type: String,
        // --- UPDATED ENUM FOR MORE SPECIFIC SERVICE TYPES ---
        enum: ['Home Appliance Repair', 'Plumbing', 'Electrical Services',
               'Computer Hardware Repair', 'Software Troubleshooting', 'Network Setup',
               'Car Repair', 'Motorcycle Repair', 'Vehicle AC Repair', 'Other'],
        required: true
    }],
    specializations: [String],
    contactNumber: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+?\d{10,15}$/, 'Please fill a valid contact number']
    },
    location: { // Technician's primary location (e.g., their city/town)
        type: String,
        required: true,
        trim: true
    },
    serviceAreas: [{ // <--- NEW FIELD: Areas technician is willing to serve
        type: String,
        trim: true
    }],
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    availability: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isVerifiedByAdmin: {
        type: Boolean,
        default: false
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

TechnicianSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Technician', TechnicianSchema);
import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        default: ''
    },
    endTime: {
        type: String,
        default: ''
    },
    location: String,
    participants: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String, // Storing username for simplicity as per current frontend logic, could be ObjectId ref relative to User model
        required: true
    },
    isVip: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Event', EventSchema);

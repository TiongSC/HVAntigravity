import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';

const router = express.Router();

// Create Event
router.post('/', async (req, res) => {
    try {
        const { title, description, startDate, endDate, startTime, endTime, location, createdBy } = req.body;

        const user = await User.findOne({ username: createdBy });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Limit Check: Max 2 events per day for Non-Admin
        if (user.role !== 'admin') {
            const today = new Date();
            const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);

            const count = await Event.countDocuments({
                createdBy: user.username,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            if (count >= 2) {
                return res.status(400).json({ success: false, message: 'Daily limit reached' });
            }
        }

        const newEvent = new Event({
            title, description, startDate, endDate, startTime, endTime, location, createdBy,
            isVip: user.role === 'vip' || user.role === 'admin'
        });

        await newEvent.save();
        res.json({ success: true, event: newEvent });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().sort({ isVip: -1, startDate: 1 }); // VIPs first, then by date
        res.json(events);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Event
router.delete('/:id', async (req, res) => {
    try {
        const { username } = req.body; // Requester username
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        const user = await User.findOne({ username });

        if (user.role !== 'admin' && event.createdBy !== username) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;

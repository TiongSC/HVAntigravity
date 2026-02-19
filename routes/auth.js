import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newUser = new User({ username, email, password }); // Note: Password hashing should be added here
        await newUser.save();
        res.json({ success: true, user: { username: newUser.username, role: newUser.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password }); // Note: Compare hashed password here
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        res.json({ success: true, user: { username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Current User (Mock session)
router.get('/me', async (req, res) => {
    // In a real app, verify token/session here.
    // For now, client sends username in header or we rely on client state
    res.json({ success: true, message: 'Session management to be implemented' });
});

export default router;

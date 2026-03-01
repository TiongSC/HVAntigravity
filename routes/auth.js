import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const verificationToken = Math.random().toString(36).substring(2, 15);
        const newUser = new User({
            username,
            email,
            password,
            verificationToken,
            isVerified: false
        });
        await newUser.save();

        console.log(`[SIMULATED EMAIL] To: ${email}, Subject: Verify Your Vibe, Body: Your verification token is: ${verificationToken}`);

        res.json({ success: true, message: 'Signup successful! Please verify your email.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { username, token } = req.body;
        const user = await User.findOne({ username, verificationToken: token });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email first', needsVerification: true });
        }

        res.json({ success: true, user: { username: user.username, role: user.role, email: user.email } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Forgot Password (Send OTP)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = otp;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        console.log(`[SIMULATED EMAIL] To: ${email}, Subject: Password Reset OTP, Body: Your OTP is: ${otp}`);

        res.json({ success: true, message: 'OTP sent to your email.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully!' });
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

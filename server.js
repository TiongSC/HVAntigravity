import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(__dirname));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hvantigravity')
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working" });
});

// Import Routes
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

app.get('/', (req, res) => {
  res.send('HVAntigravity API is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
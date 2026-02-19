import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from root for now

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/happening_vibe')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('Happening Vibe API is running');
});

// Import Routes
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

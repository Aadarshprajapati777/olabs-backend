import express from 'express';
import { StreamClient } from "@stream-io/node-sdk";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Compute __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stream API credentials
const API_KEY = process.env.REACT_APP_STREAM_API_KEY;
const API_SECRET = process.env.REACT_APP_STREAM_TOKEN;
const client = new StreamClient(API_KEY, API_SECRET, { timeout: 9000 });

// Configure CORS
app.use(cors({
  origin: 'https://hack-olabs-dashboard.vercel.app/', // Change this to your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Route to generate Stream token
app.post('/api/get-stream-token', async (req, res) => {
    try {
        const { userId, userName } = req.body;
        console.log("got ", req.body);
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const newUser = {
            id: userId,
            role: 'user',
            custom: {
                color: 'red',
            },
            name: userName,
            image: 'https://therapist-prod-public.s3.ap-south-1.amazonaws.com/therapist/profile/67358bf0f29c7915bbaaeaef/1735456843784-WhatsApp%20Image%202024-12-25%20at%2015.21.52.jpeg',
        };

        // Upsert the new user
        await client.upsertUsers([newUser]);

        // Generate a user token valid for 1 hour
        const token = client.generateUserToken({ user_id: userId, validity_in_seconds: 60 * 60 });

        res.json({
            token,
            userId,
            userName: userName || `User-${userId.substring(0, 5)}`,
            userImage: 'https://therapist-prod-public.s3.ap-south-1.amazonaws.com/therapist/profile/67358bf0f29c7915bbaaeaef/1735456843784-WhatsApp%20Image%202024-12-25%20at%2015.21.52.jpeg',
        });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;

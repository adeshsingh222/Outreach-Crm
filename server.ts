import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Company } from './src/models/Company.js';
import { Note } from './src/models/Note.js';
import { Activity } from './src/models/Activity.js';
import { User } from './src/models/User.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log("Connected to MongoDB via Mongoose");
    
    // Seed dummy user
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'admin@crm.com',
        name: 'Admin',
        passwordHash
      });
      console.log('Dummy user created: admin@crm.com / password123');
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  // --- AUTH MIDDLEWARE & ROUTES ---
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.json({ message: 'Logged in successfully', user: { email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out successfully' });
  });

  // PROTECT ALL SUBSEQUENT API ROUTES
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth')) return next();
    authenticateToken(req, res, next);
  });

  // --- API ROUTES ---

  // Dashboard Stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const total = await Company.countDocuments();
      const contacted = await Company.countDocuments({ status: { $ne: 'Not Contacted' } });
      const hrConnected = await Company.countDocuments({ status: 'HR Connected' });
      const interviews = await Company.countDocuments({ status: 'Interview' });
      const offers = await Company.countDocuments({ status: 'Offer' });
      const resumesSent = await Company.countDocuments({ status: 'Resume Sent' });
      
      const now = new Date();
      const overdue = await Company.countDocuments({
        nextFollowUp: { $lt: now }
      });

      res.json({ total, contacted, resumesSent, hrConnected, interviews, offers, overdue });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Recent Activity
  app.get('/api/dashboard/activity', async (req, res) => {
    try {
      const activities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('companyId', 'name');
        
      res.json(activities.map(a => {
        const json = a.toJSON();
        return {
          ...json,
          company: json.companyId // map to match frontend expectation
        };
      }));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  // Follow-ups
  app.get('/api/dashboard/follow-ups', async (req, res) => {
    try {
      const followUps = await Company.find({ nextFollowUp: { $ne: null } })
        .sort({ nextFollowUp: 1 })
        .limit(5);
      res.json(followUps);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch follow-ups' });
    }
  });

  // Companies CRUD
  app.get('/api/companies', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [companies, total] = await Promise.all([
        Company.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        Company.countDocuments()
      ]);

      res.json({
        data: companies,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  });

  app.post('/api/companies', async (req, res) => {
    try {
      const data = req.body;
      const result = await Company.insertMany(
        data.map((c: any) => ({
          name: c.name,
          website: c.website,
          phone: c.phone,
          address: c.address,
          category: c.category,
          rating: c.rating,
          reviews: c.reviews,
          placeId: c.placeId,
          status: c.status || 'Not Started',
          priority: c.priority || 'Low',
          lastContactDate: c.lastContact !== '-' ? new Date(c.lastContact) : null,
        }))
      );
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create companies' });
    }
  });

  app.put('/api/companies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      // Remove id from data to prevent Mongoose errors
      const { id: _id, ...updateData } = data;
      const result = await Company.findByIdAndUpdate(id, updateData, { new: true });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  });

  // Notes
  app.get('/api/companies/:id/notes', async (req, res) => {
    try {
      const { id } = req.params;
      const notes = await Note.find({ companyId: id }).sort({ createdAt: -1 });
      res.json(notes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  app.post('/api/companies/:id/notes', async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const note = await Note.create({
        content,
        companyId: id
      });
      res.json(note);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

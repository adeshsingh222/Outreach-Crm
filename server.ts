import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Company } from './src/models/Company.js';
import { Note } from './src/models/Note.js';
import { Activity } from './src/models/Activity.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log("Connected to MongoDB via Mongoose");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

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

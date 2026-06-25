import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Company } from './src/models/Company.js';
import { Note } from './src/models/Note.js';
import { Activity } from './src/models/Activity.js';
import { User } from './src/models/User.js';
import { Asset } from './src/models/Asset.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/uploads', express.static(uploadsDir));

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage: storage });

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
      // console.log('Dummy user created: admin@crm.com / password123');
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  // --- AUTH MIDDLEWARE & ROUTES ---
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is required in production mode!");
    process.exit(1);
  }
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
      const notStarted = await Company.countDocuments({ status: { $in: ['Not Started', 'Not Contacted'] } });
      const contacted = await Company.countDocuments({ status: 'Contacted' });
      const pitched = await Company.countDocuments({ status: 'Pitched' });
      const followUp = await Company.countDocuments({ status: 'Follow-up' });
      const connected = await Company.countDocuments({ status: 'Connected' });
      const lost = await Company.countDocuments({ status: 'Lost' });

      const now = new Date();
      const overdue = await Company.countDocuments({
        nextFollowUp: { $lt: now }
      });

      // Fetch activities created in the last 7 days for the chart
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activitiesLast7Days = await Activity.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            count: { $sum: 1 }
          }
        }
      ]);

      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Mon"
        const dayOfWeekIndex = d.getDay() + 1; // getDay() is 0-indexed (Sunday = 0), $dayOfWeek is 1-indexed (Sunday = 1)
        const match = activitiesLast7Days.find(a => a._id === dayOfWeekIndex);
        chartData.push({
          name: dayName,
          count: match ? match.count : 0
        });
      }

      res.json({
        total,
        notStarted,
        contacted,
        pitched,
        followUp,
        connected,
        lost,
        overdue,
        activityChart: chartData
      });
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

  app.post('/api/companies/check-duplicates', async (req, res) => {
    try {
      const { names = [], placeIds = [] } = req.body;
      const validPlaceIds = (placeIds as string[]).filter(Boolean);
      
      // Compute metaName slugs from the incoming names
      const toSlug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');
      const metaNames = (names as string[]).map(toSlug).filter(Boolean);

      const conditions: any[] = [];
      if (metaNames.length > 0) conditions.push({ metaName: { $in: metaNames } });
      if (validPlaceIds.length > 0) conditions.push({ placeId: { $in: validPlaceIds } });
      // Fallback: also match raw name for older records without metaName
      if ((names as string[]).length > 0) conditions.push({ name: { $in: names } });

      if (conditions.length === 0) return res.json([]);

      const duplicates = await Company.find({ $or: conditions }, { name: 1, placeId: 1, metaName: 1 });
      res.json(duplicates);
    } catch (error) {
      console.error('Failed to check duplicates:', error);
      res.status(500).json({ error: 'Failed to check duplicates' });
    }
  });

  app.post('/api/companies', async (req, res) => {
    try {
      const data = req.body;
      const toSlug = (s: string) => (s || '').toLowerCase().trim().replace(/\s+/g, '-');

      const incomingMetaNames = data.map((c: any) => toSlug(c.name)).filter(Boolean);
      const incomingPlaceIds = data.map((c: any) => (c.placeId || '').toLowerCase().trim()).filter(Boolean);
      
      const conditions: any[] = [];
      if (incomingMetaNames.length > 0) conditions.push({ metaName: { $in: incomingMetaNames } });
      if (incomingPlaceIds.length > 0) conditions.push({ placeId: { $in: incomingPlaceIds } });
      // Fallback for legacy records without metaName
      if (data.length > 0) conditions.push({ name: { $in: data.map((c: any) => c.name) } });

      const existingMetaNames = new Set<string>();
      const existingPlaceIds = new Set<string>();
      const existingNames = new Set<string>();

      if (conditions.length > 0) {
        const existing = await Company.find({ $or: conditions }, { name: 1, placeId: 1, metaName: 1 });
        existing.forEach(c => {
          if (c.metaName) existingMetaNames.add(c.metaName);
          if (c.placeId) existingPlaceIds.add(c.placeId.toLowerCase().trim());
          existingNames.add((c.name || '').toLowerCase().trim());
        });
      }

      const toInsert = data
        .filter((c: any) => {
          const slug = toSlug(c.name);
          const placeIdLower = (c.placeId || '').toLowerCase().trim();
          const isDupByMeta = existingMetaNames.has(slug);
          const isDupByPlaceId = placeIdLower && existingPlaceIds.has(placeIdLower);
          const isDupByName = existingNames.has((c.name || '').toLowerCase().trim());
          return !isDupByMeta && !isDupByPlaceId && !isDupByName;
        })
        .map((c: any) => ({
          name: c.name,
          metaName: toSlug(c.name),
          website: c.website,
          phone: c.phone,
          address: c.address,
          category: c.category,
          rating: c.rating,
          reviews: c.reviews,
          placeId: c.placeId,
          imageUrl: c.imageUrl,
          status: c.status || 'Not Contacted',
          priority: c.priority || 'Medium',
          lastContactDate: c.lastContact && c.lastContact !== '-' ? new Date(c.lastContact) : null,
        }));

      if (toInsert.length === 0) {
        return res.json({ inserted: 0, message: 'All companies were duplicates — nothing inserted.' });
      }

      const result = await Company.insertMany(toInsert);

      // Create activities for the imported companies (limit to first few to prevent DB spam, plus a summary)
      if (result.length > 0) {
        const activitiesToCreate = result.slice(0, 5).map(c => ({
          type: 'Import',
          description: `Imported and added ${c.name} to pipeline`,
          companyId: c._id
        }));

        if (result.length > 5) {
          activitiesToCreate.push({
            type: 'Import',
            description: `Imported a batch of ${result.length} companies`,
            companyId: result[0]._id
          });
        }

        await Activity.insertMany(activitiesToCreate);
      }

      res.json({ inserted: result.length, data: result });
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

      const oldCompany = await Company.findById(id);
      const result = await Company.findByIdAndUpdate(id, updateData, { new: true });

      if (oldCompany && result) {
        const activitiesToCreate = [];
        if (updateData.status && oldCompany.status !== updateData.status) {
          activitiesToCreate.push({
            type: 'Status Change',
            description: `Status updated from "${oldCompany.status}" to "${updateData.status}"`,
            companyId: id
          });
        }
        if (updateData.priority && oldCompany.priority !== updateData.priority) {
          activitiesToCreate.push({
            type: 'Priority Change',
            description: `Priority updated from "${oldCompany.priority}" to "${updateData.priority}"`,
            companyId: id
          });
        }
        if (activitiesToCreate.length > 0) {
          await Activity.insertMany(activitiesToCreate);
        }
      }

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

      // Create an activity log for note addition
      await Activity.create({
        type: 'Note Added',
        description: `Added note: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
        companyId: id
      });

      res.json(note);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  });

  // --- ASSETS ---
  app.get('/api/assets', async (req, res) => {
    try {
      const assets = await Asset.find().sort({ createdAt: -1 });
      res.json(assets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  });

  app.post('/api/assets', upload.single('file'), async (req, res) => {
    try {
      console.log('req.body:', req.body, 'req.file:', req.file);
      const assetData = { ...req.body };
      if (req.file) {
        assetData.url = `/uploads/${req.file.filename}`;
      }
      const asset = await Asset.create(assetData);
      res.json(asset);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create asset' });
    }
  });

  app.delete('/api/assets/:id', async (req, res) => {
    try {
      await Asset.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete asset' });
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

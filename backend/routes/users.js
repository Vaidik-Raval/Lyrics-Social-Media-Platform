const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Composition = require('../models/Composition');
const Song = require('../models/Song');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -googleId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's public compositions count and total likes
    const stats = await Composition.aggregate([
      { $match: { composer: user._id, isPublic: true } },
      {
        $group: {
          _id: null,
          totalCompositions: { $sum: 1 },
          totalLikes: { $sum: '$likes' },
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalCompositions: 0,
      totalLikes: 0,
      totalViews: 0
    };

    // Get user's favorite instruments from compositions
    const instrumentStats = await Composition.aggregate([
      { $match: { composer: user._id, isPublic: true } },
      { $group: { _id: '$instrument', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      user: user.toObject(),
      stats: userStats,
      topInstruments: instrumentStats.map(item => ({
        instrument: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

// @route   GET /api/users/:id/compositions
// @desc    Get user's compositions
// @access  Public
router.get('/:id/compositions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('instrument').optional().trim(),
  query('type').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { 
      composer: req.params.id,
      isPublic: true 
    };
    
    if (req.query.instrument) filter.instrument = req.query.instrument;
    if (req.query.type) filter.type = req.query.type;

    const compositions = await Composition.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('song', 'title artist genre')
      .lean();

    const total = await Composition.countDocuments(filter);

    res.json({
      compositions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCompositions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    console.error('Get user compositions error:', error);
    res.status(500).json({ message: 'Server error while fetching user compositions' });
  }
});

// @route   GET /api/users/:id/songs
// @desc    Get songs added by user
// @access  Public
router.get('/:id/songs', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const songs = await Song.find({ addedBy: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Song.countDocuments({ addedBy: req.params.id });

    res.json({
      songs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSongs: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    console.error('Get user songs error:', error);
    res.status(500).json({ message: 'Server error while fetching user songs' });
  }
});

// @route   GET /api/users
// @desc    Get users list (for discovery)
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().trim(),
  query('instrument').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { username: new RegExp(req.query.search, 'i') },
        { bio: new RegExp(req.query.search, 'i') }
      ];
    }
    
    if (req.query.instrument) {
      filter.favoriteInstruments = req.query.instrument;
    }

    const users = await User.find(filter)
      .select('username avatar bio favoriteInstruments joinDate compositionsCount totalLikes')
      .sort({ totalLikes: -1, compositionsCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/me/dashboard
// @desc    Get current user's dashboard data
// @access  Private
router.get('/me/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's compositions stats
    const compositionStats = await Composition.aggregate([
      { $match: { composer: userId } },
      {
        $group: {
          _id: null,
          totalCompositions: { $sum: 1 },
          totalLikes: { $sum: '$likes' },
          totalViews: { $sum: '$views' },
          publicCompositions: {
            $sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get user's recent compositions
    const recentCompositions = await Composition.find({ composer: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('song', 'title artist')
      .lean();

    // Get user's songs stats
    const songStats = await Song.aggregate([
      { $match: { addedBy: userId } },
      {
        $group: {
          _id: null,
          totalSongs: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    // Get user's recent songs
    const recentSongs = await Song.find({ addedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get composition activity by instrument
    const instrumentActivity = await Composition.aggregate([
      { $match: { composer: userId } },
      { $group: { _id: '$instrument', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stats = compositionStats[0] || {
      totalCompositions: 0,
      totalLikes: 0,
      totalViews: 0,
      publicCompositions: 0
    };

    const songData = songStats[0] || {
      totalSongs: 0,
      totalViews: 0
    };

    res.json({
      compositionStats: stats,
      songStats: songData,
      recentCompositions,
      recentSongs,
      instrumentActivity: instrumentActivity.map(item => ({
        instrument: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

module.exports = router;

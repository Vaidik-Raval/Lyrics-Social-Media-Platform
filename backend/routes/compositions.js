const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Composition = require('../models/Composition');
const Song = require('../models/Song');
const LikeDislike = require('../models/LikeDislike');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/compositions
// @desc    Get compositions with filtering
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('song').optional().isMongoId().withMessage('Invalid song ID'),
  query('composer').optional().isMongoId().withMessage('Invalid composer ID'),
  query('instrument').optional().trim(),
  query('difficulty').optional().trim(),
  query('type').optional().trim(),
  query('sortBy').optional().isIn(['createdAt', 'likes', 'rating', 'views']).withMessage('Invalid sort field')
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

    // Build filter object
    const filter = { isPublic: true };
    
    if (req.query.song) filter.song = req.query.song;
    if (req.query.composer) filter.composer = req.query.composer;
    if (req.query.instrument) filter.instrument = req.query.instrument;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.type) filter.type = req.query.type;

    // Sort
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const compositions = await Composition.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('composer', 'username avatar')
      .populate('song', 'title artist')
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
    console.error('Get compositions error:', error);
    res.status(500).json({ message: 'Server error while fetching compositions' });
  }
});

// @route   GET /api/compositions/featured
// @desc    Get featured compositions
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const compositions = await Composition.find({ 
      isPublic: true,
      isFeatured: true 
    })
      .sort({ rating: -1, likes: -1 })
      .limit(limit)
      .populate('composer', 'username avatar')
      .populate('song', 'title artist')
      .lean();

    res.json({ compositions });
  } catch (error) {
    console.error('Get featured compositions error:', error);
    res.status(500).json({ message: 'Server error while fetching featured compositions' });
  }
});

// @route   GET /api/compositions/:id
// @desc    Get single composition
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const composition = await Composition.findById(req.params.id)
      .populate('composer', 'username avatar joinDate bio')
      .populate('song', 'title artist genre');

    if (!composition) {
      return res.status(404).json({ message: 'Composition not found' });
    }

    if (!composition.isPublic) {
      if (!req.user || req.user._id.toString() !== composition.composer._id.toString()) {
        return res.status(403).json({ message: 'This composition is private' });
      }
    }

    // Increment views
    composition.views += 1;
    await composition.save();

    // Check if current user has liked/disliked this composition
    let userVote = null;
    if (req.user) {
      const vote = await LikeDislike.findOne({
        user: req.user._id,
        composition: composition._id
      });
      userVote = vote ? vote.type : null;
    }

    res.json({
      composition: composition.toObject(),
      userVote
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid composition ID' });
    }
    console.error('Get composition error:', error);
    res.status(500).json({ message: 'Server error while fetching composition' });
  }
});

// @route   POST /api/compositions
// @desc    Create a new composition
// @access  Private
router.post('/', [
  authMiddleware,
  body('song').isMongoId().withMessage('Valid song ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('type').notEmpty().withMessage('Type is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('instrument').notEmpty().withMessage('Instrument is required'),
  body('difficulty').notEmpty().withMessage('Difficulty is required'),
  body('style').optional().trim(),
  body('tuning').optional().trim(),
  body('capo').optional().isInt({ min: 0, max: 12 }).withMessage('Capo must be between 0 and 12'),
  body('tempo').optional().isInt({ min: 40, max: 200 }).withMessage('Tempo must be between 40 and 200 BPM'),
  body('key').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Verify song exists
    const song = await Song.findById(req.body.song);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const composition = new Composition({
      ...req.body,
      composer: req.user._id
    });

    await composition.save();

    const populatedComposition = await Composition.findById(composition._id)
      .populate('composer', 'username avatar')
      .populate('song', 'title artist');

    res.status(201).json({
      message: 'Composition created successfully',
      composition: populatedComposition
    });
  } catch (error) {
    console.error('Create composition error:', error);
    res.status(500).json({ message: 'Server error while creating composition' });
  }
});

// @route   PUT /api/compositions/:id
// @desc    Update composition (only by creator)
// @access  Private
router.put('/:id', [
  authMiddleware,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('capo').optional().isInt({ min: 0, max: 12 }).withMessage('Capo must be between 0 and 12'),
  body('tempo').optional().isInt({ min: 40, max: 200 }).withMessage('Tempo must be between 40 and 200 BPM')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const composition = await Composition.findById(req.params.id);
    
    if (!composition) {
      return res.status(404).json({ message: 'Composition not found' });
    }

    // Check if user is the creator
    if (composition.composer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this composition' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'content', 'difficulty', 'style', 
      'tuning', 'capo', 'tempo', 'key', 'tags', 'isPublic', 'attachments'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        composition[field] = req.body[field];
      }
    });

    await composition.save();

    const updatedComposition = await Composition.findById(composition._id)
      .populate('composer', 'username avatar')
      .populate('song', 'title artist');

    res.json({
      message: 'Composition updated successfully',
      composition: updatedComposition
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid composition ID' });
    }
    console.error('Update composition error:', error);
    res.status(500).json({ message: 'Server error while updating composition' });
  }
});

// @route   DELETE /api/compositions/:id
// @desc    Delete composition (only by creator)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const composition = await Composition.findById(req.params.id);
    
    if (!composition) {
      return res.status(404).json({ message: 'Composition not found' });
    }

    // Check if user is the creator
    if (composition.composer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this composition' });
    }

    // Delete all likes/dislikes for this composition
    await LikeDislike.deleteMany({ composition: composition._id });

    // Delete the composition
    await Composition.findByIdAndDelete(req.params.id);

    res.json({ message: 'Composition deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid composition ID' });
    }
    console.error('Delete composition error:', error);
    res.status(500).json({ message: 'Server error while deleting composition' });
  }
});

// @route   POST /api/compositions/:id/vote
// @desc    Like or dislike a composition
// @access  Private
router.post('/:id/vote', [
  authMiddleware,
  body('type').isIn(['like', 'dislike']).withMessage('Vote type must be either like or dislike')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const composition = await Composition.findById(req.params.id);
    
    if (!composition) {
      return res.status(404).json({ message: 'Composition not found' });
    }

    // Check if user already voted
    const existingVote = await LikeDislike.findOne({
      user: req.user._id,
      composition: composition._id
    });

    if (existingVote) {
      if (existingVote.type === req.body.type) {
        // Remove vote if same type
        await LikeDislike.findByIdAndDelete(existingVote._id);
        res.json({ message: 'Vote removed', action: 'removed' });
      } else {
        // Update vote if different type
        existingVote.type = req.body.type;
        await existingVote.save();
        res.json({ message: 'Vote updated', action: 'updated', type: req.body.type });
      }
    } else {
      // Create new vote
      const newVote = new LikeDislike({
        user: req.user._id,
        composition: composition._id,
        type: req.body.type
      });
      await newVote.save();
      res.json({ message: 'Vote added', action: 'added', type: req.body.type });
    }
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid composition ID' });
    }
    console.error('Vote composition error:', error);
    res.status(500).json({ message: 'Server error while voting on composition' });
  }
});

// @route   GET /api/compositions/:id/votes
// @desc    Get vote statistics for a composition
// @access  Public
router.get('/:id/votes', optionalAuth, async (req, res) => {
  try {
    const composition = await Composition.findById(req.params.id);
    
    if (!composition) {
      return res.status(404).json({ message: 'Composition not found' });
    }

    const voteStats = await LikeDislike.aggregate([
      { $match: { composition: composition._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const likes = voteStats.find(stat => stat._id === 'like')?.count || 0;
    const dislikes = voteStats.find(stat => stat._id === 'dislike')?.count || 0;

    // Check current user's vote if authenticated
    let userVote = null;
    if (req.user) {
      const vote = await LikeDislike.findOne({
        user: req.user._id,
        composition: composition._id
      });
      userVote = vote ? vote.type : null;
    }

    res.json({
      compositionId: composition._id,
      likes,
      dislikes,
      total: likes + dislikes,
      rating: composition.rating,
      userVote
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid composition ID' });
    }
    console.error('Get composition votes error:', error);
    res.status(500).json({ message: 'Server error while fetching vote statistics' });
  }
});

// @route   GET /api/compositions/user/:userId
// @desc    Get compositions by user
// @access  Public
router.get('/user/:userId', [
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

    const compositions = await Composition.find({ 
      composer: req.params.userId,
      isPublic: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('song', 'title artist')
      .lean();

    const total = await Composition.countDocuments({ 
      composer: req.params.userId,
      isPublic: true 
    });

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

module.exports = router;

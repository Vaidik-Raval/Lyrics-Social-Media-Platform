const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Song = require('../models/Song');
const Composition = require('../models/Composition');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/songs
// @desc    Get all songs with filtering and search
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().trim(),
  query('genre').optional().trim(),
  query('instrument').optional().trim(),
  query('language').optional().trim(),
  query('sortBy').optional().isIn(['createdAt', 'title', 'artist', 'views', 'compositionsCount']).withMessage('Invalid sort field')
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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.genre) {
      filter.genre = req.query.genre;
    }
    
    if (req.query.instrument) {
      filter.instruments = req.query.instrument;
    }
    
    if (req.query.language) {
      filter.language = req.query.language;
    }

    // Build search query
    let query = Song.find(filter);
    
    if (req.query.search) {
      query = query.find({
        $text: { $search: req.query.search }
      });
    }

    // Sort
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    query = query.sort({ [sortBy]: sortOrder });

    // Execute query with pagination
    const songs = await query
      .skip(skip)
      .limit(limit)
      .populate('addedBy', 'username avatar')
      .lean();

    const total = await Song.countDocuments(filter);

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
    console.error('Get songs error:', error);
    res.status(500).json({ message: 'Server error while fetching songs' });
  }
});

// @route   GET /api/songs/trending
// @desc    Get trending songs
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const songs = await Song.find()
      .sort({ views: -1, compositionsCount: -1, createdAt: -1 })
      .limit(limit)
      .populate('addedBy', 'username avatar')
      .lean();

    res.json({ songs });
  } catch (error) {
    console.error('Get trending songs error:', error);
    res.status(500).json({ message: 'Server error while fetching trending songs' });
  }
});

// @route   GET /api/songs/:id
// @desc    Get single song with compositions
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('addedBy', 'username avatar joinDate');

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Increment views
    song.views += 1;
    await song.save();

    // Get compositions for this song
    const compositions = await Composition.find({ song: song._id })
      .populate('composer', 'username avatar')
      .sort({ likes: -1, createdAt: -1 })
      .lean();

    res.json({
      song: song.toObject(),
      compositions
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid song ID' });
    }
    console.error('Get song error:', error);
    res.status(500).json({ message: 'Server error while fetching song' });
  }
});

// @route   POST /api/songs
// @desc    Add a new song
// @access  Private
router.post('/', [
  authMiddleware,
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('artist').trim().notEmpty().withMessage('Artist is required').isLength({ max: 100 }).withMessage('Artist name must be less than 100 characters'),
  body('album').optional().trim().isLength({ max: 100 }).withMessage('Album name must be less than 100 characters'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('language').optional().trim(),
  body('instruments').isArray().withMessage('Instruments must be an array'),
  body('officialLyrics').trim().notEmpty().withMessage('Official lyrics are required'),
  body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  body('releaseYear').optional().isInt({ min: 1900 }).withMessage('Release year must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Check if song already exists
    const existingSong = await Song.findOne({
      title: new RegExp(`^${req.body.title}$`, 'i'),
      artist: new RegExp(`^${req.body.artist}$`, 'i')
    });

    if (existingSong) {
      return res.status(400).json({ message: 'Song already exists' });
    }

    const song = new Song({
      ...req.body,
      addedBy: req.user._id
    });

    await song.save();

    const populatedSong = await Song.findById(song._id)
      .populate('addedBy', 'username avatar');

    res.status(201).json({
      message: 'Song added successfully',
      song: populatedSong
    });
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ message: 'Server error while adding song' });
  }
});

// @route   PUT /api/songs/:id
// @desc    Update song (only by creator or admin)
// @access  Private
router.put('/:id', [
  authMiddleware,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('artist').optional().trim().notEmpty().withMessage('Artist cannot be empty'),
  body('genre').optional().notEmpty().withMessage('Genre cannot be empty'),
  body('officialLyrics').optional().trim().notEmpty().withMessage('Official lyrics cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Check if user is the creator
    if (song.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this song' });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'artist', 'album', 'genre', 'language', 'instruments', 'officialLyrics', 'duration', 'releaseYear', 'coverImage', 'tags'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        song[field] = req.body[field];
      }
    });

    await song.save();

    const updatedSong = await Song.findById(song._id)
      .populate('addedBy', 'username avatar');

    res.json({
      message: 'Song updated successfully',
      song: updatedSong
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid song ID' });
    }
    console.error('Update song error:', error);
    res.status(500).json({ message: 'Server error while updating song' });
  }
});

// @route   DELETE /api/songs/:id
// @desc    Delete song (only by creator or admin)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Check if user is the creator
    if (song.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this song' });
    }

    // Delete all compositions for this song
    await Composition.deleteMany({ song: song._id });

    // Delete the song
    await Song.findByIdAndDelete(req.params.id);

    res.json({ message: 'Song and all related compositions deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid song ID' });
    }
    console.error('Delete song error:', error);
    res.status(500).json({ message: 'Server error while deleting song' });
  }
});

// @route   GET /api/songs/:id/stats
// @desc    Get song statistics
// @access  Public
router.get('/:id/stats', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const stats = await Composition.aggregate([
      { $match: { song: song._id } },
      {
        $group: {
          _id: null,
          totalCompositions: { $sum: 1 },
          totalLikes: { $sum: '$likes' },
          totalDislikes: { $sum: '$dislikes' },
          averageRating: { $avg: '$rating' },
          compositionsByInstrument: {
            $push: '$instrument'
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalCompositions: 0,
      totalLikes: 0,
      totalDislikes: 0,
      averageRating: 0,
      compositionsByInstrument: []
    };

    // Count compositions by instrument
    const instrumentCounts = result.compositionsByInstrument.reduce((acc, instrument) => {
      acc[instrument] = (acc[instrument] || 0) + 1;
      return acc;
    }, {});

    res.json({
      songId: song._id,
      title: song.title,
      artist: song.artist,
      views: song.views,
      totalCompositions: result.totalCompositions,
      totalLikes: result.totalLikes,
      totalDislikes: result.totalDislikes,
      averageRating: Math.round(result.averageRating * 10) / 10,
      instrumentDistribution: instrumentCounts
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid song ID' });
    }
    console.error('Get song stats error:', error);
    res.status(500).json({ message: 'Server error while fetching song statistics' });
  }
});

module.exports = router;

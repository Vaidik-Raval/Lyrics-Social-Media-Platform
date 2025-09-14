const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  artist: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  album: {
    type: String,
    trim: true,
    maxlength: 100
  },
  genre: {
    type: String,
    required: true,
    enum: ['pop', 'rock', 'jazz', 'classical', 'country', 'hip-hop', 'electronic', 'folk', 'blues', 'r&b', 'indie', 'alternative', 'other']
  },
  language: {
    type: String,
    required: true,
    default: 'english'
  },
  instruments: [{
    type: String,
    enum: ['guitar', 'piano', 'violin', 'drums', 'bass', 'flute', 'trumpet', 'saxophone', 'vocals', 'other']
  }],
  officialLyrics: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    min: 0
  },
  releaseYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  spotifyId: {
    type: String,
    sparse: true
  },
  youtubeId: {
    type: String,
    sparse: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  compositionsCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better search performance
songSchema.index({ title: 'text', artist: 'text', tags: 'text' });
songSchema.index({ genre: 1 });
songSchema.index({ instruments: 1 });
songSchema.index({ language: 1 });
songSchema.index({ createdAt: -1 });

// Update compositions count
songSchema.methods.updateCompositionsCount = async function() {
  const Composition = mongoose.model('Composition');
  this.compositionsCount = await Composition.countDocuments({ song: this._id });
  return this.save();
};

module.exports = mongoose.model('Song', songSchema);

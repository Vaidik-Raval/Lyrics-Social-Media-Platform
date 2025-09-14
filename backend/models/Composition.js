const mongoose = require('mongoose');

const compositionSchema = new mongoose.Schema({
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  composer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['lyrics', 'chords', 'tabs', 'sheet-music', 'arrangement', 'cover']
  },
  content: {
    type: String,
    required: true
  },
  instrument: {
    type: String,
    required: true,
    enum: ['guitar', 'piano', 'violin', 'drums', 'bass', 'flute', 'trumpet', 'saxophone', 'vocals', 'other']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  style: {
    type: String,
    enum: ['acoustic', 'electric', 'classical', 'jazz', 'fingerstyle', 'strumming', 'picking', 'other'],
    default: 'other'
  },
  tuning: {
    type: String,
    default: '' // For guitar compositions
  },
  capo: {
    type: Number,
    min: 0,
    max: 12,
    default: 0
  },
  tempo: {
    type: Number,
    min: 40,
    max: 200
  },
  key: {
    type: String,
    enum: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm']
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String // URLs to audio/video files
  }]
}, {
  timestamps: true
});

// Indexes for better performance
compositionSchema.index({ song: 1, createdAt: -1 });
compositionSchema.index({ composer: 1, createdAt: -1 });
compositionSchema.index({ instrument: 1 });
compositionSchema.index({ difficulty: 1 });
compositionSchema.index({ likes: -1 });
compositionSchema.index({ rating: -1 });

// Calculate rating based on likes and dislikes
compositionSchema.methods.calculateRating = function() {
  const total = this.likes + this.dislikes;
  if (total === 0) return 0;
  
  const ratio = this.likes / total;
  this.rating = Math.round(ratio * 5 * 10) / 10; // Round to 1 decimal place
  return this.rating;
};

// Update user's compositions count when a composition is saved
compositionSchema.post('save', async function() {
  const User = mongoose.model('User');
  const user = await User.findById(this.composer);
  if (user) {
    user.compositionsCount = await mongoose.model('Composition').countDocuments({ composer: this.composer });
    await user.save();
  }
  
  // Update song's compositions count
  const Song = mongoose.model('Song');
  const song = await Song.findById(this.song);
  if (song) {
    await song.updateCompositionsCount();
  }
});

module.exports = mongoose.model('Composition', compositionSchema);

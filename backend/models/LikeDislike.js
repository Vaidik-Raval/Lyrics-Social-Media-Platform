const mongoose = require('mongoose');

const likeDislikeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  composition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Composition',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['like', 'dislike']
  }
}, {
  timestamps: true
});

// Ensure a user can only have one vote per composition
likeDislikeSchema.index({ user: 1, composition: 1 }, { unique: true });

// Update composition likes/dislikes count when a vote is added/updated
likeDislikeSchema.post('save', async function() {
  await updateCompositionCounts(this.composition);
});

likeDislikeSchema.post('remove', async function() {
  await updateCompositionCounts(this.composition);
});

likeDislikeSchema.post('deleteOne', { document: false, query: true }, async function() {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await updateCompositionCounts(doc.composition);
  }
});

async function updateCompositionCounts(compositionId) {
  const Composition = mongoose.model('Composition');
  const LikeDislike = mongoose.model('LikeDislike');
  
  const likes = await LikeDislike.countDocuments({ 
    composition: compositionId, 
    type: 'like' 
  });
  
  const dislikes = await LikeDislike.countDocuments({ 
    composition: compositionId, 
    type: 'dislike' 
  });
  
  const composition = await Composition.findById(compositionId);
  if (composition) {
    composition.likes = likes;
    composition.dislikes = dislikes;
    composition.calculateRating();
    await composition.save();
  }
}

module.exports = mongoose.model('LikeDislike', likeDislikeSchema);

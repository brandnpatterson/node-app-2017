const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  approved: {
    type: Boolean,
    default: false
  }
});

// Define query indexes with MongoDB
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name);
  // find stores that have a slug of name, name-1, name-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

  // this.constructor === 'Store' by the time it actually runs
  const storesWithSlug = await this.constructor.find({
    slug: slugRegEx
  });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    {
      $unwind: '$tags'
    },
    {
      $group: {
        _id: '$tags',
        count: {
          $sum: 1
        }
      }
    },
    {
      $sort: {
        count: -1
      }
    }
  ]);
}

module.exports = mongoose.model('Store', storeSchema, 'stores');

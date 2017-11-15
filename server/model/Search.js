const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    term: { type: String, required: true },
    when: { type: Date, required: true }
  },
  {
    toObject: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
      }
    },
  }
);

const Search = mongoose.model('Search', schema);

module.exports = Search;
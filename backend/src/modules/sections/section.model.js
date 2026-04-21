const mongoose = require('mongoose');

// A Section is one division of a department's intake for a given year.
// E.g. CSE 3rd year has 4 sections: Genius, Brilliant, Smart, Elite
const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },        // "A", "Genius", "Brilliant"
    dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true, min: 1, max: 8 }, // actual semester number (1–8)
    year: { type: Number, required: true, min: 1, max: 4 },     // academic year 1–4
    strength: { type: Number, default: 60 },                   // student count
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // override dept subjects if needed
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

sectionSchema.index({ dept_id: 1, semester: 1 });
sectionSchema.index({ dept_id: 1, year: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);

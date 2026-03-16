const mongoose = require('mongoose');

// Un "set" = une série avec poids + reps
const setSchema = new mongoose.Schema({
    weight: { type: Number, default: 0 },  // kg
    reps:   { type: Number, default: 10 },
    done:   { type: Boolean, default: false }
}, { _id: true });

const exerciseSchema = new mongoose.Schema({
    name:     { type: String, required: true },   // ex: "Développé couché"
    category: { type: String, default: 'autre' }, // ex: "poitrine"
    sets:     { type: [setSchema], default: () => [{ weight: 0, reps: 10, done: false }] },
    owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Exercise', exerciseSchema);

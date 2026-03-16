const mongoose = require('mongoose');
// ajout de bcrypt pour le hash des mots de passe important pour la sécurité des utilisateurs
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar:   { type: String, default: '' },

    profile: {
        age:            { type: Number },
        weight:         { type: Number },
        height:         { type: Number },
        gender:         { type: String, enum: ['homme', 'femme', 'autre'] },
        level:          { type: String, enum: ['debutant', 'intermediaire', 'avance'], default: 'debutant' },
        goal:           { type: String, enum: ['prise_de_masse', 'perte_de_poids', 'endurance', 'force', 'remise_en_forme'], default: 'remise_en_forme' },
        sessionsPerWeek:{ type: Number, default: 3 },
        injuries:       { type: String, default: '' }
    },

    stats: {
        totalSessions:  { type: Number, default: 0 },
        totalExercises: { type: Number, default: 0 },
        streak:         { type: Number, default: 0 },
        lastSession:    { type: Date }
    },

    // Chaque entrée = un set terminé avec poids + reps + nom exo
    performance: [{
        date:   { type: Date, default: Date.now },
        name:   String,
        weight: Number,
        reps:   Number
    }],

    // Historique du poids (pour suivre l'évolution)
    weightHistory: [{
        date:   { type: Date, default: Date.now },
        weight: Number
    }],

    createdAt: { type: Date, default: Date.now }
});

// middleware pour hasher le mot de passe avant la sauvegarde
userSchema.pre('save', async function(next) {
    // Si le mot de passe n'a pas été modifié, on continue
    if (!this.isModified('password')) return next();
    // Hash le mot de passe avec un salt de 12 rounds
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// méthode pour comparer le mot de passe saisi avec celui en base de données
userSchema.methods.comparePassword = async function(pwd) {
    return bcrypt.compare(pwd, this.password);
};

module.exports = mongoose.model('User', userSchema);

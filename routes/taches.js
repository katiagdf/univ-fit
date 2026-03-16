const express = require('express');
const router  = express.Router();
const Tache   = require('../models/Exercise');
const User    = require('../models/User');

router.use((req, res, next) => {
    if (!req.session || !req.session.userId)
        return res.status(401).json({ message: 'Authentification requise' });
    next();
});

// GET : tous les exercices + historique de performance
router.get('/', async (req, res) => {
    try {
        const taches = await Tache.find({ owner: req.session.userId });
        const user   = await User.findById(req.session.userId).select('performance');
        res.json({ taches, performance: user?.performance || [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST : ajouter un exercice (avec ses sets initiaux)
router.post('/', async (req, res) => {
    try {
        const tache = new Tache({ ...req.body, owner: req.session.userId });
        const saved = await tache.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT : mettre à jour un exercice (sets, poids, reps, done)
router.put('/:id', async (req, res) => {
    try {
        const tache = await Tache.findById(req.params.id);
        if (!tache) return res.status(404).json({ message: 'Introuvable' });
        if (String(tache.owner) !== String(req.session.userId))
            return res.status(403).json({ message: 'Interdit' });

        Object.assign(tache, req.body);
        const updated = await tache.save();

        // Enregistrer les sets terminés dans l'historique de performance
        const doneSets = (updated.sets || []).filter(s => s.done);
        if (doneSets.length > 0) {
            const user = await User.findById(req.session.userId);
            if (user) {
                const today = new Date();
                user.performance = user.performance || [];
                doneSets.forEach(s => {
                    user.performance.push({
                        date:   today,
                        name:   updated.name,
                        weight: s.weight || 0,
                        reps:   s.reps   || 0
                    });
                });
                // Stats
                const todayStr = today.toDateString();
                if (!user.stats.lastSession || new Date(user.stats.lastSession).toDateString() !== todayStr) {
                    user.stats.totalSessions++;
                    user.stats.lastSession = today;
                    const prev = user.stats.lastSession ? new Date(user.stats.lastSession) : null;
                    const diff = prev ? Math.floor((today - prev) / 86400000) : 999;
                    user.stats.streak = diff <= 1 ? user.stats.streak + 1 : 1;
                }
                user.stats.totalExercises += doneSets.length;
                await user.save();
            }
        }
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const tache = await Tache.findById(req.params.id);
        if (!tache) return res.status(404).json({ message: 'Introuvable' });
        if (String(tache.owner) !== String(req.session.userId))
            return res.status(403).json({ message: 'Interdit' });
        await Tache.findByIdAndDelete(req.params.id);
        res.json({ message: 'Supprimé' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

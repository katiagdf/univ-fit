const Message = require('./models/chat');
const dns = require('dns');
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Résout les problèmes réseau 
// Chargement des variables d'environnement depuis un fichier .env que vous devez créer dans le dossier de votre projet et y placer le lien (appelé MONGO_URI ici) vers votre base de donnée
require('dotenv').config();

// Importation des modules nécessaires
const express = require('express');       // Framework pour créer le serveur
const mongoose = require('mongoose');    // Librairie pour interagir avec la base de donnée MongoDB
const path = require('path');            // Module pour manipuler les chemins des fichiers
const session = require('express-session');       // Gestion des sessions utilisateur
const MongoStore = require('connect-mongo');      // Stockage des sessions dans MongoDB
const User = require('./models/User');            // Modèle utilisateur

// IMPORTANT: Définir PORT AVANT tout le reste du code pour éviter les problèmes de connexion internet et les erreurs de serveur
const PORT = process.env.PORT || 3000;

// Création de l'application Express
const app = express();

// Création du serveur HTTP et configuration de Socket.IO
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware pour analyser les données des requêtes POST
app.use(express.urlencoded({ extended: true })); // Analyse les données des formulaires
app.use(express.json()); // Analyse les données JSON

// Middleware pour servir des fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du moteur de rendu pour générer des pages HTML dynamiques
app.set('view engine', 'ejs'); // Utilisation de EJS comme moteur de rendu

// Vérifier que MONGO_URI est défini
if (!process.env.MONGO_URI) {
    console.error(' ERREUR: MONGO_URI n\'est pas défini dans .env');
    console.error('   Vérifiez que le fichier .env existe et contient MONGO_URI=...');
    process.exit(1);
}

console.log(' Tentative de connexion à MongoDB...');

// Connexion à la base de données MongoDB Atlas
// Démarrer le serveur SEULEMENT après connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    w: 'majority'
})
    .then(() => {
        console.log(' MongoDB Atlas connecté avec succès');

        // CONFIGURATION SOCKET.IO - SEULEMENT APRÈS CONNEXION MONGODB
        io.on('connection', (socket) => {
            console.log('🟢 Utilisateur connecté:', socket.id);

            // Charge l'historique des 50 derniers messages
            Message.find().sort({ createdAt: 1 }).limit(50)
                .then(messages => socket.emit('load messages', messages))
                .catch(err => console.error(' Erreur Message.find():', err.message));

            socket.on('chat message', async (msg) => {
                try {
                    await new Message({ user: msg.user, text: msg.text }).save();
                    io.emit('chat message', { user: msg.user, text: msg.text, id: socket.id });
                } catch (err) { console.error(' Erreur message save:', err.message); }
            });

            socket.on('disconnect', () => console.log('🔴 Utilisateur déconnecté:', socket.id));
        });

        // DÉMARRER LE SERVEUR
        http.listen(PORT, () => {
            console.log(`Serveur Univ-FIT démarré sur http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('\n Erreur de connexion MongoDB:');
        console.error('   Code:', err.code);
        console.error('   Message:', err.message);
        process.exit(1);
    });

// Configuration des sessions (stockées dans MongoDB)
app.use(session({
    secret: process.env.SESSION_SECRET || 'univfit_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 jours
}));

// Middleware de protection des routes : redirige vers /auth si non connecté
const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/auth');
    next();
};

// ========================
// ROUTES AUTH
// ========================

// Page connexion / inscription
app.get('/auth', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('auth', { error: null });
});

// Inscription
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password, age, weight, height, gender, level, goal, sessionsPerWeek, injuries } = req.body;

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.render('auth', { error: 'Email ou pseudo déjà utilisé.' });

        const user = new User({
            username, email, password,
            profile: { age: +age, weight: +weight, height: +height, gender, level, goal, sessionsPerWeek: +sessionsPerWeek, injuries: injuries || '' }
        });
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('auth', { error: "Erreur lors de l'inscription." });
    }
});

// Connexion
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.render('auth', { error: 'Email ou mot de passe incorrect.' });
        }
        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/');
    } catch (err) {
        res.render('auth', { error: 'Erreur lors de la connexion.' });
    }
});

// Déconnexion
app.get('/auth/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth'));
});

// ========================
// ROUTES EXISTANTES (inchangées)
// ========================

// Les routes liées aux tâches sont définies dans le fichier ./routes/taches
app.use('/taches', require('./routes/taches'));

// Définition de la route de la page d'accueil
// Protégée par requireAuth : redirige vers /auth si non connecté
app.get('/', requireAuth, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('index', { user }); // Rendu de la vue 'index.ejs' avec les données user
});

// ========================
// ROUTE PROFIL
// ========================

// Afficher la page profil
app.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/');
        res.render('profile', { user, message: null });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Modifier le profil utilisateur
app.post('/profile', requireAuth, async (req, res) => {
    try {
        const { age, weight, height, gender, level, goal, sessionsPerWeek, injuries } = req.body;
        
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/');

        // Mise à jour du profil
        user.profile.age = age ? parseInt(age) : undefined;
        user.profile.weight = weight ? parseFloat(weight) : undefined;
        user.profile.height = height ? parseInt(height) : undefined;
        user.profile.gender = gender || undefined;
        user.profile.level = level || 'debutant';
        user.profile.goal = goal || 'remise_en_forme';
        user.profile.sessionsPerWeek = sessionsPerWeek ? parseInt(sessionsPerWeek) : 3;
        user.profile.injuries = injuries || '';

        await user.save();
        
        res.render('profile', { user, message: 'Profil mis à jour avec succès! ✅' });
    } catch (err) {
        console.error(err);
        const user = await User.findById(req.session.userId);
        res.render('profile', { user, message: 'Erreur lors de la mise à jour.' });
    }
});

// Mise à jour rapide du poids (API)
app.put('/profile/weight', requireAuth, async (req, res) => {
    try {
        const { weight } = req.body;
        
        if (!weight || weight <= 0) {
            return res.status(400).json({ message: 'Poids invalide' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        user.profile.weight = parseFloat(weight);
        
        // Enregistrer dans l'historique du poids
        if (!user.weightHistory) user.weightHistory = [];
        user.weightHistory.push({ 
            date: new Date(), 
            weight: parseFloat(weight) 
        });
        
        await user.save();
        
        res.json({ message: 'Poids mis à jour', weight: user.profile.weight });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
});

// Serveur démarré dans mongoose.connect().then() au démarrage du fichier

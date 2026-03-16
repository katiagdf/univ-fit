# UNIV-FIT — Application Web de Suivi Sportif

**Rélisateur :** Sawab EMANE, Emma TASS, Katia GOASDUF  

---

## I. Introduction et Contexte du Projet

Au départ on cherchait un sujet qui ne soit pas "une todo-list avec des tâches qui s'appellent task1, task2"… et on est tombées sur l'idée du fitness pratiquant chacun de nous un peu et étant perdu dans notre propre suivi. Donc nos "tâches" sont devenus des exercices de sport : Squat, Bench Press, Tractions --> typique d'une salle de sport

L'utilisateur peut gérer sa séance, suivre sa progression, et même discuter avec les autres membres en temps réel.
C'est une app web complète avec authentification, dashboard personnalisé, graphiques, chat… 

---

## II. Fonctionnalités Implémentées

### 1. Socle de l'application
- **Gestion des tâches (Exercices) :** Affichage, ajout, modification et suppression 
 Un exercice inclut des données spécifiques : nom, nombre de séries, répétitions et charge en kilogrammes.
- **Validation d'état :** Suivi de l'accomplissement d'un exercice (marquage visuel : icône de validation, texte barré, modification des bordures).
- **Communication asynchrone :** Implémentation d'un chat en temps réel via `Socket.IO`, couplé à une persistance de l'historique des messages dans la base de données MongoDB.

### 2. Fonctionnalités Avancées et Innovations
- **Gestion des Accès et Sécurité :** Système d'authentification complet (inscription multi-étapes, connexion, déconnexion) avec hachage des mots de passe (`bcrypt`) et gestion sécurisée des sessions.
- **Profilage Utilisateur :** Collecte de données morphologiques et sportives (âge, poids, taille, genre, niveau, objectif, blessures) pour adapter l'interface.
- **Moteur de Recommandation :** - Calcul automatisé de l'Indice de Masse Corporelle (IMC).
  - Suggestions de programmes d'entraînement générées dynamiquement selon les objectifs de l'utilisateur (prise de masse, perte de poids, force, etc.), son niveau d'expertise et ses potentielles contraintes physiques.
- **Analyse et Data Visualisation :**
  - Suivi des performances historiques (analyse jour en jour des évolutions).
  - Suivi de la régularité (*streak* de jours consécutifs, volumétrie des séances).
  - Intégration de la bibliothèque `Chart.js` pour la génération de graphiques interactifs (évolution de la charge maximale, volume, et tonnage).
- **Interface Utilisateur (UI/UX) :** Architecture Front-End entièrement *responsive* développée avec `Tailwind CSS`. Utilisation de principes de *glassmorphism*, d'animations fluides et génération dynamique d'avatars via l'API *DiceBear*.

---

## III. Architecture Technique du Projet

L'application repose sur une architecture moderne de type Client/Serveur (modèle MVC simplifié) s'articulant autour des technologies suivantes :

### 1. Stack Technologique
* **Backend :** Node.js, Express.js (Serveur HTTP et API REST).
* **Temps Réel :** Socket.IO (Protocole WebSocket).
* **Base de Données :** MongoDB Atlas (NoSQL) modélisée avec Mongoose.
* **Sécurité & Sessions :** `bcrypt` (hachage), `express-session`, `connect-mongo`.
* **Frontend :** EJS (Moteur de templates serveur), Tailwind CSS (Stylisation), Chart.js (Visualisation).

### 2. Structure de UNiV-fit
```text
univ-fit/
│
├── server.js                  # Point d'entrée : Express + configuration Socket.IO
│
├── models/                    # Modèles de données (Schémas Mongoose)
│   ├── User.js                # Modèle Utilisateur (profil, métriques, historique)
│   ├── Exercise.js            # Modèle Exercice (entité "Tâche")
│   └── chat.js                # Modèle Message (historique du chat)
│
├── routes/                    # Contrôleurs et Routes de l'API REST
│   └── taches.js              # Opérations CRUD relatives aux exercices
│
├── views/                     # Vues dynamiques (Templates EJS)
│   ├── auth.ejs               # Interface d'authentification
│   └── index.ejs              # Tableau de bord principal de l'application
│
├── public/                    # Ressources statiques (images, styles, scripts)
├── .env                       # Fichier de configuration sécurisé (variables d'environnement)
└── package.json               # Manifeste du projet et dépendances

--- Stack technique (outil VS rôle) ---

  • Node.js + Express                 → Serveur HTTP et routage
  • Socket.IO                         → Chat en temps réel (WebSocket)
  • MongoDB Atlas + Mongoose          → Base de données 
  • express-session + connect-mongo   → Gestion des sessions utilisateur
  • EJS                               → Moteur de templates HTML côté serveur
  • Tailwind CSS (CDN)                → Framework CSS utilitaire
  • Chart.js (CDN)                    → Graphiques interactifs
  • bcrypt                            → Hachage des mots de passe

--- Flux de données ---

  Client (navigateur)
      ↕  HTTP (Express routes)     → CRUD exercices, auth
      ↕  WebSocket (Socket.IO)     → Chat temps réel
  Serveur (Node.js)
      ↕  Mongoose
  Base de données (MongoDB Atlas)

  L'appication est découpée en trois parties : le navigateur, le serveur, et la base de données.
  Le navigateur parle au serveur de deux façons : en HTTP pour tout ce qui est exercices et connexion (comme charger une page web normale), et via WebSocket pour le chat , ça permet de recevoir les messages instantanément sans recharger la page.
  Le serveur, lui, parle à MongoDB pour sauvegarder et récupérer les données (exercices, utilisateurs, messages).

```
 
### 3. Points Forts et Aspects Innovants
  • Personnalisation poussée : chaque utilisateur dispose d'un dashboard adapté à son profil (objectif, niveau, blessures), avec des conseils et programmes
    générés dynamiquement côté client.

  • Suivi de progression réel : le système enregistre chaque charge soulevée et détecte automatiquement les augmentations de performance au fil du temps.

  • Chat communautaire : les messages sont sauvegardés en base dedonnées et rechargés à chaque connexion, permettant de retrouver l'historique
    des échanges entre membres.

  • Design professionnel : glassmorphism, animations CSS fluides, palette decouleurs cohérente, responsive sur mobile et desktop.


### 4 INSTALLATION ET LANCEMENT


Prérequis :
  - Node.js v18 ou supérieur installé
  - Un compte MongoDB Atlas avec un cluster actif

--- Étapes d'installation ---

1. Décompresser l'archive et se placer dans le dossier du projet :
     cd univ-fit

2. Installer les dépendances Node.js :
     npm install

3. Créer le fichier .env à la racine du projet avec le contenu suivant :
     MONGO_URI=mongodb+srv://<utilisateur>:<motdepasse>@cluster0.xxxxx.mongodb.net/univfit?retryWrites=true&w=majority
     SESSION_SECRET=un_secret_de_session_long_et_aleatoire

   Remplacer <utilisateur> et <motdepasse> par vos identifiants MongoDB Atlas.

4. Sur MongoDB Atlas, autoriser votre adresse IP :
     → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

5. Lancer le serveur :
     npm start

6. Ouvrir le navigateur à l'adresse :
     http://localhost:3000


### 5 DIFFICULTÉS RENCONTRÉES ET SOLUTIONS APPORTÉES

Difficulté 1 — Portée des événements Socket.IO
  Problème : Les événements socket.on() avaient été placés en dehors du callback io.on('connection', socket => {...}), rendant la variable "socket" indéfinie
  et cassant entièrement le chat.
  Solution : Déplacement de tous les événements (chargement de l'historique, réception des messages) à l'intérieur du bloc de connexion Socket.IO.

Difficulté 2 — IDs HTML dupliqués dans le dashboard
  Problème : Deux blocs distincts (le chat principal et un bloc chatBox résiduel)déclaraient les mêmes id="chatMessages" et id="chatInput", ce qui faisait que
  JavaScript ciblait toujours le mauvais élément.
  Solution : Suppression complète du bloc chatBox, donc conservation d'uneseule structure de chat propre.

Difficulté 3 — Calcul du streak (jours consécutifs)
  Problème : La variable lastSession était écrasée avec la date du jour avant d'être utilisée dans le calcul de la différence, ce qui donnait toujours
  un streak de 1 quel que soit l'historique.
  Solution : Sauvegarde de l'ancienne valeur de lastSession dans une variable locale avant la mise à jour, puis utilisation de cette ancienne valeur
  pour calculer la différence de jours.

Difficulté 4 — Connexion MongoDB depuis un réseau universitaire
  Problème : on n'arrivait pas à se connecter à MongoDB Atlas depuis le wifi de l'iae , et en plus on ne pouvait pas se connecter en même temps.
  Solution : se connecter sur un autre réseau, ajouter le DNS de Google, et mettre l'IP 0.0.0.0/0 sur MongoDB Atlas pour autoriser toutes les adresses.

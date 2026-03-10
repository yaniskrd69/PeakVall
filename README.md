# PeakVal — Déploiement Railway (tout-en-un)

## Structure
```
peakval-railway/
├── server.js          ← Backend Express (API Henrik + sert le frontend)
├── package.json       ← Scripts build + start
├── railway.toml       ← Config Railway
├── .env               ← Clé API (à ajouter dans Railway)
├── .gitignore
└── client/            ← Frontend React (Vite)
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Déploiement en 5 minutes

### Étape 1 — Créer un compte GitHub (si pas déjà fait)
→ github.com → Sign up (gratuit)

### Étape 2 — Upload le projet sur GitHub
1. Va sur github.com → **New repository**
2. Nom : `peakval` → Create
3. Clique **"uploading an existing file"**
4. Glisse-dépose **tout le contenu** de ce dossier (pas le dossier lui-même)
5. Commit changes

### Étape 3 — Déployer sur Railway
1. Va sur **railway.app** → Login with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionne ton repo `peakval`
4. Railway détecte automatiquement le `railway.toml` et lance le build

### Étape 4 — Ajouter la clé API Henrik
Dans Railway → ton projet → **Variables** → Add variable :
```
HENRIK_API_KEY = HDEV-acf0d914-fdb1-4c23-8266-6715300dc693
```

### Étape 5 — Obtenir l'URL publique
Railway → ton projet → **Settings** → **Networking** → **Generate Domain**
→ Tu obtiens une URL comme `peakval-production.up.railway.app`

### Étape 6 — Vérifier
Ouvre `https://ton-url.railway.app/health`
→ Tu dois voir : `{"status":"ok","version":"1.0.0"}`

Ouvre `https://ton-url.railway.app`
→ Le site PeakVal est en ligne ! 🎉

---

## Ce qui se passe au déploiement

Railway exécute automatiquement :
```bash
npm install          # installe Express, axios, cors, dotenv
cd client && npm install && npm run build  # build le React en HTML/CSS/JS statique
node server.js       # démarre le serveur
```

Le serveur Express :
- Sert le frontend React depuis `client/dist/`
- Expose l'API Henrik sur `/api/player/:name/:tag`
- Frontend et backend sur le **même domaine** → pas de CORS, pas de variables d'env complexes

---

## Coût
- Railway : **gratuit** jusqu'à 500h/mois (largement suffisant pour démarrer)
- Upgrade à ~5€/mois si tu dépasses ou veux 100% uptime

---

## Problèmes courants

**Build failed** → Vérifie que tous les fichiers sont bien uploadés sur GitHub, y compris `client/`

**"Joueur introuvable"** → Le TAG est sensible à la casse. Vérifie dans Valorant → Paramètres → Ton compte

**Site blanc** → Va dans Railway → Logs → regarde l'erreur exacte

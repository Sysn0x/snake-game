# Sysnox – Neon Snake

Jeu Snake moderne (neon, responsive) par **Sysnox**. Frontend HTML/CSS/JS (Canvas) + Backend Node/Express avec classement (JSON file).

## Lancer en local

```bash
npm install
npm start
```
Puis ouvre http://localhost:3000

## Structure
```
.
├── public
│   ├── index.html
│   ├── style.css
│   └── app.js
├── data
│   └── scores.json
├── server.js
└── package.json
```

## API
- `GET /api/leaderboard` → Top 50 scores (JSON)
- `POST /api/score` body: `{ name: string, score: number }`

## Déploiement
- **Render/Railway** (recommandé): crée un service Node, build: `npm install`, start: `npm start`.
- **GitHub**: pousse tout le repo. Tu peux brancher Render à ton repo pour déployer automatiquement.
- **GitHub Pages** ne permet pas le backend Node. Si tu veux juste le front, tu peux servir le dossier `public/` sur Pages (sans classement).

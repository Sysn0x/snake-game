        🐍 Neon Snake by Sysnox
```

![Neon Snake Banner](https://media.giphy.com/media/26gsgIsk4gNdj9sFa/giphy.gif)

---

# ✨ Présentation

Un **Snake moderne et responsive**, avec un **style néon futuriste**, développé par **Sysnox**.  

- **Frontend** : HTML / CSS / JS (Canvas)  
- **Backend** : Node.js / Express avec classement (JSON file)  

---

# 🚀 Lancer en local

```bash
npm install
npm start
```

Puis ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

---

# 📂 Structure du projet

```
.
├── public
│   ├── index.html       # Page principale
│   ├── style.css        # Styles néon
│   └── app.js           # Logique du jeu
├── data
│   └── scores.json      # Classement des joueurs
├── server.js            # Serveur Node/Express
└── package.json
```

---

# 🔌 API

| Endpoint                | Méthode | Description |
|-------------------------|---------|-------------|
| `/api/leaderboard`      | GET     | Top 50 scores (JSON) |
| `/api/score`            | POST    | Envoie `{ name: string, score: number }` |

---

# 🌐 Déploiement

### 🚂 Render / Railway
- Crée un service Node  
- `npm install`  
- `npm start`

### 📦 GitHub
- Pousse tout le repo  
- Connecte Render pour un déploiement automatique

### ⚠️ GitHub Pages
- Backend Node impossible  
- Servir **uniquement `public/`** (sans classement)

---

# 🛠 Stack technique

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)  
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)  
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)  
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)  
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)  

---

# 🎨 Style & Inspiration

💖 Couleurs néon vibrantes  
⚡ Effets visuels glow & rétro-futuriste  
🎵 Option musique et effets sonores pour immersion  

---

# 📢 À venir

- Mode **multijoueur**  
- Boosters & obstacles  
- Classement **global en ligne**  
- Mode **dark / light** personnalisable

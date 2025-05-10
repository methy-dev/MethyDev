// Import des modules nécessaires
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import dynamique de node-fetch pour compatibilité
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;
const messagesFile = path.join(__dirname, 'messages.json');

const visitorsFile = path.join(__dirname, 'visitors.json');

// Crée le fichier si nécessaire
if (!fs.existsSync(visitorsFile)) {
  fs.writeFileSync(visitorsFile, JSON.stringify({ count: 0 }, null, 2), 'utf8');
}


// ✅ Middleware de sécurité : en-têtes HTTP sécurisés avec CSP complète
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://formspree.io; script-src 'self' 'unsafe-inline';"
  );
  next();
});

// ✅ Logger des requêtes pour suivi
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// ✅ Middleware pour lire les formulaires et JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (req, res, next) => {
  // Incrémente le compteur de visites
  let visitors = { count: 0 };
  if (fs.existsSync(visitorsFile)) {
    const data = fs.readFileSync(visitorsFile, 'utf8');
    if (data) visitors = JSON.parse(data);
  }

  visitors.count += 1;
  fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2), 'utf8');

  // Continue vers la page d'accueil
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
//Une route pour recuperer
app.get('/visitors', (req, res) => {
  if (fs.existsSync(visitorsFile)) {
    const data = fs.readFileSync(visitorsFile, 'utf8');
    const visitors = JSON.parse(data);
    res.json(visitors);
  } else {
    res.json({ count: 0 });
  }
});

// ✅ Protection admin par Basic Auth
const basicAuth = (req, res, next) => {
  const auth = { login: 'admin', password: '01234' }; // 🔑 Personnalise ici !

  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login === auth.login && password === auth.password) {
    return next();
  }

  console.warn(`⛔ Tentative d'accès refusée depuis IP : ${req.ip}`);
  res.set('WWW-Authenticate', 'Basic realm="Zone admin"');
  res.status(401).send('Authentification requise.');
};
if (!fs.existsSync(visitorsFile)) {
  fs.writeFileSync(visitorsFile, JSON.stringify({ count: 0 }, null, 2), 'utf8');
}

// ✅ Protéger la page admin
app.use('/admin.html', basicAuth);

// ✅ Servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Route pour récupérer les messages JSON
app.get('/messages.json', (req, res) => {
  if (fs.existsSync(messagesFile)) {
    const data = fs.readFileSync(messagesFile, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } else {
    res.status(404).json([]);
  }
});

// ✅ Route pour enregistrer un message après vérification Formspree
app.post('/send', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
  }

  try {
    // Envoyer le message à Formspree
    const formspreeResponse = await fetch('https://formspree.io/f/mldjzqoz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });

    if (!formspreeResponse.ok) {
      console.error('❌ Formspree a échoué à envoyer le message.');
      return res.status(500).json({ success: false, message: 'Échec d\'envoi via Formspree.' });
    }

    // ✅ Si Formspree OK, enregistrer dans messages.json
    let messages = [];
    if (fs.existsSync(messagesFile)) {
      const existingData = fs.readFileSync(messagesFile, 'utf8');
      if (existingData) messages = JSON.parse(existingData);
    }

    messages.push({ name, email, message, date: new Date().toISOString() });
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), 'utf8');

    console.log('💾 Message enregistré après envoi réussi sur Formspree.');
    res.json({ success: true, message: 'Message envoyé et enregistré avec succès !' });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'envoi du message.' });
  }
});

// ✅ Route pour vider les messages (admin protégé)
app.post('/clear-messages', basicAuth, (req, res) => {
  try {
    fs.writeFileSync(messagesFile, JSON.stringify([], null, 2), 'utf8');
    console.log('🧹 Tous les messages ont été supprimés.');
    res.json({ success: true, message: 'Tous les messages ont été supprimés.' });
  } catch (error) {
    console.error('Erreur lors de la suppression des messages :', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression des messages.' });
  }
});

// ✅ Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur sécurisé démarré : http://localhost:${PORT}`);
});

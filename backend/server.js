
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/login", (req, res) => {
	const { username, password } = req.body || {};

	if (username === "admin" && password === "docker") {
		return res.json({
			success: true,
			message: "Bienvenue. Et surtout, ne touche pas au bouton."
		});
	}

	return res.status(401).json({
		success: false,
		message: "Identifiants incorrects."
	});
});

const messages = [
	"Je t'avais pourtant prévenu.",
	"Tu as vraiment du mal avec les consignes.",
	"Bon. Une fois, ça passe.",
	"Tu comptes continuer longtemps ?",
	"Ce bouton n'est PAS un jouet.",
	"Je commence à perdre patience.",
	"Alerte transmise à la NASA.",
	"La NASA demande pourquoi tu continues.",
	"Un satellite vient de changer d'orbite.",
	"Bravo. Tu as réveillé un volcan.",
	"Le volcan est très contrarié.",
	"Ton adresse IP a été communiquée aux pingouins.",
	"Les pingouins préparent leur vengeance.",
	"Un technicien vient de démissionner.",
	"Deux techniciens supplémentaires ont démissionné.",
	"Le serveur commence à transpirer.",
	"Température du processeur : 847 °C.",
	"Une intelligence artificielle demande l'asile politique.",
	"Le ministère des boutons rouges a été prévenu.",
	"Tu fais maintenant l'objet d'une enquête.",
	"Une commission parlementaire est constituée.",
	"Les marchés financiers commencent à paniquer.",
	"La Bourse de Tokyo vient de fermer.",
	"Internet fonctionne désormais au charbon.",
	"Un compte à rebours vient de démarrer.",
	"5...",
	"4...",
	"3...",
	"2...",
	"BOUM ! 💥 Félicitations. Tu as détruit Internet. Actualise la page pour recommencer."
];

app.post("/click", (req, res) => {
	const { count } = req.body || {};

	if (!Number.isInteger(count) || count < 1 || count > 30) {
		return res.status(400).json({
			error: "Le nombre de clics doit être compris entre 1 et 30."
		});
	}

	return res.json({
		count,
		message: messages[count - 1],
		finished: count === 30
	});
});

// require.main === module permet de savoir si le serveur démarre correctement
// module.exports = app permet au fichier test d'importer Express

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`API démarrée sur le port ${PORT}`);
    });
}

// Route Healthtchek
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Backend opérationnel"
    });
});
module.exports = app;
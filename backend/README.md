## 1. Jest
**Jest** est un framework de tests JavaScript.

Utilisation de **jest** pour les tests js
Installation :
```js
npm install --save-dev jest
```
Création d'un fichier `nomDuFichier.test.js`
Lancer les tests:
```bash
npm test
```
## 2. Supertest
**Supertest** permet de tester les routes API Express.

Utilisation de **supertest** pour les tests
Installation :
```js
yarn add --dev supertest
``` 

## 3. Gitleaks
Recherche les secrets exposés dans le code ou l'historique Git.

Intégration de gitleaks au CI avant les tests :
```bash
gitleaks:
    name: Recherche de secrets
    runs-on: ubuntu-latest

    steps:
      - name: Récupérer le dépôt
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Analyser les secrets avec Gitleaks
        uses: gitleaks/gitleaks-action@v3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG: .gitleaks.toml
```

Création d'un rapport :
```bash
GITLEAKS_ENABLE_SUMMARY: "true"
GITLEAKS_ENABLE_UPLOAD_ARTIFACT: "true"
```

Création d'un fichier `.gitleaks.toml` :
```bash
title = "Sécurité du projet Bouton Rouge"

[extend]
useDefault = true
```
## npm audit
Il permets de sécuriser les dépendances et détecte les vulnérabilités connues dans les packages JavaScript utilisés par le backend et le frontend. Comme il est déjà disponible pas besoin d'installation.
Pour lancer l'audit se mettre dans la partie que l'on veut auditer, exemple :
```powershell
cd C:\Users\Utilisateur\Desktop\43\projet-bouton-rouge\backend
```
lancer l'audit :
```powershell
npm audit
```
## Trivy
C'est un outil de sécurité qui permet notamment d'analyser les images Docker.
Il est intégré au CI avant la publication des images pour détecter les failles de sécurité.
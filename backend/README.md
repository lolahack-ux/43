# Guide pratique — Tests, sécurité et CI/CD d'une application Docker

## Objectif

Ce document sert de référence pour intégrer progressivement des outils de tests et de sécurité dans un projet comportant une API Node.js/Express, des conteneurs Docker et une pipeline GitHub Actions.

Il est conçu pour être réutilisé sur d'autres projets.

### Outils abordés

| Outil | Fonction |
|---|---|
| Jest | Tests unitaires et fonctionnels JavaScript |
| Supertest | Tests des routes HTTP d'une API Express |
| Gitleaks | Détection de secrets dans le dépôt Git |
| npm audit | Recherche des vulnérabilités des dépendances npm |
| Trivy | Analyse de sécurité des images Docker |
| Docker Healthcheck | Surveillance de l'état de santé d'un conteneur |
| OWASP ZAP | Tests de sécurité sur une application HTTP en fonctionnement |

---

## 1. Jest — Tester le code JavaScript

### Présentation

**Jest** est un framework permettant d'écrire et d'exécuter des tests JavaScript.

Il sert notamment à vérifier qu'une fonction retourne le résultat attendu et qu'une modification du code ne casse pas un comportement existant.

### Installation

Se placer dans le répertoire de l'application :

```bash
cd backend
npm install --save-dev jest
```

L'option `--save-dev` ajoute Jest aux `devDependencies` du fichier `package.json`, car il est nécessaire pour les tests, mais pas pour exécuter l'application en production.

### Configuration

Dans `package.json`, ajouter ou vérifier :

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

### Écriture d'un test

Créer un fichier avec l'extension `.test.js`, par exemple `calcul.test.js`.

```javascript
function addition(a, b) {
    return a + b;
}

test("additionne deux nombres", () => {
    expect(addition(2, 3)).toBe(5);
});
```

Dans un vrai projet, la fonction testée peut être importée depuis le fichier applicatif.

### Exécution

```bash
npm test
```

Pour exécuter les tests séquentiellement dans une CI :

```bash
npm test -- --runInBand
```

### Points à retenir

- `test()` définit un scénario.
- `expect()` définit le résultat attendu.
- `toBe()` compare des valeurs primitives.
- Une modification qui casse un test doit faire échouer la CI.
- Jest doit rester une dépendance de développement.

---

## 2. Supertest — Tester une API Express

### Présentation

**Supertest** permet de simuler des requêtes HTTP vers une application Node.js/Express.

Il s'utilise généralement avec Jest pour tester les routes et les codes de réponse HTTP.

### Installation

```bash
npm install --save-dev supertest
```

### Préparation de l'application

Pour faciliter les tests, il est préférable d'exporter l'application Express et de ne lancer le serveur que lorsque le fichier est exécuté directement.

Dans `server.js` :

```javascript
const express = require("express");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

if (require.main === module) {
    app.listen(3000, () => {
        console.log("Serveur démarré sur le port 3000");
    });
}

module.exports = app;
```

Cette organisation permet à Supertest d'utiliser l'application sans ouvrir un serveur supplémentaire.

### Exemple de test

Créer `app.test.js` :

```javascript
const request = require("supertest");
const app = require("./server");

describe("GET /health", () => {
    test("retourne HTTP 200", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("ok");
    });
});
```

### Exécution

```bash
npm test
```

### Cas de tests utiles pour une API

- Une requête avec des données valides.
- Une requête avec des identifiants incorrects.
- Une requête dont un champ obligatoire est absent.
- Une requête avec un corps JSON vide.
- Une valeur en dehors des limites autorisées.
- Le code HTTP attendu : `200`, `400`, `401`, etc.

**À retenir :** Jest vérifie les résultats ; Supertest permet d'envoyer des requêtes à l'application HTTP.

---

## 3. Gitleaks — Détecter les secrets exposés

### Présentation

**Gitleaks** recherche des informations sensibles susceptibles d'avoir été enregistrées dans le code ou l'historique Git.

Exemples :

- Clés API.
- Tokens d'authentification.
- Mots de passe.
- Identifiants de services.

Un secret supprimé du dernier commit peut encore être présent dans l'historique Git.

### Configuration

À la racine du dépôt, créer un fichier `.gitleaks.toml` :

```toml
title = "Configuration de sécurité"

[extend]
useDefault = true
```

`useDefault = true` active les règles de détection par défaut.

**Attention :** il ne faut pas ajouter `.gitleaks.toml` au `.gitignore`. Ce fichier doit être versionné afin que la CI l'utilise.

### Intégration dans GitHub Actions

Dans `.github/workflows/ci.yml` :

```yaml
jobs:
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
          GITLEAKS_ENABLE_SUMMARY: "true"
          GITLEAKS_ENABLE_UPLOAD_ARTIFACT: "true"
```

### Explications

- `fetch-depth: 0` récupère tout l'historique Git.
- `GITLEAKS_CONFIG` désigne le fichier de configuration.
- `GITLEAKS_ENABLE_SUMMARY` active le résumé dans GitHub Actions.
- `GITLEAKS_ENABLE_UPLOAD_ARTIFACT` active l'envoi d'un artefact de rapport lorsque des secrets sont détectés.

### Faire dépendre les tests de Gitleaks

```yaml
test:
  needs: gitleaks
  runs-on: ubuntu-latest
```

Les tests ne démarrent que si Gitleaks réussit.

### Bonnes pratiques

- Ne jamais mettre les tokens directement dans le YAML.
- Utiliser les GitHub Actions Secrets.
- Ajouter les fichiers `.env` sensibles au `.gitignore`.
- En cas de fuite, révoquer ou remplacer le secret concerné : supprimer le fichier ne suffit pas.

---

## 4. npm audit — Analyser les dépendances JavaScript

### Présentation

**npm audit** recherche les vulnérabilités connues dans l'arbre de dépendances d'un projet npm.

L'outil est fourni avec npm : aucune installation supplémentaire n'est nécessaire.

Il peut analyser aussi bien les dépendances directes que les dépendances transitives.

### Utilisation locale

Se placer dans le dossier contenant `package.json` et `package-lock.json` :

```powershell
cd backend
npm audit
```

### Analyser uniquement les dépendances de production

```bash
npm audit --omit=dev
```

Cela exclut les dépendances de développement de l'audit.

### Choisir un seuil de gravité

```bash
npm audit --audit-level=moderate
```

Les niveaux possibles sont :

- `low`
- `moderate`
- `high`
- `critical`

Avec `moderate`, la commande retourne un code d'échec si elle détecte au moins une vulnérabilité de niveau `moderate` ou supérieur.

Les vulnérabilités moins graves peuvent encore apparaître dans le rapport.

### Intégration dans GitHub Actions

Exemple pour un backend situé dans `backend/` :

```yaml
test:
  needs: gitleaks
  runs-on: ubuntu-latest

  defaults:
    run:
      working-directory: backend

  steps:
    - name: Récupérer le code
      uses: actions/checkout@v6

    - name: Installer Node.js
      uses: actions/setup-node@v5
      with:
        node-version: "24"
        cache: npm
        cache-dependency-path: backend/package-lock.json

    - name: Installer les dépendances
      run: npm ci

    - name: Auditer les dépendances
      run: npm audit --audit-level=moderate

    - name: Lancer les tests
      run: npm test -- --runInBand
```

Adapter `node-version` à la version réellement utilisée par l'application.

### Différence entre npm install et npm ci

| Commande | Utilisation |
|---|---|
| `npm install` | Installer ou modifier des dépendances pendant le développement |
| `npm ci` | Installation reproductible à partir du fichier `package-lock.json`, adaptée à la CI |
| `npm ci --omit=dev` | Installer uniquement les dépendances de production |
| `npm audit` | Rechercher des vulnérabilités connues |

### Attention aux corrections automatiques

```bash
npm audit fix
```

Cette commande tente des corrections compatibles avec les contraintes de versions.

```bash
npm audit fix --force
```

Cette dernière peut entraîner des changements de versions majeurs et casser l'application.

Toujours examiner les modifications et relancer les tests avant de les conserver.

---

## 5. Trivy — Analyser les images Docker

### Présentation

**Trivy** est un scanner de sécurité capable de rechercher notamment :

- Les vulnérabilités connues des packages système.
- Les vulnérabilités des bibliothèques applicatives.
- Certains problèmes de configuration et secrets, selon les scanners activés.

Dans ce projet, nous l'utilisons pour analyser les **images Docker qui seront publiées sur Docker Hub**.

### Première règle : préparer une vraie image de production

Il faut éviter de conserver inutilement les outils de construction et de développement dans l'image finale.

Par exemple :

```dockerfile
RUN npm ci --omit=dev
```

installe uniquement les dépendances applicatives de production.

Cependant, l'image officielle Node.js peut également contenir npm et ses propres dépendances.

### Principe du multi-stage build

Un Dockerfile multi-stage utilise plusieurs étapes :

1. Une étape de construction avec les outils nécessaires.
2. Une étape finale contenant seulement les éléments nécessaires à l'exécution.

Exemple générique :

```dockerfile
# Étape 1 : installation des dépendances
FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


# Étape 2 : production
FROM node:24-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules

COPY server.js ./

USER node

EXPOSE 3000

CMD ["node", "server.js"]
```

**Important :** ce Dockerfile illustre le principe du multi-stage, mais l'image finale `node:24-bookworm-slim` contient encore npm. Pour une image réellement dépourvue de npm, il faut utiliser une image d'exécution adaptée ou retirer les outils inutiles, en tenant compte des couches Docker.

La simple suppression dans une instruction `RUN` ne retire pas les fichiers des couches historiques de l'image.

### Lancer Trivy localement

Depuis Windows PowerShell avec Docker Desktop :

```powershell
docker run --rm -v //var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --scanners vuln --severity HIGH,CRITICAL lolaedoc/bouton-rouge:backend
```

Pour un autre projet, remplacer :

```text
lolaedoc/bouton-rouge:backend
```

par le nom réel de l'image Docker locale.

### Comprendre le rapport

```text
Total: 3 (HIGH: 3, CRITICAL: 0)
```

Signifie que trois vulnérabilités HIGH ont été identifiées.

| Statut | Explication |
|---|---|
| `fixed` | Une version corrigée est connue |
| `affected` | Le package est affecté, sans correctif indiqué |
| `Installed Version` | Version présente dans l'image |
| `Fixed Version` | Version contenant le correctif indiqué |

`fixed` ne signifie pas que le problème est déjà corrigé dans l'image.

### Intégration à GitHub Actions

Construire l'image, puis la scanner **avant le push Docker Hub** :

```yaml
- name: Scanner l'image backend avec Trivy
  uses: aquasecurity/trivy-action@v0.36.0
  with:
    image-ref: "lolaedoc/bouton-rouge:backend"
    scanners: "vuln"
    format: "table"
    severity: "HIGH,CRITICAL"
    exit-code: "1"
```

### Comprendre exit-code

| Configuration | Comportement |
|---|---|
| `exit-code: "0"` | Les vulnérabilités sont affichées sans faire échouer le job |
| `exit-code: "1"` | Le job échoue si des vulnérabilités répondent aux critères |

### Ordre conseillé

```text
Construction image backend
           ↓
Construction image frontend
           ↓
Scan Trivy backend
           ↓
Scan Trivy frontend
           ↓
Publication Docker Hub
```

Pour bloquer la publication si l'une des images présente des vulnérabilités HIGH ou CRITICAL, configurer les deux scans avec `exit-code: "1"`.

### Problème rencontré : résultats différents en local et dans GitHub Actions

Si Trivy trouve zéro vulnérabilité localement mais plusieurs dans GitHub Actions, vérifier :

1. Que les modifications du Dockerfile ont été commitées et poussées.
2. Que GitHub Actions utilise le bon Dockerfile.
3. Que l'image analysée est bien celle qui vient d'être construite.
4. Que les images de base et la base de vulnérabilités Trivy sont à jour.

---

## 6. Docker Healthcheck — Surveiller un conteneur

### Présentation

Un **Healthcheck** permet à Docker de vérifier périodiquement si une application contenue dans un conteneur répond correctement.

Un conteneur peut être démarré sans que son application fonctionne correctement.

Docker peut afficher :

- `starting` : premières vérifications en cours.
- `healthy` : contrôles réussis.
- `unhealthy` : échecs répétés.

### Étape 1 : créer une route de santé Express

Dans `server.js` :

```javascript
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Backend opérationnel"
    });
});
```

Cette route doit être accessible sans authentification.

### Étape 2 : ajouter le Healthcheck au Dockerfile

Pour une image Node.js qui écoute sur le port interne `3000` :

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
```

### Paramètres

| Paramètre | Signification |
|---|---|
| `interval=30s` | Une vérification toutes les 30 secondes |
| `timeout=5s` | Temps maximal accordé à une vérification |
| `start-period=10s` | Période initiale de tolérance aux échecs |
| `retries=3` | Nombre d'échecs consécutifs avant l'état unhealthy |

### Étape 3 : reconstruire et tester

```powershell
docker compose up -d --build backend
docker compose ps
```

Résultat attendu :

```text
backend    Up ... (healthy)
```

Voir les détails :

```powershell
docker inspect --format='{{json .State.Health}}' projet-bouton-rouge-backend-1
```

Adapter le nom du conteneur selon le projet.

### Comprendre les ports Docker

Dans Compose :

```yaml
services:
  backend:
    ports:
      - "3001:3000"
```

- `3001` : port accessible depuis la machine hôte.
- `3000` : port interne du conteneur.

Depuis Windows :

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

Dans le conteneur, le Healthcheck utilise :

```text
http://127.0.0.1:3000/health
```

Le même Healthcheck peut donc être utilisé sur plusieurs environnements ayant des ports publiés différents.

### Limitation

Un Healthcheck fournit un état de santé. Docker Compose ne redémarre pas automatiquement un conteneur simplement parce qu'il devient `unhealthy`.

---

## 7. OWASP ZAP — Tester la sécurité HTTP

### Présentation

**OWASP ZAP (Zed Attack Proxy)** est un outil de tests de sécurité des applications web.

Contrairement à Trivy, ZAP analyse une application **en cours de fonctionnement**.

Il peut signaler :

- Des en-têtes HTTP manquants.
- Des configurations CORS trop permissives.
- Des informations techniques divulguées.
- Des problèmes potentiels liés aux réponses HTTP.

### Le scan Baseline

Le *Baseline Scan* explore les ressources accessibles puis exécute des contrôles passifs.

Il ne lance pas les attaques d'un scan actif, mais envoie des requêtes HTTP à l'application.

### Étape 1 : démarrer l'application

```powershell
docker compose up -d
docker compose ps
```

Exemple de configuration locale :

| Service | Port hôte | Port interne |
|---|---|---|
| Backend | 3001 | 3000 |
| Frontend | 4201 | 80 |

### Étape 2 : tester la connexion depuis le conteneur ZAP

Sous Windows avec Docker Desktop, `host.docker.internal` permet d'accéder à un service publié sur l'hôte.

Exemple avec le backend :

```powershell
docker run --rm ghcr.io/zaproxy/zaproxy:stable curl -i http://host.docker.internal:3001/health
```

La réponse attendue commence par :

```text
HTTP/1.1 200 OK
```

### Étape 3 : lancer le scan

```powershell
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:3001/health -m 1 -s -I
```

### Explication des options

| Option | Fonction |
|---|---|
| `-t` | Adresse cible |
| `-m 1` | Durée de l'exploration initiale en minutes |
| `-s` | Affichage condensé |
| `-I` | Ne pas échouer uniquement à cause des avertissements |

### Comprendre les résultats

Exemple :

```text
FAIL-NEW: 0
WARN-NEW: 6
PASS: 62
```

- `PASS` : contrôles sans alerte.
- `WARN-NEW` : règles ayant généré des avertissements.
- `FAIL-NEW` : règles ayant généré des alertes classées FAIL.

### Consigne retenue pour l'exercice

Ne pas rendre la CI bloquante sur les `WARN`, mais conserver le blocage pour les `FAIL`.

L'option `-I` applique ce comportement.

**Attention : par défaut, les règles du Baseline Scan sont généralement classées WARN.** Si l'objectif est de bloquer réellement certaines failles, il faut également configurer des règles ZAP en `FAIL`, par exemple au moyen d'un fichier de configuration `-c`.

Ignorer les avertissements pour un exercice ne veut pas dire qu'ils sont sans importance pour une application réelle.

### Codes de sortie

| Code | Signification |
|---|---|
| `0` | Succès |
| `1` | Au moins un FAIL |
| `2` | WARN sans FAIL, sauf option `-I` |
| `3` | Erreur d'exécution |

### Intégration dans GitHub Actions

Créer un job qui démarre l'API, attend son état de santé, lance ZAP, puis nettoie l'environnement.

```yaml
zap:
  name: Scan OWASP ZAP
  runs-on: ubuntu-latest

  steps:
    - name: Récupérer le code
      uses: actions/checkout@v6

    - name: Démarrer le backend
      run: docker compose up -d --build backend

    - name: Attendre le Healthcheck
      run: |
        for i in {1..30}; do
          CONTAINER=$(docker compose ps -q backend)

          if [ -n "$CONTAINER" ]; then
            STATUS=$(docker inspect \
              --format='{{.State.Health.Status}}' \
              "$CONTAINER")

            if [ "$STATUS" = "healthy" ]; then
              echo "Backend healthy"
              exit 0
            fi
          fi

          sleep 2
        done

        docker compose logs backend
        exit 1

    - name: Analyser le backend avec ZAP
      run: |
        docker run --rm \
          --network host \
          ghcr.io/zaproxy/zaproxy:stable \
          zap-baseline.py \
          -t http://127.0.0.1:3001/health \
          -m 1 \
          -s \
          -I

    - name: Arrêter les conteneurs
      if: always()
      run: docker compose down
```

Cet exemple suppose un runner `ubuntu-latest`, un backend publié sur le port hôte `3001` et une image contenant un Healthcheck.

### Ajouter ZAP aux contrôles obligatoires

Pour que les tests et ZAP soient tous deux nécessaires avant une fusion automatique :

```yaml
merge-dev:
  needs: [test, zap]
```

Pour imposer également ZAP avant une publication :

```yaml
build:
  needs: [test, zap]
```

Attention : les dépendances doivent être adaptées aux conditions `if` de chaque job.

### Limites du scan actuel

Le scan de `/health` vérifie essentiellement les réponses accessibles depuis cette route.

Il ne teste pas automatiquement les routes POST comme `/login` ou `/click`.

Pour analyser plus complètement une API REST, on peut fournir une définition **OpenAPI** à ZAP et utiliser les outils adaptés aux API.

Une erreur `404` pendant l'exploration de `/` peut également apparaître si l'API ne définit pas cette route. Ce n'est pas automatiquement une vulnérabilité.

---

## 8. Organiser les outils dans une pipeline CI/CD

### Principe

Il est préférable de détecter les problèmes le plus tôt possible, avant de publier ou déployer les images Docker.

### Organisation recommandée

```text
Push GitHub
     |
     v
Gitleaks
     |
     +--------------------+
     |                    |
     v                    v
Tests Jest            OWASP ZAP
Supertest             API démarrée
npm audit             dans Docker
     |                    |
     +--------------------+
              |
              v
      Contrôles réussis
              |
              v
     Fusion vers dev
              |
              v
      Build des images
              |
              v
       Scans Trivy
              |
              v
    Publication Docker Hub
              |
              v
   Déploiement sur la VM
```

### Important : la propriété needs

Dans GitHub Actions, l'ordre d'écriture des jobs dans le fichier YAML n'impose pas leur ordre d'exécution.

C'est la propriété `needs` qui définit les dépendances.

Par exemple :

```yaml
test:
  needs: gitleaks
```

Le job `test` attend la réussite du job `gitleaks`.

### Contrôles et seuils retenus

| Outil | Politique de blocage |
|---|---|
| Jest | Échec si un test échoue |
| Supertest | Échec si une assertion échoue |
| Gitleaks | Échec si des secrets sont détectés |
| npm audit | Échec à partir de `moderate` |
| Trivy | Échec pour HIGH ou CRITICAL |
| Healthcheck | Échec de préparation si le backend ne devient pas healthy |
| ZAP | Échec sur les règles FAIL, WARN non bloquants |

---

## 9. Erreurs rencontrées et solutions

### Erreur : le port HTTP ne répond pas

Exemple :

```text
Impossible de se connecter au serveur distant
```

Vérifier :

```powershell
docker compose ps
```

Puis :

```powershell
docker compose config
```

Comparer le port réellement publié avec celui utilisé dans la requête HTTP.

### Erreur : Compose affiche encore l'ancien port

Recréer le conteneur :

```powershell
docker compose up -d --no-build --force-recreate frontend
```

### Erreur : ZAP ne peut pas accéder à localhost

Depuis un conteneur sur Docker Desktop, utiliser :

```text
http://host.docker.internal:PORT
```

Dans un runner GitHub Actions Linux, on peut utiliser `--network host` et `127.0.0.1` si les ports de l'application sont publiés sur l'hôte.

### Erreur : Trivy local et CI ne trouvent pas les mêmes vulnérabilités

Vérifier :

```bash
git status
```

Une modification locale non poussée ne sera pas utilisée par GitHub Actions.

### Erreur : des vulnérabilités npm apparaissent dans l'image de production

Examiner les chemins rapportés par Trivy.

Par exemple :

```text
/usr/local/lib/node_modules/npm/node_modules/...
```

Ce chemin indique que les bibliothèques concernées appartiennent à npm installé dans l'image, et non nécessairement aux dépendances de l'application.

Réduire les composants présents dans l'image finale est préférable à ignorer systématiquement les alertes.

---

## 10. Checklist pour un nouveau projet

### Préparation

- [ ] Créer le dépôt GitHub.
- [ ] Créer le fichier `.gitignore`.
- [ ] Définir les dépendances de production et de développement.
- [ ] Créer les Dockerfiles et le Compose.
- [ ] Configurer les Secrets GitHub nécessaires.

### Tests et sécurité

- [ ] Installer Jest et Supertest.
- [ ] Écrire les tests principaux de l'API.
- [ ] Ajouter Gitleaks.
- [ ] Ajouter `npm audit`.
- [ ] Construire des images Docker adaptées à la production.
- [ ] Analyser les images avec Trivy.
- [ ] Ajouter une route `/health`.
- [ ] Ajouter un Docker Healthcheck.
- [ ] Exécuter ZAP localement.
- [ ] Définir les règles ZAP qui doivent bloquer la CI.
- [ ] Intégrer ZAP à GitHub Actions.

### Publication et déploiement

- [ ] Vérifier les dépendances `needs` entre les jobs.
- [ ] Construire les images Docker.
- [ ] Scanner les images avant leur publication.
- [ ] Publier sur Docker Hub.
- [ ] Déployer sur la VM avec son propre fichier Compose.
- [ ] Vérifier les ports et Healthchecks après le déploiement.

---

## 11. Documentation officielle

- Jest : https://jestjs.io/docs/getting-started
- Supertest : https://github.com/forwardemail/supertest
- Gitleaks : https://github.com/gitleaks/gitleaks
- Gitleaks Action : https://github.com/gitleaks/gitleaks-action
- npm audit : https://docs.npmjs.com/cli/commands/npm-audit
- Trivy : https://trivy.dev/
- Docker multi-stage : https://docs.docker.com/build/building/multi-stage/
- Docker Healthcheck : https://docs.docker.com/reference/dockerfile/#healthcheck
- OWASP ZAP Baseline : https://www.zaproxy.org/docs/docker/baseline-scan/
- GitHub Actions : https://docs.github.com/en/actions

---

**Conclusion**

Les outils DevSecOps sont complémentaires :

- Jest et Supertest vérifient le comportement de l'application.
- Gitleaks protège contre l'exposition accidentelle de secrets.
- npm audit contrôle les dépendances JavaScript.
- Trivy contrôle les composants présents dans les images Docker.
- Docker Healthcheck vérifie que l'application répond.
- OWASP ZAP examine la sécurité des réponses HTTP.

L'objectif n'est pas seulement d'obtenir une pipeline verte, mais de **comprendre les contrôles réalisés, leurs limites et les risques qu'ils permettent de réduire**.

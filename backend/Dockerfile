FROM node:22-alpine

WORKDIR /app

# Copier les fichiers nécessaires à npm
COPY package.json package-lock.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev

# Copier le serveur
COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]

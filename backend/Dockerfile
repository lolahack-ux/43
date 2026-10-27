FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Copier les fichiers de dépendances
COPY package.json yarn.lock ./

# Installer uniquement les dépendances de production
RUN yarn install --frozen-lockfile --production=true


COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
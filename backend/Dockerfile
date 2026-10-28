# =====================================
# ÉTAPE 1 : INSTALLATION
# =====================================

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


# =====================================
# ÉTAPE 2 : PRODUCTION
# =====================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Retirer npm et les gestionnaires de paquets JavaScript
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /opt/yarn* \
           /usr/local/bin/yarn \
           /usr/local/bin/yarnpkg

# Récupérer les dépendances depuis l'étape build
COPY --from=build /app/node_modules ./node_modules

COPY server.js ./

USER node

EXPOSE 3000

CMD ["node", "server.js"]
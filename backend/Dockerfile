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

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
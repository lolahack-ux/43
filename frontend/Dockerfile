FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# Applique les correctifs de sécurité Alpine parus depuis la publication de l'image de base
RUN apk upgrade --no-cache
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/le-bouton-rouge-frontend/browser /usr/share/nginx/html
EXPOSE 80
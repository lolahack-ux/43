FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:22-slim
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/le-bouton-rouge-frontend/browser /usr/share/nginx/html
EXPOSE 80

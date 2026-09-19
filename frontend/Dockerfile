# ============================================================
# ÉTAPE 1 : compilation React/Vite
# ============================================================

FROM node:22-alpine AS build

WORKDIR /app

# Copier les fichiers npm
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le projet frontend
COPY . .

# Variables Vite utilisées pendant la compilation
ARG VITE_API_URL=/api
ARG VITE_SUPABASE_URL=""
ARG VITE_GOOGLE_CLIENT_ID=""

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Compiler React/Vite
RUN npm run build


# ============================================================
# ÉTAPE 2 : serveur Nginx
# ============================================================

FROM nginx:alpine

# Configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build React dans Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
# backend/Dockerfile
FROM node:18-alpine

# Dossier de travail dans le conteneur
WORKDIR /app

# Copier les fichiers
COPY package*.json ./
RUN npm install

COPY . .

# Exposer le port (par exemple 5000)
EXPOSE 3001

# Lancer le serveur
CMD ["node", "server.js"]

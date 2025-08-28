FROM node:22.6.0-alpine
LABEL maintainer="TBMPQF"
LABEL org.opencontainers.image.description="Image Docker pour lancer le bot discord TBM_CPU"

# Definition du repertoire de travail dans l'image docker
WORKDIR /data

# Copie des fichiers locaux dans l'image
COPY . .

# Installation des dépendances
RUN apk add --no-cache gawk ffmpeg py3-pip
RUN npm install

# Rendre executable le script de démarrage
RUN chmod +x ./entrypoint-docker.sh

# Démarrer le code
ENTRYPOINT ["./entrypoint-docker.sh"]

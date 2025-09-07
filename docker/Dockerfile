FROM node:22.6.0-alpine

# Etiquette de l'image
LABEL maintainer="TBMPQF"
LABEL org.opencontainers.image.source=https://github.com/TBMPQF/TBM_CPU_V2
LABEL org.opencontainers.image.description="Image Docker pour lancer le bot discord TBM_CPU"

# Definition du repertoire de travail dans l'image docker
WORKDIR /data

# Copie des fichiers locaux dans l'image
COPY . .
COPY docker/entrypoint-docker.sh ./entrypoint-docker.sh
COPY build-info.json ./build-info.json

# Installation des dépendances système
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    ffmpeg \
    gawk \
    giflib-dev \
    jpeg-dev \
    jq \
    nano \
    pango-dev \
    pixman-dev \
    py3-pip

RUN npm install

# Rendre executable le script de démarrage
RUN chmod +x ./entrypoint-docker.sh

# Démarrer le code avec le script d'entrée
ENTRYPOINT ["./entrypoint-docker.sh"]

# Expose le port pour le health check
EXPOSE 3000

# Ajout du health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

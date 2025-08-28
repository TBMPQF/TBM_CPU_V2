FROM node:lts

LABEL maintainer="TBMPQF"
LABEL org.opencontainers.image.source=https://github.com/TBMPQF/TBM_CPU_V2
LABEL org.opencontainers.image.description="Image Docker pour lancer le bot discord TBM_CPU"

# Definition du repertoire de travail dans l'image docker
WORKDIR /data

# Copie des fichiers locaux dans l'image
COPY . .

# Installation des dépendances
RUN apk add --no-cache gawk ffmpeg py3-pip \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev
RUN npm install

# Rendre executable le script de démarrage
RUN chmod +x ./entrypoint-docker.sh

# Démarrer le code avec le script d'entrée
ENTRYPOINT ["./entrypoint-docker.sh"]

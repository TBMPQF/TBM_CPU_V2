FROM node:24.12.0-alpine

# Etiquette de l'image
LABEL maintainer="TBMPQF"
LABEL org.opencontainers.image.source=https://github.com/TBMPQF/TBM_CPU_V2
LABEL org.opencontainers.image.description="Image Docker pour lancer le bot discord TBM_CPU"

# Definition du repertoire de travail dans l'image docker
WORKDIR /data

# Copie des fichiers locaux dans l'image
COPY . .

# Installation des dépendances système
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    ffmpeg \
    fontconfig  \
    gawk \
    giflib-dev \
    jpeg-dev \
    jq \
    nano \
    pango-dev \
    pixman-dev \
    py3-pip \
    wget

# Installation des dépendances nodejs
RUN npm install

# Installation des polices d'écritures
RUN mkdir -p /usr/share/fonts/truetype/noto && \
    for font in /data/utils/*.ttf; do cp "$font" /usr/share/fonts/truetype/noto/; done && \
    fc-cache -f -v

# Rendre executable les scripts de démarrage
RUN chmod +x ./docker/*.sh

# Démarrer le code avec le script d'entrée
ENTRYPOINT ["./docker/entrypoint-docker.sh"]

# Expose le port pour le health check
EXPOSE 3000

# Déclation du volume pour les logs pour les conserver au reboot du conteneur
VOLUME [ "/data/logs" ]

# Ajout du health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

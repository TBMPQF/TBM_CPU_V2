FROM node:22.6.0-alpine
LABEL maintainer="TBMPQF"

# Definition du repertoire de travail dans l'image docker
WORKDIR /data

# Copie des fichiers locaux dans l'image
COPY . .

# Installation des dependances
RUN apk add --no-cache ffmpeg git py3-pip

# Make config script executable
RUN chmod +x ./entrypoint-docker.sh

# Entrypoint (can be overridden by docker-compose)
CMD sh -c "./entrypoint-docker.sh"

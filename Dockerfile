FROM node:22.6.0-alpine
LABEL maintainer="TBMPQF"

# Install dependencies
RUN apk add --no-cache ffmpeg git py3-pip

# Set workdir
WORKDIR /data

# Copy local files (optionally, if you want to build from local context)
COPY . /data

# Make config script executable
RUN chmod +x /data/CreateConfig.sh || true

# Entrypoint (can be overridden by docker-compose)
CMD sh -c "/data/CreateConfig.sh && node /data/index.js > >(awk '{ print strftime(\"%d/%m_%Hh%Mm%Ss\"), $0; fflush(); }' | tee -a /data/logs/current_output.log) 2> >(awk '{ print strftime(\"%d/%m_%Hh%Mm%Ss\"), $0; fflush(); }' | tee -a /data/logs/current_error.log >&2)"

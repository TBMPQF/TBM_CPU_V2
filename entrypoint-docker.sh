#!/bin/sh

# Gestion des fichiers de Logs
if [ -d "./logs/current_output.log" ]; then
  mv ./logs/current_output.log ./logs/output.log
fi
if [ -d "./logs/current_error.log" ]; then
  mv ./logs/current_error.log ./logs/error.log
fi

# Creation du fichier de configuration
cat << EOF > ./config.json
{
  "token": "$TOKEN",
  "mongourl": "$BDD_URL",
  "serveurMinecraftDOMAIN": "$MINECRAFT_SERVER_URL",
  "twitch": {
    "clientId": "$TWITCH_ID",
    "clientSecret": "$TWITCH_SECRET"
  },
  "apex_api": "$APEX_API",
  "genius_api": "$GENIUS_API"
}
EOF

# Démarrage du code avec Gestion des logs dans les fichiers et les traces de l'image docker en même temps
node --trace-deprecation /data/index.js > >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_output.log) 2> >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_error.log >&2)
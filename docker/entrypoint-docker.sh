#!/bin/sh

# Affichage de la version en cours

echo "Version du code en cours : $(cat ./build-info.json | jq -r .tag)"
echo "Commit du code en cours : $(cat ./build-info.json | jq -r .sha)"

# Gestion des fichiers de Logs
if [ -d "./logs/current_output.log" ]; then
  mv ./logs/current_output.log ./logs/output.log
fi
if [ -d "./logs/current_error.log" ]; then
  mv ./logs/current_error.log ./logs/error.log
fi

# Gestion du delai de démarrage en cas de multiple reboot
if [ ! -f ./nombre_redemmarage.txt ]; then
  touch ./nombre_redemmarage.txt
  echo 0 >> ./nombre_redemmarage.txt
else
  nombre_demmarage=$(tail -n 1 ./nombre_redemmarage.txt)
  echo $((nombre_demmarage + 1)) >> ./nombre_redemmarage.txt
fi
nombre_redemmarage=$(tail -n 1 ./nombre_redemmarage.txt)
delai=$((nombre_redemmarage * 1))
if [ $delai -gt 120 ]; then
  delai='120'
fi
echo "Démarrage multiple ($nombre_redemmarage) en cours, attente de $delai seconde(s)..."
sleep $delai

# Creation du fichier de configuration
echo "Création du fichier de configuration..."
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
echo "Démarrage du bot..."
node /data/index.js > >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_output.log) 2> >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_error.log >&2)
#!/bin/sh

# Affichage de la version en cours, si le fichier est present
if [ -f ./build-info.json ]; then
  echo INF - "Version du code en cours : $(cat ./build-info.json | jq -r .tag)"
  echo INF - "Commit du code en cours : $(cat ./build-info.json | jq -r .sha)"
fi

# Gestion des fichiers .logs
if [ ! -d "./logs" ]; then
  mkdir ./logs
fi

# Deplacement des fichiers de logs précedent pour les lire au prochain démmarrage
if [ -f "./logs/current_output.log" ]; then
  echo "INF - Déplacement des anciens fichiers de logs..."
  rm ./logs/output.log
  mv ./logs/current_output.log ./logs/output.log
fi
# Deplacement des fichiers d'erreurs précedent pour les lire au prochain démmarrage
if [ -f "./logs/current_error.log" ]; then
  echo "INF - Déplacement des anciens fichiers d'erreurs..."
  rm ./logs/error.log
  mv ./logs/current_error.log ./logs/error.log
fi
# Creation des fichiers de logs pour le fonctionnement
echo "INF - Creation des fichiers de logs pour l'execution du bot en cours..."
touch ./logs/current_output.log
touch ./logs/current_error.log

# Gestion du delai de démarrage en cas de multiple reboot
if [ ! -f ./nombre_redemmarage.txt ]; then
  touch ./nombre_redemmarage.txt
  echo 0 >> ./nombre_redemmarage.txt
else
  nombre_demmarage=$(tail -n 1 ./nombre_redemmarage.txt)
  echo $((nombre_demmarage + 1)) >> ./nombre_redemmarage.txt
fi
nombre_redemmarage=$(tail -n 1 ./nombre_redemmarage.txt)
delai=$((nombre_redemmarage - 1))
if [ $delai -lt 0 ]; then
  delai='0'
elif [ $delai -gt 120 ]; then
  delai='120'
else
  delai=$((delai))
fi
echo INF - "Démarrage multiple ($nombre_redemmarage) en cours, attente de $delai seconde(s)..."
sleep $delai

# Creation du fichier de configuration
echo INF - "Création du fichier de configuration..."
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
echo INF - "Démarrage du bot..."
node /data/index.js > >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_output.log) 2> >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_error.log >&2)
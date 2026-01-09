#!/bin/sh

# Affichage de la version en cours, si le fichier est present
if [ -f ./build-info.json ]; then
  echo INF - "Version du code en cours : $(cat ./build-info.json | jq -r .tag)"
  echo INF - "Commit du code en cours : $(cat ./build-info.json | jq -r .sha)"
  echo INF - "Date de construction de l'image : $(cat ./build-info.json | jq -r .date)"
fi

# Gestion des fichiers .logs
if [ ! -d "./logs" ]; then
  mkdir ./logs
fi

LOGFILES="output error"
for LOGFILE in $LOGFILES; do
  # Deplacement des fichiers de logs précedent pour les lire au prochain démmarrage
  if [ -f "./logs/current_${LOGFILE}.log" ]; then
    echo "INF - Déplacement des anciens fichiers de logs ${LOGFILE}..."
    rm ./logs/${LOGFILE}.log
    mv ./logs/current_${LOGFILE}.log ./logs/${LOGFILE}.log
  fi
  echo "INF - Creation du fichier de logs ${LOGFILE} pour l'execution du bot en cours..."
  touch ./logs/current_${LOGFILE}.log
done

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
  "genius_api": "$GENIUS_API",
  "football_api": "$FOOTBALL_API"
}
EOF

# Démarrage du code avec Gestion des logs dans les fichiers et les traces de l'image docker en même temps
if [!(cat ./build-info.json | jq -r .tag | grep -q "main")]; then
  echo WAR - "Version BETA détectée, affichage d'une variable d'environnement supplémentaire dans les logs."
  echo $MINECRAFT_SERVER_URL
fi
echo INF - "Démarrage du bot..."
node /data/index.js > >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_output.log) 2> >(awk '{ print strftime("%d/%m_%Hh%Mm%Ss"), $0; fflush(); }' | tee -a ./logs/current_error.log >&2)
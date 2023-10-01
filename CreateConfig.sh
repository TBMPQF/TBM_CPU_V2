cat << EOF > ./config.json
{
  "token": "$TOKEN",
  "mongourl": "$BDD_URL",
  "serveurMinecraftDOMAIN": "$PERSONAL_DOMAINE_NAME",
  "twitch": {
    "clientId": "$TWITCH_ID",
    "clientSecret": "$TWITCH_SECRET"
  }
}
EOF
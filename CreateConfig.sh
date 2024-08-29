cat << EOF > ./config.json
{
  "token": "$TOKEN",
  "mongourl": "$BDD_URL",
  "discordAPI": {
    "discordClientId": "$DISCORD_CLIENT_ID",
    "discordclientSecret": "$DISCORD_CLIENT_SECRET"
  },
  "serveurMinecraftDOMAIN": "$PERSONAL_DOMAINE_NAME",
  "twitch": {
    "clientId": "$TWITCH_ID",
    "clientSecret": "$TWITCH_SECRET"
  },
  "apex_api": "$APEX_API",
  "genius_api": "$GENIUS_API"
}
EOF
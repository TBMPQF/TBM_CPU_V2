const { Client, IntentsBitField, Collection } = require("discord.js");
const bot = new Client({ intents: new IntentsBitField(3276799) });
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

bot.commands = new Collection();
bot.config = require("./config");

const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const { connect } = require("mongoose");

const successIcon = "\x1b[32m\u2714\x1b[0m";
const dbColor = "\x1b[31m";
const resetColor = "\x1b[0m";
const lineSeparator = `${resetColor}---------------------------------------------------`;

connect(bot.config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(`| ${successIcon} ${dbColor}La base de données est chargée avec succès ! ${resetColor} |`);
  console.log(lineSeparator);
});

const distube = new DisTube(bot, {
  plugins: [new YtDlpPlugin()],
});

bot.distube = distube;

bot.login(bot.config.token);

require('./music')(bot);
require("./handlers/loaders/loadCommands")(bot);
require("./handlers/loaders/loadEvents")(bot);

// Validation de santé pour docker 'Healthy'
const express = require('express');
const e = require("express");
const app = express();
const PORT = 3000;

let isBotReady = false;

app.get('/health', (req, res) => {
    try {
        if (isBotReady) {
            res.status(200).send('Le bot fonctionnel');
        } else {
            res.status(503).send('Le bot n\'est pas prêt');
        }
    } catch (error) {
        console.error('Health check erreur:', error);
        res.status(500).send('Internal server error');
    }
});

// Démarrer le serveur Express immédiatement
app.listen(PORT, () => {
    console.log(`Healthcheck dispo sur le port ${PORT}`);
});

// Dans votre événement ready existant
bot.once('ready', () => {
    isBotReady = true;
});

// Dans votre gestion d'erreur ou événement disconnect
bot.on('disconnect', () => {
    isBotReady = false;
});

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

const express = require('express');
const app = express();
const PORT = process.env.HEALTH_PORT || 3000;

// Endpoint de santé
app.get('/health', (req, res) => {
    // Vérifiez si le bot est connecté à Discord
    if (client && client.ws.status === 0) {
        res.status(200).send('OK');
    } else {
        res.status(500).send('Bot not ready');
    }
});

app.listen(PORT, () => {
    console.log(`Health check endpoint listening on port ${PORT}`);
});
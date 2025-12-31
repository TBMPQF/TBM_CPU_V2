const { Client, IntentsBitField, Collection } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const mongoose = require("mongoose");
const express = require("express");

const bot = new Client({
  intents: new IntentsBitField(3276799),
});

bot.commands = new Collection();
bot.config = require("./config");

mongoose.set("strictQuery", true);

const C = {
  gray: s => `\x1b[90m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  purple: s => `\x1b[35m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
};

const check = C.green("✔");
const separator = C.gray("------------------------------------------------");

function logBox(message) {
  console.log(`| ${check} ${message} |`);
  console.log(separator);
}

mongoose.connect(bot.config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  logBox("La base de données est chargée avec succès !");
});

const distube = new DisTube(bot, {
  plugins: [new YtDlpPlugin()],
});
bot.distube = distube;

bot.login(bot.config.token);

require("./music")(bot);
require("./handlers/loaders/loadCommands")(bot);
require("./handlers/loaders/loadEvents")(bot);

const app = express();
const PORT = 3000;

let isBotReady = false;

app.get("/health", (req, res) => {
  try {
    if (isBotReady) {
      res.status(200).send("Le bot est fonctionnel");
    } else {
      res.status(503).send("Le bot n'est pas prêt");
    }
  } catch (err) {
    console.error(C.red("[HEALTHCHECK] Erreur:"), err);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => {
  logBox(`Healthcheck disponible sur le port ${C.purple(PORT)}`);
});

bot.once("ready", () => {
  isBotReady = true;
});

bot.on("disconnect", () => {
  isBotReady = false;
});

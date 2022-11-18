const { Player } = require("discord-player");
const {
  Client,
  IntentsBitField,
  PermissionFlagsBits,
  Collection,
} = require("discord.js");
const bot = new Client({ intents: new IntentsBitField(3276799) });

bot.commands = new Collection();
bot.config = require("./config");

global.player = new Player(bot, bot.config.opt.discordPlayer);

const { connect } = require("mongoose");
connect(bot.config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() =>
  console.log(
    "\x1b[35m" +
      "La base de donnée " +
      "\x1b[31m" +
      " est chargée avec succés ! 🗃️"
  )
);

require("./src/events")(bot);
require("./src/Loaders/loadCommands")(bot);
require("./src/Loaders/loadEvents")(bot);

bot.login(bot.config.token);

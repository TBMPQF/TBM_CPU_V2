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

const { connect, mongoose } = require("mongoose");
connect(bot.config.mongourl).then(() =>
  console.log(
    "\x1b[35m" +
      "La base de donnée " +
      "\x1b[31m" +
      "est chargée avec succés ! 🗃️"
  )
);

const schema = new mongoose.Schema();

mongoose.model("Levels", schema);
mongoose.model("Levels").findOne();

require("./handlers/eventsmusic")(bot);
require("./handlers/loaders/loadCommands")(bot);
require("./handlers/loaders/loadEvents")(bot);

bot.login(bot.config.token);

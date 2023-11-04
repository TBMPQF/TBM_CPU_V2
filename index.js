const { Client, IntentsBitField, Collection } = require("discord.js");
const bot = new Client({ intents: new IntentsBitField(3276799) });

bot.commands = new Collection();
bot.config = require("./config");

const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const { connect } = require("mongoose");
connect(bot.config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(
    "\x1b[35m" +
      "La base de donnée " +
      "\x1b[31m" +
      "est chargée avec succés ! 🗃️"
  );
});

bot.login(bot.config.token);

require("./handlers/loaders/loadCommands")(bot);
require("./handlers/loaders/loadEvents")(bot);

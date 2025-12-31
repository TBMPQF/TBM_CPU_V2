const fs = require("fs");

const C = {
  gray: s => `\x1b[90m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  purple: s => `\x1b[35m${s}\x1b[0m`,
};

const successIcon = C.green("✔");
const lineSeparator = C.gray("------------------------------------------------");

module.exports = async (bot) => {
  let totalEvents = 0;

  const eventFiles = fs
    .readdirSync("./Events/")
    .filter(f => f.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(`../../Events/${file}`);
    totalEvents++;

    if (event.once) {
      bot.once(event.name, (...args) => event.execute(...args, bot));
    } else {
      bot.on(event.name, (...args) => event.execute(...args, bot));
    }
  }

  const eventSubFolders = fs
    .readdirSync("./Events/")
    .filter(f => !f.endsWith(".js"));

  for (const folder of eventSubFolders) {
    const eventFiles = fs
      .readdirSync(`./Events/${folder}/`)
      .filter(f => f.endsWith(".js"));

    for (const file of eventFiles) {
      const event = require(`../../Events/${folder}/${file}`);
      totalEvents++;

      if (event.once) {
        bot.once(event.name, (...args) => event.execute(...args, bot));
      } else {
        bot.on(event.name, (...args) => event.execute(...args, bot));
      }
    }
  }

  console.log(
    `| ${successIcon} ${C.purple(totalEvents)} événements ont été chargés avec succès ! |`
  );
  console.log(lineSeparator);
};
const fs = require("fs");

const successIcon = "\x1b[32m\u2714\x1b[0m"; // Symbole CHECK en vert
const eventColor = "\x1b[35m"; // Couleur violette pour les événements
const resetColor = "\x1b[0m"; // Réinitialisation de la couleur
const lineSeparator = `${resetColor}------------------------------------------------`;

module.exports = async (bot) => {
  let totalEvents = 0;

  const eventFiles = fs
    .readdirSync("./Events/")
    .filter((f) => f.endsWith(".js"));
    
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
    .filter((f) => !f.endsWith(".js"));
    
  eventSubFolders.forEach((folder) => {
    const commandFiles = fs
      .readdirSync(`./Events/${folder}/`)
      .filter((f) => f.endsWith(".js"));

    for (const file of commandFiles) {
      const event = require(`../../Events/${folder}/${file}`);
      totalEvents++;

      if (event.once) {
        bot.once(event.name, (...args) => event.execute(...args, bot));
      } else {
        bot.on(event.name, (...args) => event.execute(...args, bot));
      }
    }
  });

  console.log(`| ${successIcon} ${eventColor}${totalEvents}${resetColor} événements ont été chargés avec succès ! |`);
  console.log(lineSeparator);
};

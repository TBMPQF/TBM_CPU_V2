const fs = require("fs");

const successIcon = "\x1b[32m\u2714\x1b[0m";
const commandColor = "\x1b[36m";
const resetColor = "\x1b[0m";
const lineSeparator = `${resetColor}------------------------------------------------`;

module.exports = async (bot) => {
  const commandSubFolders = fs
    .readdirSync("./commands/")
    .filter((f) => !f.endsWith(".js"));
  
  let totalCommands = 0;
  
  commandSubFolders.forEach((folder) => {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}/`)
      .filter((f) => f.endsWith(".js"));

    commandFiles.forEach((file) => {
      const command = require(`./../../commands/${folder}/${file}`);
      bot.commands.set(command.name, command);
      totalCommands++;
    });
  });

  console.log(lineSeparator);
  console.log(`| ${successIcon} ${commandColor}${totalCommands}${resetColor} commandes ont été chargées avec succès ! |`);
  console.log(lineSeparator);
};

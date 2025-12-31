const fs = require("fs");

const C = {
  gray: s => `\x1b[90m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  cyan: s => `\x1b[36m${s}\x1b[0m`,
};

const successIcon = C.green("✔");
const lineSeparator = C.gray("------------------------------------------------");

module.exports = async (bot) => {
  const commandSubFolders = fs
    .readdirSync("./commands/")
    .filter(f => !f.endsWith(".js"));

  let totalCommands = 0;

  for (const folder of commandSubFolders) {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}/`)
      .filter(f => f.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(`../../commands/${folder}/${file}`);
      bot.commands.set(command.name, command);
      totalCommands++;
    }
  }

  console.log(lineSeparator);
  console.log(
    `| ${successIcon} ${C.cyan(totalCommands)} commandes ont été chargées avec succès ! |`
  );
  console.log(lineSeparator);
};

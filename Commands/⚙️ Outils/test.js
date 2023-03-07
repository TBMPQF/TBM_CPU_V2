const Discord = require("discord.js");

module.exports = {
  name: "test",
  description: "丨Affiche la latence du serveur",
  category: "⚙️ Outils",
  dm: false,

  async execute(bot, message) {
    let PingEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `
            \`丨Ton ping`
      )
      .setColor("#b3c7ff");

    await message.reply({
      embeds: [PingEmbed],
      ephemeral: true,
    });
  },
};

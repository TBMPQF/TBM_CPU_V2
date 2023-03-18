const Discord = require("discord.js");

module.exports = {
  name: "reboot",
  description: "丨Relance le Bot.",
  category: "Modération",
  dm: false,

  async execute(bot, message) {
    const RebootEmbed = new Discord.EmbedBuilder()
      .setTitle(`Redémarrage du bot en cours...`)
      .setColor("Blue");
    message
      .reply({ embeds: [RebootEmbed] })
      .then(() => client.destroy())
      .catch(console.error);
  },
};

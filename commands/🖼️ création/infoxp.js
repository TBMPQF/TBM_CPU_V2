const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "infoxp",
  description: "丨Affiche la latence du serveur",
  dm: false,
  permission: 8,

  async execute(message) {
    const TicketEmbed = new EmbedBuilder()
      .setColor("Orange")
      .setTitle(`――――――∈ 𝐆ain d'𝐗𝐏 journalier ! ∋――――――`)
      .setDescription(
        `\n𝐂'est ici que tu peux récupérer ton \`𝐃aily\`. 𝐈l sera disponible à nouveau après \`23H\`. 𝐍e l'oublie pas, lui en tout cas ne t'oublieras pas haha.`
      );

    message.reply({ embeds: [TicketEmbed] });
  },
};

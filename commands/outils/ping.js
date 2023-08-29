const Discord = require("discord.js");

function getPingEmoji(ping) {
  if (ping <= 200) {
    return "🟢";
  } else if (ping <= 400) {
    return "🟠";
  } else {
    return "🔴";
  }
}

module.exports = {
  name: "ping",
  description: "丨Affiche les latences.",
  dm: false,
  permission: "Aucune",

  async execute(interaction, bot) {
    const startTime = Date.now();

    const APIPing = bot.ws.ping;
    const APIemoji = getPingEmoji(APIPing);

    const reloadPing = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("PING_BUTTON")
        .setEmoji("🔄")
        .setLabel("Actualiser")
        .setStyle(Discord.ButtonStyle.Success)
    );

    try {
      await interaction.reply({content: 'Pong!'});

      const pingUser = Date.now() - startTime;
      const emojiUser = getPingEmoji(pingUser);
      
      const userPingString =
      `\`${emojiUser}\`丨Ton ping : **${pingUser}ms** :fish:`;

      const PingEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `
         ${userPingString}
         \`${APIemoji}\`丨BOT TBM_CPU ping : **${APIPing}ms**`
      )
      .setColor("#b3c7ff");

      await interaction.editReply({
        embeds: [PingEmbed],
        components: [reloadPing],
      });
    } catch (error) {
      console.error(error);
    }
  },
};
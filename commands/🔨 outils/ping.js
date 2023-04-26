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
  description: "丨Affiche la latence du serveur.",
  dm: false,
  permission: 8,

  async execute(bot, interaction) {
    const pingUser = Date.now() - interaction.createdAt.getTime();
    const emojiUser = getPingEmoji(pingUser);

    const APIPing = bot.ws.ping;
    const APIemoji = getPingEmoji(APIPing);

    const userPingString =
      "`${emojiUser}`丨Ton ping : **${pingUser}ms** :fish:";
    const PingEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `
         ${userPingString}
         \`${APIemoji}\`丨BOT TBM_CPU ping : **${APIPing}ms**`
      )
      .setColor("#b3c7ff");

    const reloadPing = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("ping")
        .setEmoji("🔄")
        .setLabel("Actualiser")
        .setStyle("SUCCESS")
    );

    try {
      await interaction.reply({
        embeds: [PingEmbed],
        components: [reloadPing],
        ephemeral: false,
      });
    } catch (error) {
      console.error(error);
    }
  },
};

const Discord = require("discord.js");

module.exports = {
  name: "ping",
  description: "丨Affiche la latence du serveur",
  category: "⚙️ Outils",
  dm: false,

  async execute(bot, message) {
    let reloadPing = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("ping")
        .setEmoji("🔄")
        .setLabel("Actualiser")
        .setStyle(Discord.ButtonStyle.Success)
    );
    // Ping du membre qui requête la commande
    const pingUser = Date.now() - message.createdTimestamp;
    let emojiUser;
    if (pingUser <= 200) {
      emojiUser = "🟢";
    } else if (pingUser <= 400 && pingUser >= 200) {
      emojiUser = "🟠";
    } else if (pingUser >= 400) {
      emojiUser = "🔴";
    }
    // Ping de l'API de discord
    const APIPing = bot.ws.ping;
    let APIemoji;
    if (APIPing <= 200) {
      APIemoji = "🟢";
    } else if (APIPing <= 400 && APIPing >= 200) {
      APIemoji = "🟠";
    } else if (APIPing >= 400) {
      APIemoji = "🔴";
    }

    let PingEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `
            \`${emojiUser}\`丨Votre ping : **${pingUser}ms**
            \`${APIemoji}\`丨BOT TBM_CPU ping : **${APIPing}ms**`
      )
      .setColor("#b3c7ff");

    await message.reply({
      embeds: [PingEmbed],
      components: [reloadPing],
    });
  },
};

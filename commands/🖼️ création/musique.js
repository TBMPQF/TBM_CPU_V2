const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "musique",
  description: "丨Affiche l'embed pour la musique'.",
  dm: false,
  permission: 8,

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Disquette de musique")
      .setDescription("La playlist est actuellement vide !")

    const musicChoice = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("PLAY")
        .setLabel("▶️")
        .setStyle(ButtonStyle.Success)
    ).addComponents(
      new ButtonBuilder()
        .setCustomId("PAUSE")
        .setLabel("⏸️")
        .setStyle(ButtonStyle.Secondary)
    ).addComponents(
      new ButtonBuilder()
        .setCustomId("SKIP")
        .setLabel("⏭️")
        .setStyle(ButtonStyle.Primary)
    ).addComponents(
      new ButtonBuilder()
        .setCustomId("REPEAT")
        .setLabel("🔂")
        .setStyle(ButtonStyle.Primary)
    ).addComponents(
      new ButtonBuilder()
        .setCustomId("STOP")
        .setLabel("⏹️")
        .setStyle(ButtonStyle.Danger)
    )
    const musicMessage = await message.channel.send({ embeds: [embed], components: [musicChoice] });
    global.musicMessageId = musicMessage.id;
  },
};

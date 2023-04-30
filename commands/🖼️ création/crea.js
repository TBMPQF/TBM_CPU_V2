const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "crea",
  description: "丨Affiche la création du moment.",
  dm: false,
  permission: 8,

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Disquette de musique")
      .setDescription("Voici une représentation d'une disquette de musique !")
      .setThumbnail("https://i.imgur.com/vXjK3qs.png") // Lien vers une image de disquette de musique
      .addFields(
        { name: "Titre", value: "Exemple de titre", inline: true },
        { name: "Artiste", value: "Exemple d'artiste", inline: true },
        { name: "Durée", value: "3:25", inline: true }
      );

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
    message.channel.send({ embeds: [embed], components: [musicChoice] });
  },
};

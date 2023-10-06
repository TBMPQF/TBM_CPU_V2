const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
const { queue } = require("../../models/queue");

module.exports = {
  name: "musique",
  description: "丨𝐄nvoi l'embed de la musique.",
  dm: false,
  permission: 8,

  async execute(interaction) {
    const serverId2 = interaction.guild.id;
    const rowMusic = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("PLAY_MUSIC")
          .setEmoji("▶")
          .setStyle(ButtonStyle.Primary)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("STOP_MUSIC")
          .setEmoji("⏹")
          .setStyle(ButtonStyle.Danger)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("NEXT_MUSIC")
          .setEmoji("⏭")
          .setStyle(ButtonStyle.Primary)
      );

    let playlistText = "";

    if (queue[serverId2] && queue[serverId2].length > 0) {

      queue[serverId2].forEach((song, index) => {
        let title = song.title.replace(/\(.*?\)/g, "").trim();
        playlistText += `\`${index + 1}\`丨${title}\n`;
      });
    } else {
      playlistText = "Aucune musique dans la liste de lecture.";
    }

    const RoleEmbed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle(`――――――――∈ \`MUSIQUE\` ∋――――――――`)
      .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
      .setDescription(playlistText)
      .setFooter({
        text: `Cordialement, l'équipe ${interaction.guild.name}`,
        iconURL: interaction.guild.iconURL(),
      });
    interaction.reply({
      embeds: [RoleEmbed],
      components: [rowMusic],
    });
  },
};

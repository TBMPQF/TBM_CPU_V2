const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "playlist",
  description: "丨Voir la playlist.",
  permission: "Aucune",
  dm: false,

  async execute(bot, interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    if (!queue) return interaction.reply({ embeds: [NULL] });

    const NULL_QUEUE = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `Pas de musique dans la file d'attente après celle en cours... ❌`
      );

    if (!queue.tracks[0]) return interaction.reply({ embeds: [NULL_QUEUE] });

    const embed = new EmbedBuilder();

    embed.setColor("Purple");
    embed.setThumbnail(
      interaction.guild.iconURL({ size: 2048, dynamic: true })
    );
    embed.setAuthor({
      name: queue.current.title,
      iconURL: interaction.user.displayAvatarURL({ size: 1024, dynamic: true }),
    });

    const tracks = queue.tracks.map(
      (track, i) =>
        `**\`${i + 1}\`** - ${track.title} | ${
          track.author
        } (demander par : \`${track.requestedBy.username}\`)`
    );

    const songs = queue.tracks.length;
    const nextSongs =
      songs > 5
        ? `et **\`${songs - 5}\`** autres sons...`
        : `Dans la playlist **\`${songs}\`** sons...`;

    embed.setDescription(`${tracks.slice(0, 5).join("\n")}\n\n${nextSongs}`);

    interaction.reply({ embeds: [embed] });
  },
};

const { QueryType } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "play",
  description: "丨Écoute une musique.",
  category: "Music",
  permission: "Aucune",
  dm: false,
  options: [
    {
      type: 3,
      name: "music",
      description: "丨Quelle musique veux-tu écouter ?",
      required: true,
    },
  ],

  async execute(bot, interaction) {
    const args = interaction.options.getString("music");

    const res = await player.search(args, {
      requestedBy: interaction.member,
      searchEngine: QueryType.AUTO,
    });

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucun résultat trouvé... ❌`);

    if (!res || !res.tracks.length)
      return interaction.reply({ embeds: [NULL] });

    const queue = await player.createQueue(interaction.guild, {
      metadata: interaction.channel,
    });

    try {
      if (!queue.connection)
        await queue.connect(interaction.member.voice.channel);
    } catch {
      await player.deleteQueue(interaction.guild.id);

      const NULL_JOIN = new EmbedBuilder()
        .setColor("Purple")
        .setDescription(
          `Je ne peux pas rejoindre le salon car il faut que tu sois dans un salon vocal ❌`
        );

      return interaction.reply({ embeds: [NULL_JOIN] });
    }
    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `Chargement ${res.playlist ? "de la playlist" : "du son"}... 🎧`
      );

    await interaction.reply({ embeds: [Good], ephemeral: true });

    res.playlist ? queue.addTracks(res.tracks) : queue.addTrack(res.tracks[0]);

    if (!queue.playing) await queue.play();
  },
};

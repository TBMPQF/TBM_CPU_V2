const { EmbedBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  name: "volume",
  description: "丨Choisis le volume de la musique.",
  permission: "Aucune",
  dm: false,
  options: [
    {
      type: 10,
      name: "number",
      description: "丨A combien je dois mettre le volume ?",
      required: true,
    },
  ],

  async execute(bot, interaction) {
    const maxVol = bot.config.opt.maxVol;

    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    if (!queue || !queue.playing) return interaction.reply({ embeds: [NULL] });

    const vol = interaction.options.getNumber("vol");

    const NULL_DEJA = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `Le volume que vous souhaitez modifier est déjà celui en cours"... ❌`
      );

    if (queue.volume === vol) return interaction.reply({ embeds: [NULL_DEJA] });

    const NULL_MAX = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `Le nombre spécifié n'est pas valide. Entrez un nombre entre **1** et **${maxVol}**"... ❌`
      );

    if (vol < 0 || vol > maxVol)
      return interaction.reply({ embeds: [NULL_MAX] });

    const success = queue.setVolume(vol);

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        success
          ? `Le volume à été modifier à **${vol}**% 🔊`
          : `Quelque chose s'est mal passé"... ❌`
      );

    return interaction.reply({ embeds: [Good] });
  },
};

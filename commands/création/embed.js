const {EmbedBuilder} = require("discord.js");

module.exports = {
  name: "embed",
  description: "丨𝐄nvoi l'embed création.",
  dm: false,
  permission: 'Aucune',

  async execute(interaction) {
    const EmbedEmbed = new EmbedBuilder()
          .setColor('#9146FF')
          .setTitle('Hors Ligne... :x:')
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription(`Il était en live pendant \`X\`.\n\nMais il revient prochainement pour de nouvelles aventures !`)
          .setURL(`https://www.twitch.tv/`)
          .setThumbnail('https://i.postimg.cc/sfkfbT2m/Sans-titre.png')
          .setTimestamp()
          .setFooter({text: `Twitch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png'});
    await interaction.reply({
      embeds: [EmbedEmbed],
    });
  },
};

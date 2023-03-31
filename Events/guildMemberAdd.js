const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberAdd",
  async execute(member, bot) {
    const reglementChannelId = "811721151998853150";
    const rolesChannelId = "811652152467783690";

    member.roles.add("825023017645899822");

    const WelcomeEmbed = new EmbedBuilder()
      .setTitle(`\`Oh! Un nouveau membre\` :warning:`)
      .setColor("#ffc394")
      .setDescription(
        `Bienvenue <@${member.user.id}>, tu viens de rejoindre la **${
          member.guild.name
        }**. \nPrend ton fusil et rend toi directement sur le champ de tir !\nN'oublie pas de \`lire/valider\` le ${member.guild.channels.cache
          .get(reglementChannelId)
          .toString()} et de prendre tes ${member.guild.channels.cache
          .get(rolesChannelId)
          .toString()} de jeux.`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setTimestamp()
      .setFooter({
        text: `${member.user.username} nouvelle recrue au rang de 丨2nd 𝐂lasse`,
        iconURL: `${member.user.displayAvatarURL({
          dynamic: true,
          size: 512,
        })}`,
      });

    bot.channels.cache
      .get("825333855933300778")
      .send({ embeds: [WelcomeEmbed] });
  },
};

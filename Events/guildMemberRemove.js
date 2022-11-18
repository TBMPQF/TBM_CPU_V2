const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberRemove",
  async execute(member, bot) {
    const RemoveMember = new EmbedBuilder()
      .setTitle(`\`${member.user.username}\` nous a quitté ! :sob:`)
      .setColor("Red")
      .setTimestamp()
      .setFooter({
        text: `丨`,
        iconURL: `${member.user.displayAvatarURL({
          dynamic: true,
          size: 512,
        })}`,
      });

    bot.channels.cache
      .get("838440585341566996")
      .send({ embeds: [RemoveMember] });
  },
};

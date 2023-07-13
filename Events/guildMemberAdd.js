const { EmbedBuilder } = require("discord.js");
const User = require("../models/experience");
const ServerConfig = require("../models/serverConfig");
const rolesByLevel = require("../models/roleRewards"); 

module.exports = {
  name: "guildMemberAdd",
  async execute(member, bot) {
    const serverConfig = await ServerConfig.findOne({
      serverID: member.guild.id,
    });
    if (!serverConfig) {
      return;
    }

    const welcomeRoleName = serverConfig.roleWelcomeName;
    const welcomeRole = member.guild.roles.cache.find(
      (role) => role.name === welcomeRoleName
    );
    let welcomeRoleNoName = 'PAS DÉFINI';
    if (welcomeRole) {
      member.roles.add(welcomeRole);
      welcomeRoleNoName = welcomeRole.name
    }

    const newUser = new User({
      userID: member.user.id,
      username: member.user.username,
      serverID: member.guild.id,
      serverName: member.guild.name,
      joinedAt: Date.now(),
    });

    try {
      await newUser.save();
    } catch (error) {}

    const reglementChannel = member.guild.channels.cache.get(
      serverConfig.reglementChannelID
    );
    const rolesChannel = member.guild.channels.cache.get(
      serverConfig.rolesChannelID
    );

    let reglementChannelString = reglementChannel
      ? reglementChannel.toString()
      : "PAS DÉFINI";
    let rolesChannelString = rolesChannel
      ? rolesChannel.toString()
      : "PAS DÉFINI";

    const WelcomeEmbed = new EmbedBuilder()
      .setTitle(`\`Oh! Un nouveau membre\` :warning:`)
      .setColor("#ffc394")
      .setDescription(
        `Bienvenue <@${member.user.id}>, tu viens de rejoindre **${member.guild.name}**. \nPrend ton fusil et rend toi directement sur le champ de tir !\nN'oublie pas de \`lire/valider\` le ${reglementChannelString} et de prendre tes rôles ${rolesChannelString}.`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setTimestamp()
      .setFooter({
        text: `${member.user.username} nouvelle recrue au rang de ${welcomeRoleName}`,
        iconURL: `${member.user.displayAvatarURL({
          dynamic: true,
          size: 512,
        })}`,
      });

    const welcomeChannel = bot.channels.cache.get(
      serverConfig.welcomeChannelID
    );
    if (welcomeChannel) {
      welcomeChannel.send({ embeds: [WelcomeEmbed] });
    }
  },
};

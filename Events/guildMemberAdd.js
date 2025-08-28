const { EmbedBuilder } = require("discord.js");
const User = require("../models/experience");
const ServerConfig = require("../models/serverConfig");
const ComplianceQueue = require("../models/complianceQueue");

const TBMServerId = "716810235985133568";

module.exports = {
  name: "guildMemberAdd",
  async execute(member, bot) {
    const serverConfig = await ServerConfig.findOne({ serverID: member.guild.id });
    if (!serverConfig) return;

    let footerText = `${member.user.username} nouvelle jeune étoile montante :)`;
    let welcomeRoleApplied = false;

    if (serverConfig.roleWelcomeID) {
      const byId = member.guild.roles.cache.get(serverConfig.roleWelcomeID)
                || await member.guild.roles.fetch(serverConfig.roleWelcomeID).catch(() => null);
      if (byId) {
        await member.roles.add(byId).catch(() => {});
        welcomeRoleApplied = true;
      }
    }
    if (!welcomeRoleApplied && serverConfig.roleWelcomeName) {
      const welcomeRole = member.guild.roles.cache.find((role) => role.name === serverConfig.roleWelcomeName);
      if (welcomeRole) {
        await member.roles.add(welcomeRole).catch(() => {});
        welcomeRoleApplied = true;
      }
    }
    if (welcomeRoleApplied) footerText = `${member.user.username} nouvelle jeune étoile montante (:`;    

    const existingUser = await User.findOne({
      userID: member.user.id,
      serverID: member.guild.id,
    });

    if (!existingUser) {
      try {
        await new User({
          userID: member.user.id,
          username: member.user.username,
          serverID: member.guild.id,
          serverName: member.guild.name,
          joinedAt: Date.now(),
        }).save();
      } catch (error) {
        console.error(error);
      }
    }

    const reglementChannel = member.guild.channels.cache.get(serverConfig.reglementChannelID);
    const rolesChannel = member.guild.channels.cache.get(serverConfig.roleChannelID);

    let reglementChannelString = reglementChannel ? reglementChannel.toString() : "PAS DÉFINI";
    let rolesChannelString = rolesChannel ? rolesChannel.toString() : "PAS DÉFINI";

    let description = `𝐎n dirait qu'une nouvelle recrue a infiltré les rangs : **<@${member.user.id}>** !\n`;
    description += `**𝐁ienvenue** dans **${member.guild.name}**, la seule armée où tu peux te permettre d'oublier ton casque mais pas ton humour.`;
    
    description += `\n\n__**𝐏remière mission, soldat :**__\n`;
    
    if (reglementChannelString !== "PAS DÉFINI" && rolesChannelString !== "PAS DÉFINI") {
      description += `◟ 𝐋is le ${reglementChannelString} et fais comme si tu comprenais tout.\n`;
      description += `◟ 𝐅ile dans ${rolesChannelString} et choisis tes passions bizarres, on ne juge pas.`;
    } else {
      if (reglementChannelString !== "PAS DÉFINI") {
        description += `◟ 𝐋is le ${reglementChannelString}, on t'assure que c'est *presque* intéressant.`;
      }
      if (rolesChannelString !== "PAS DÉFINI") {
        description += `\n◟ 𝐕a dans ${rolesChannelString} et choisis un rôle... ou deux, personne ne t'arrêtera.`;
      }
    }
    
    description += `\n\n💡 ***𝐏etit conseil*** **: évite de trop briller, tu risquerais d'aveugler les autres.**`;
    description += `\n\n🚀 **\`𝐏rêt à devenir une légende ? 𝐍ous, on espère juste que tu ne seras pas un gros noob.\`**`;

    const WelcomeEmbed = new EmbedBuilder()
      .setTitle("\`𝐎h! 𝐔ne nouvelle étoile s'est allumée!\` 🌠")
      .setColor("#b3c7ff")
      .setDescription(description)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setTimestamp()
      .setFooter({
        text: footerText,
        iconURL: member.user.displayAvatarURL({ dynamic: true, size: 512 }),
      });

    const welcomeChannel = bot.channels.cache.get(serverConfig.welcomeChannelID);
    if (welcomeChannel) {
      welcomeChannel.send({ embeds: [WelcomeEmbed] }).catch(() => {});
    }

    if (member.guild.id === TBMServerId) {
      const now = Date.now();
      const remindAt   = new Date(now + 1 * 60 * 60 * 1000);
      const deadlineAt = new Date(now + 3 * 24 * 60 * 60 * 1000);
      try {
        await ComplianceQueue.updateOne(
          { serverID: member.guild.id, userID: member.id },
          { $setOnInsert: {
              serverID: member.guild.id,
              userID: member.id,
              joinedAt: new Date(now),
              remindAt, deadlineAt, reminded: false
            }
          },
          { upsert: true }
        );
      } catch {}
    }
  },
};

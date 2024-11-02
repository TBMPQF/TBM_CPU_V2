const { EmbedBuilder } = require("discord.js");
const User = require("../models/experience");
const ServerConfig = require("../models/serverConfig");

module.exports = {
  name: "guildMemberAdd",
  async execute(member, bot) {
    const TBMServerId = "716810235985133568";
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
    let footerText = `${member.user.username} nouvelle recrue`;
    if (welcomeRole) {
      member.roles.add(welcomeRole);
      welcomeRoleNoName = welcomeRole.name;
      footerText = `${member.user.username} nouvelle recrue au rang de ${welcomeRoleNoName}`;
    }

    const existingUser = await User.findOne({
      userID: member.user.id,
      serverID: member.guild.id,
    });

    if (!existingUser) {
      const newUser = new User({
        userID: member.user.id,
        username: member.user.username,
        serverID: member.guild.id,
        serverName: member.guild.name,
        joinedAt: Date.now(),
      });

      try {
        await newUser.save();
      } catch (error) {
        console.error(error);
      }
    }

    const reglementChannel = member.guild.channels.cache.get(
      serverConfig.reglementChannelID
    );
    const rolesChannel = member.guild.channels.cache.get(
      serverConfig.roleChannelID    
    );

    let reglementChannelString = reglementChannel
      ? reglementChannel.toString()
      : "PAS DÉFINI";
    let rolesChannelString = rolesChannel
      ? rolesChannel.toString()
      : "PAS DÉFINI";

    let description = `Bienvenue <@${member.user.id}>, \nTu viens de rejoindre **${member.guild.name}**. \nPrend ton fusil et rend toi directement sur le champ de tir !`;

    if (reglementChannelString !== "PAS DÉFINI" && rolesChannelString !== "PAS DÉFINI") {
        description += `\nN'oublie pas de \`lire/valider\` le ${reglementChannelString} et de prendre tes rôles ${rolesChannelString}.`;
    } else {
        if (reglementChannelString !== "PAS DÉFINI") {
            description += `\nN'oublie pas de \`lire/valider\` le ${reglementChannelString}.`;
        }
        if (rolesChannelString !== "PAS DÉFINI") {
            description += `\nN'oublie pas de prendre tes rôles ${rolesChannelString}.`;
        }
    }

    const WelcomeEmbed = new EmbedBuilder()
      .setTitle(`\`Oh! Un nouveau membre\` :warning:`)
      .setColor("#b3c7ff")
      .setDescription(description)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setTimestamp()
      .setFooter({
        text: footerText,
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
    setTimeout(async () => {
      if (member.guild.id !== TBMServerId) {
        return;
      }
      try {
        const memberUpdated = await member.guild.members.fetch(member.id);
        const hasRole = memberUpdated.roles.cache.some(role => role.name === "――――丨🐦ゲーム🐦丨――――");
        const user = await User.findOne({ userID: member.id });
        if (!user.reminderSent && !hasRole) {
          await member.send("丨𝐒alutation camarade\n𝐉e ne veux pas te déranger très longtemps mais.. pour continuer l'aventure tu dois venir __accepter le règlement__ puis __prendres tes rôles__ pour avoir accès aux salons de discussions dédiés.\n 𝐌erci.");
    
          user.reminderSent = true;
          await user.save();
        }
      } catch (error) {
        console.error("[MP] Erreur lors de l'envoi du message privé :", error);
      }
    }, 3600000); 
    setTimeout(async () => {
      if (member.guild.id !== TBMServerId) {
        return;
      }
      try {
        const memberUpdated = await member.guild.members.fetch(member.id);
        const hasReglementRole = memberUpdated.roles.cache.some(role => role.name === "――――丨🐦ゲーム🐦丨――――");
        const gameRoles = ["Apex Legends", "Rocket League", "Sons Of the Forest", "Minecraft", "Call of Duty", "New World", "Discord JS"];
        const hasGameRole = gameRoles.some(gameRole => memberUpdated.roles.cache.some(role => role.name === gameRole));
        if (!hasReglementRole || !hasGameRole) {
          await memberUpdated.kick("丨𝐍'a pas pris le rôle de règlement et au moins un rôle de jeu après trois jours.");
        }
      } catch (error) {
        console.error("[MP] Erreur lors de la vérification des rôles :", error);
      }
    }, 3 * 24 * 60 * 60 * 1000);
  },
};

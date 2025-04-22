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
    let welcomeRoleNoName = "PAS DÉFINI";
    let footerText = `${member.user.username} nouvelle jeune étoile montante :)`;
    if (welcomeRole) {
      member.roles.add(welcomeRole);
      welcomeRoleNoName = welcomeRole.name;
      footerText = `${member.user.username} nouvelle jeune étoile montante (:`;
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
          description += `◟ 𝐕a dans ${rolesChannelString} et choisis un rôle... ou deux, personne ne t'arrêtera.`;
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
        const hasRole = memberUpdated.roles.cache.some(role => role.name === "‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ 丨🐦ゲーム🐦丨‎‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎ ‎ ‎ ‎");
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
        const hasReglementRole = memberUpdated.roles.cache.some(role => role.name === "‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ 丨🐦ゲーム🐦丨‎‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎ ‎ ‎ ‎");
        const gameRoles = ["Apex Legends", "Rocket League", "Palworld", "Minecraft", "Call of Duty", "New World", "Discord JS"];
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

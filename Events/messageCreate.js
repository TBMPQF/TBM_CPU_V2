const {
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonBuilder,
} = require("discord.js");
const User = require("../models/experience");
const levelUp = require("../models/levelUp");
const ServerConfig = require("../models/serverConfig");

const {
  logRequestMessageIds,
  welcomeRequestMessageIds,
  reglementRequestMessageIds,
  RolereglementRequestMessageIds,
  RoleWelcomeRequestMessageIds,
  implicationRequestMessageIds,
  dailyRequestMessageIds,
  suggestionsRequestMessageIds,
  roleChannelRequestMessageIds
} = require("../models/shared");

module.exports = {
  name: "messageCreate",
  async execute(message, bot) {
    if (message.author.bot) return;

    // Gestion réponse pour salon de LOG
    const serverId = message.guild.id;
    const serverName = message.guild.name;
    if (message.reference) {
      if (message.reference.messageId === logRequestMessageIds[serverId]) {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.first();
        } else {
          const id = message.content.replace(/<#(\d+)>/, "$1");
          channel = message.guild.channels.cache.get(id);
        }
        if (channel) {
          await ServerConfig.findOneAndUpdate(
            { serverID: serverId },
            {
              serverName: serverName,
              logChannelName: channel.name,
              logChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon de 𝐋og sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de donné soit le nom exact, soit l'ID (en faisant un clique droit -> Copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }
    // Gestion réponse pour salon du WELCOME
    if (message.reference) {
      if (message.reference.messageId === welcomeRequestMessageIds[serverId]) {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.first();
        } else {
          const id = message.content.replace(/<#(\d+)>/, "$1");
          channel = message.guild.channels.cache.get(id);
        }
        if (channel) {
          await ServerConfig.findOneAndUpdate(
            { serverID: serverId },
            {
              serverName: serverName,
              welcomeChannelName: channel.name,
              welcomeChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon de 𝐁ienvenue sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de donné soit le nom exact, soit l'ID (en faisant un clique droit -> Copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }
    // Gestion réponse pour le salon du REGLEMENT
    if (message.reference) {
      if (
        message.reference.messageId === reglementRequestMessageIds[serverId]
      ) {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.first();
        } else {
          const id = message.content.replace(/<#(\d+)>/, "$1");
          channel = message.guild.channels.cache.get(id);
        }
        if (channel) {
          await ServerConfig.findOneAndUpdate(
            { serverID: serverId },
            {
              serverName: serverName,
              reglementChannelName: channel.name,
              reglementChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon de 𝐑èglement sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de donné soit le nom exact, soit l'ID (en faisant un clique droit -> Copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }
    // Gestion pour modifié le rôle du REGLEMENT
    let role;
    if (message.mentions.roles.size > 0) {
      role = message.mentions.roles.first();
    }
    if (
      message.reference &&
      message.reference.messageId === RolereglementRequestMessageIds[serverId]
    ) {
      if (role) {
        await ServerConfig.findOneAndUpdate(
          { serverID: serverId },
          {
            roleReglementID: role.id,
            roleReglementName: role.name,
          },
          { upsert: true }
        );
        await message.reply(
          `Le rôle de 𝐑èglement sera désormais \`${role.name}\``
        );
      } else {
        await message.reply(
          `Rôle invalide! Merci de **répondre** en faisant un tag (@votre_rôle) pour donner le rôle lorsque votre utilisateur validera le \`𝐑èglement\`.`
        );
      }
    }
    // Gestion pour modifier le rôle de bienvenue
    let welcomeRole;
    if (message.mentions.roles.size > 0) {
      welcomeRole = message.mentions.roles.first();
    }
    if (
      message.reference &&
      message.reference.messageId === RoleWelcomeRequestMessageIds[serverId]
    ) {
      if (welcomeRole) {
        await ServerConfig.findOneAndUpdate(
          { serverID: serverId },
          {
            roleWelcomeID: welcomeRole.id,
            roleWelcomeName: welcomeRole.name,
          },
          { upsert: true }
        );
        await message.reply(
          `Le rôle de bienvenue sera désormais \`${welcomeRole.name}\``
        );
      } else {
        await message.reply(
          `Rôle invalide! Merci de **répondre** en faisant un tag (@votre_rôle) pour donner le rôle lorsque votre utilisateur arrivera sur votre serveur.`
        );
      }
    }
    // Gestion pour le salon d'implication
    if (message.reference) {
      if (
        message.reference.messageId === implicationRequestMessageIds[serverId]
      ) {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.first();
        } else {
          const id = message.content.replace(/<#(\d+)>/, "$1");
          channel = message.guild.channels.cache.get(id);
        }
        if (channel) {
          await ServerConfig.findOneAndUpdate(
            { serverID: serverId },
            {
              serverName: serverName,
              implicationsChannelName: channel.name,
              implicationsChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon d'𝐈mplication sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de **répondre** soit le nom __exact__, soit l'ID (en faisant un clique droit -> copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }
    // Gestion pour le salon du daily
    if (message.reference) {
      if (message.reference.messageId === dailyRequestMessageIds[serverId]) {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.first();
        } else {
          const id = message.content.replace(/<#(\d+)>/, "$1");
          channel = message.guild.channels.cache.get(id);
        }
        if (channel) {
          await ServerConfig.findOneAndUpdate(
            { serverID: serverId },
            {
              serverName: serverName,
              dailyChannelName: channel.name,
              dailyChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon du 𝐃aily sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de **répondre** soit le nom __exact__, soit l'ID (en faisant un clique droit -> copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }
    // Gestion pour le salon des suggestions
    if (message.reference) {
      if (
        message.reference.messageId === suggestionsRequestMessageIds[serverId]
      ) {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.first();
        } else {
          const id = message.content.replace(/<#(\d+)>/, "$1");
          channel = message.guild.channels.cache.get(id);
        }
        if (channel) {
          await ServerConfig.findOneAndUpdate(
            { serverID: serverId },
            {
              serverName: serverName,
              suggestionsChannelName: channel.name,
              suggestionsChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon des 𝐒uggestions sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de **répondre** soit le nom __exact__, soit l'ID (en faisant un clique droit -> copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }
    // Gestion pour le salon des roles
    if (message.reference) {
      if (
        message.reference.messageId === roleChannelRequestMessageIds[serverId]
      ) {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.first();
        } else {
          const id = message.content.replace(/<#(\d+)>/, "$1");
          channel = message.guild.channels.cache.get(id);
        }
        if (channel) {
          await ServerConfig.findOneAndUpdate(
            { serverID: serverId },
            {
              serverName: serverName,
              roleChannelName: channel.name,
              roleChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon des 𝐑oles sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de **répondre** soit le nom __exact__, soit l'ID (en faisant un clique droit -> copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }

    //Experience pour chaque message
    const now = new Date();
    const userData = {
      userID: message.author.id,
      username: message.author.username,
      serverID: message.guild.id,
      serverName: message.guild.name,
      lastMessageDate: now,
    };
    let user = await User.findOne({
      userID: message.author.id,
      serverID: message.guild.id,
    });
    if (!user) {
      user = new User(userData);
    } else {
      if (message.guild.name !== user.serverName) {
        user.serverName = message.guild.name;
      }
    }

    const lastMessageDate = user.lastMessageDate || now;
    const timeDifference = (now.getTime() - lastMessageDate.getTime()) / 1000;

    user.messageCount = (user.messageCount || 0) + 1;

    if (timeDifference >= 10) {
      const randomXP = Math.floor(Math.random() * 50) + 1;
      user.xp = (user.xp || 0) + randomXP;

      await levelUp(message, user, user.xp);
    } else {
      user.lastMessageDate = now;
      await user.save();
    }

    user.lastMessageDate = now;

    await user.save();

    //Gestion des suggestions
    const serverConfig = await ServerConfig.findOne({
      serverID: message.guild.id,
    });
    if (!serverConfig || !serverConfig.suggestionsChannelID) {
      return;
    }

    if (message.channel.id !== serverConfig.suggestionsChannelID) {
      return;
    }

    let suggEmbed = new EmbedBuilder()
      .setColor("DarkVividPink")
      .setTitle("丨𝐒uggestion")
      .setDescription(`${message.content}`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields([
        {
          name: "𝐏roposé par :",
          value: message.author ? message.author.toString() : "Auteur inconnu",
          inline: true,
        },
        { name: "𝐏our", value: "0", inline: true },
        { name: "𝐂ontre", value: "0", inline: true },
      ]);

    const buttonY = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("ACCEPTSUGG")
          .setEmoji("✔️")
          .setStyle(ButtonStyle.Success)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("NOPSUGG")
          .setEmoji("✖️")
          .setStyle(ButtonStyle.Danger)
      );

    bot.channels.cache
      .get(serverConfig.suggestionsChannelID)
      .send({ embeds: [suggEmbed], components: [buttonY] })
      .then((msg) => {
        msg.startThread({ name: `𝐒uggestion de ${message.author.username}` });
      });

    await message.delete();
  },
};

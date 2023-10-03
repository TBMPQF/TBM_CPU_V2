const {
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonBuilder,
} = require("discord.js");
const User = require("../models/experience");
const levelUp = require("../models/levelUp");
const ServerConfig = require("../models/serverConfig");
const yts = require("yt-search");
const { queue } = require("../models/queue");
const Music = require("../models/music");
const { filterMessage } = require('../automod');

const {
  logRequestMessageIds,
  welcomeRequestMessageIds,
  reglementRequestMessageIds,
  RolereglementRequestMessageIds,
  RoleWelcomeRequestMessageIds,
  implicationRequestMessageIds,
  dailyRequestMessageIds,
  suggestionsRequestMessageIds,
  roleChannelRequestMessageIds,
  ticketRequestMessageIds,
  RoleAdminRequestMessageIds,
} = require("../models/shared");

module.exports = {
  name: "messageCreate",
  async execute(message, bot) {
    if (message.author.bot) return;
    filterMessage(message);

    //Gestion des messages pour la musique dans le salon musique
    if (message.channel.id === "1136327173343559810") {
      const { videos } = await yts.search(message.content);
      if (videos.length == 0) {
        const noResultEmbed = new EmbedBuilder()
          .setColor("Purple")
          .setDescription("Aucun résultat trouvé");
        return message.channel.send({ embeds: [noResultEmbed] }).then((msg) => {
          setTimeout(() => msg.delete(), 5000);
        });
      }

      const songUrl = videos[0].url;

      const serverId2 = message.guild.id;
      if (!queue[serverId2]) {
        queue[serverId2] = [];
      }
      queue[serverId2].push({
        url: songUrl,
        title: videos[0].title,
      });

      const musicEntry = await Music.findOne({ serverId: serverId2 });

      let messageEntry;

      if (musicEntry && musicEntry.messageId) {
        messageEntry = await message.channel.messages.fetch(
          musicEntry.messageId
        );
      }

      const songAddedEmbed = new EmbedBuilder()
        .setColor("Purple")
        .setDescription(
          `"${videos[0].title}" a été ajouté à la liste de lecture.`
        );

      if (messageEntry) {
        const oldEmbed = messageEntry.embeds[0];

        let playlistText = "";
        for (let i = 0; i < queue[serverId2].length; i++) {
          let title = queue[serverId2][i].title;
          title = title.replace(/ *\([^)]*\) */g, "");
          title = title.replace(/ *\[[^\]]*] */g, "");

          if (i === 0) {
            playlistText += `\`${i + 1}\`丨**${title}**\n`;
          } else {
            playlistText += `\`${i + 1}\`丨${title}\n`;
          }
        }

        // Create a new embed
        const newEmbed = new EmbedBuilder()
          .setColor("Purple")
          .setTitle(`――――――――∈ \`MUSIQUE\` ∋――――――――`)
          .setThumbnail(
            "https://montessorimaispasque.com/wp-content/uploads/2018/02/colorful-musical-notes-png-4611381609.png"
          )
          .setDescription(playlistText)
          .setFooter({
            text: `Cordialement, l'équipe ${message.guild.name}`,
            iconURL: message.guild.iconURL(),
          });

        await messageEntry.edit({ embeds: [newEmbed] });
      } else {
        messageEntry = await message.channel.send({ embeds: [songAddedEmbed] });

        if (musicEntry) {
          musicEntry.messageId = messageEntry.id;
          await musicEntry.save();
        } else {
          await Music.create({
            serverId: serverId2,
            messageId: messageEntry.id,
          });
        }
      }

      message.delete();
    }

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
    // Gestion du salon pour les tickets
    if (message.reference) {
      if (message.reference.messageId === ticketRequestMessageIds[serverId]) {
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
              ticketChannelName: channel.name,
              ticketChannelID: channel.id,
            },
            { upsert: true }
          );
          await message.reply(
            `Le salon des 𝐓ickets sera désormais \`${channel.name}\``
          );
        } else {
          await message.reply(
            `Invalide salon ! Merci de **répondre** soit le nom __exact__, soit l'ID (en faisant un clique droit -> copier l'identifiant du salon) ou de faire un tag (#votre_salon).`
          );
        }
      }
    }
    // Gestion pour modifier le rôle d'administrateur pour les tickets
    let adminRole;
    if (message.mentions.roles.size > 0) {
      adminRole = message.mentions.roles.first();
    }
    if (
      message.reference &&
      message.reference.messageId === RoleAdminRequestMessageIds[serverId]
    ) {
      if (adminRole) {
        await ServerConfig.findOneAndUpdate(
          { serverID: serverId },
          {
            ticketAdminRoleID: adminRole.id,
            ticketAdminRoleName: adminRole.name,
          },
          { upsert: true }
        );
        await message.reply(
          `Le rôle d'administrateur sera désormais \`${adminRole.name}\``
        );
      } else {
        await message.reply(
          `Rôle invalide! Merci de **répondre** en faisant un tag (@votre_rôle) pour donner le rôle d'administration de votre serveur.`
        );
      }
    }

    // Expérience pour chaque message
const now = new Date();

const userData = {
  userID: message.author.id,
  username: message.author.username,
  serverID: message.guild.id,
  serverName: message.guild.name,
  lastMessageDate: now,
};

const member = message.guild.members.cache.get(message.author.id);
const rolesToCheck = {
  "✨丨𝐄lite 𝐒ecrète": 1.05,
  "🧪丨Twitch Sub T1": 1.1,
  "🧪丨Twitch Sub T2": 1.2,
  "🧪丨Twitch Sub T3": 1.3,
};

let rolePercentage = 1;
let weekendPercentage = 1;

for (const role of Array.from(member.roles.cache.values())) {
  if (rolesToCheck[role.name]) {
    rolePercentage *= rolesToCheck[role.name];
  }
}

const dayOfWeek = now.getDay();
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
if (isWeekend) {
  weekendPercentage = 1.1;
}

let user = await User.findOne({
  userID: message.author.id,
  serverID: message.guild.id,
});

if (!user) {
  user = new User(userData);
  
  let initialXP = Math.floor(Math.random() * 50) + 1;
  initialXP *= rolePercentage;
  initialXP *= weekendPercentage;
  initialXP = Math.round(initialXP);
  user.xp = initialXP;
  
  await levelUp(message, user, user.xp);
} else {
  if (message.guild.name !== user.serverName) {
    user.serverName = message.guild.name;
  }
}

const lastMessageDate = user.lastMessageDate || now;
const timeDifference = (now.getTime() - lastMessageDate.getTime()) / 1000;

user.messageCount = (user.messageCount || 0) + 1;

if (timeDifference >= 10) {
  let randomXP = Math.floor(Math.random() * 50) + 1;
  randomXP *= rolePercentage;
  randomXP *= weekendPercentage;

  randomXP = Math.round(randomXP);
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
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("SUPPSUGG")
          .setEmoji("♻")
          .setStyle(ButtonStyle.Secondary)
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

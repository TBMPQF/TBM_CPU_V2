const { ActivityType, EmbedBuilder } = require("discord.js");
const Discord = require("discord.js");
const loadSlashCommands = require("../handlers/loaders/loadSlashCommands");
const fetch = require("node-fetch");
const config = require("../config.json");
const ServerConfig = require("../models/serverConfig");
const ServerRole = require("../models/serverRole");
const User = require("../models/experience");
const MINECRAFT_SERVER_DOMAIN = config.serveurMinecraftDOMAIN;
const MINECRAFT_SERVER_PORT = config.serveurMinecraftPORT;
const CHANNEL_NAME = "👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒";

module.exports = {
  name: "ready",
  execute(bot, member) {
    console.log(
      "\x1b[33m" + `${bot.user.username} connecté !\n` + "\x1b[33m" + ``
    );

    loadSlashCommands(bot);

    setInterval(async () => {
      const server = bot.guilds.cache.first();
      updateVoiceChannel(server);
    }, 60000);

    // Message lors de la suppression du bot d'un serveur
    bot.on("guildDelete", async (guild) => {
      try {
        await ServerRole.deleteMany({ serverID: guild.id });
        await ServerConfig.deleteMany({ serverID: guild.id });
        await User.deleteMany({ serverID: guild.id });
      } catch (error) {
        console.error(
          "Erreur lors de la suppression de la configuration du serveur :",
          error
        );
      }
    });

    // Message lors d'un ajout du bot sur un nouveau serveur
    bot.on("guildCreate", async (guild) => {
      try {
        const owner = await guild.fetchOwner();

        const serverConfig = new ServerConfig({
          serverID: guild.id,
          serverName: guild.name,
          roleChannelID: null,
          roleChannelName: null,
          logChannelID: null,
          logChannelName: null,
          reglementChannelID: null,
          reglementChannelName: null,
          dailyChannelID: null,
          dailyChannelName: null,
          welcomeChannelID: null,
          welcomeChannelName: null,
          roleWelcomeID: null,
          roleWelcomeName: null,
          implicationsChannelID: null,
          implicationsChannelName: null,
          suggestionsChannelID: null,
          suggestionsChannelName: null,
          ticketChannelID: null,
          ticketChannelName: null,
          roleReglementID: null,
          roleReglementName: null,
          ticketAdminRoleID: null,
          ticketAdminRoleName: null,
        });
        await serverConfig.save();

        const embed = new EmbedBuilder()
          .setTitle(`\`Hey! Un grand MERCI\` 🙏`)
          .setColor("#ffc394")
          .setDescription(
            `Pour commencer à utiliser toutes mes fonctionnalités, tu peux à présent me configurer en utilisant la commande \`/setConfig\` si tu es administrateur du serveur (au minimum).\n\`N'oublie pas de me mettre tout en haut de ta liste de rôle ainsi qu'administrateur du serveur.\``
          )
          .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
          .setTimestamp()
          .setFooter({
            text: `丨`,
            iconURL: `${member.user.displayAvatarURL({
              dynamic: true,
              size: 512,
            })}`,
          });

        owner.send({ embeds: [embed] });
      } catch (error) {
        console.error(
          "Erreur lors de l'envoi du message au propriétaire du serveur :",
          error
        );
      }
    });

    // Message de connexion du bot
    bot.guilds.cache.forEach((server) => {
      ServerConfig.findOne({ serverID: server.id })
        .then((serverConfig) => {
          if (serverConfig) {
            const logChannelID = serverConfig.logChannelID;
            const logChannel = bot.channels.cache.get(logChannelID);

            if (logChannel && logChannel instanceof Discord.TextChannel) {
              logChannel.messages.fetch({ limit: 100 }).then((messages) => {
                const connectMessages = messages.filter(
                  (msg) =>
                    msg.author.id === bot.user.id &&
                    msg.embeds.length > 0 &&
                    msg.embeds[0].description ===
                      "**Je viens tout juste de me connecter. :warning:**"
                );

                if (connectMessages.size > 0) {
                  logChannel.bulkDelete(connectMessages).then(() => {
                    const ConnectOK = new EmbedBuilder()
                      .setDescription(
                        "**Je viens tout juste de me connecter. :warning:**"
                      )
                      .setColor("White")
                      .setTimestamp();
                    logChannel.send({ embeds: [ConnectOK] });
                  });
                } else {
                  const ConnectOK = new EmbedBuilder()
                    .setDescription(
                      "**Je viens tout juste de me connecter. :warning:**"
                    )
                    .setColor("White")
                    .setTimestamp();
                  logChannel.send({ embeds: [ConnectOK] });
                }
              });
            }
          }
        })
        .catch((error) => {
          console.error(
            "Erreur lors de la récupération du salon de journalisation depuis la base de données :",
            error
          );
        });
    });

    // Interval de messages pour le Daily.
    const channelDaily = bot.channels.cache.get("818640158693392405");
    setInterval(() => {
      const DailyInterval = new EmbedBuilder()
        .setDescription(`@here. N'oubliez pas de récupérer votre \`Daily\` ! `)
        .setColor("Red")
        .setFooter({
          text: `丨`,
          iconURL: `${member.user.displayAvatarURL({
            dynamic: true,
            size: 512,
          })}`,
        })
        .setTimestamp();
      channelDaily.send({ embeds: [DailyInterval] });
    }, 43201000);

    const channelId = "818640158693392405";
    const messageIdToKeep = "1087445497742114896";
    setInterval(async () => {
      const channel = await bot.channels.fetch(channelId);
      const messages = await channel.messages.fetch({ limit: 1 });
      messages.forEach(async (msg) => {
        if (msg.id !== messageIdToKeep) {
          await msg.delete();
        }
      });
    }, 43200000);

    // Activité du bot
    const activities = [
      { name: "Apex Legends", type: ActivityType.Playing },
      { name: ``, type: ActivityType.Listening },
    ];

    let i = 0;
    setInterval(() => {
      let activity = activities[i];

      if (activity.type === ActivityType.Listening) {
        activity.name = `丨${bot.guilds.cache.size}丨 𝐒erveurs`;
      }

      bot.user.setPresence({
        activities: [activity],
        status: "dnd",
      });

      if (i === activities.length - 1) i = 0;
      else i++;
    }, 2 * 60 * 1000);
  },
};

// Mise a jour du nombre de joueurs sur le serveur Minecraft
async function updateVoiceChannel(server) {
  try {
    let channel = server.channels.cache.find((channel) =>
      channel.name.startsWith("👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒")
    );

    if (!channel) {
      channel = await server.channels.create(CHANNEL_NAME, {
        type: "GUILD_VOICE",
        permissionOverwrites: [
          {
            id: server.id,
            deny: ["VIEW_CHANNEL"],
          },
        ],
      });
    }

    fetch(`https://api.mcsrvstat.us/2/${MINECRAFT_SERVER_DOMAIN}`)
      .then((response) => {
        if (response.headers.get("content-type") === "application/json") {
          return response.json();
        } else {
          throw new Error("Invalide JSON réponse");
        }
      })
      .then((data) => {
        if (data.online) {
          channel.setName(
            `👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒 ${data.players.online} / ${data.players.max}`
          );
        } else {
          channel.setName(`👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒`);
        }
      })
      .catch((error) => {
        console.error(error);
        channel.setName(`👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒`);
      });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du salon vocal:", error);
  }
}

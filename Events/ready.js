const { ActivityType, EmbedBuilder } = require("discord.js");
const Discord = require("discord.js");
const loadSlashCommands = require("../handlers/loaders/loadSlashCommands");
const fetch = require("node-fetch");
const config = require("../config.json");
const ServerConfig = require("../models/serverConfig");
const ServerRole = require("../models/serverRole");
const User = require("../models/experience");
const MINECRAFT_SERVER_DOMAIN = config.serveurMinecraftDOMAIN;
const CHANNEL_NAME = "👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒";
const Music = require("../models/music")
const queue = require('../models/queue')

module.exports = {
  name: "ready",
  execute(bot, member) {

    // Réinitialise le message de playlist pour la musique
    const serverId = '716810235985133568';
    const channelMusicId = '1136327173343559810';
    Music.findOne({ serverId: serverId })
    .then((musicEntry) => {
      if (musicEntry && musicEntry.messageId) {
        const channel = bot.channels.cache.get(channelMusicId);
        if (!channel) return console.error('Channel not found!');
        
        channel.messages.fetch(musicEntry.messageId)
        .then((message) => {
          if(queue[serverId]) queue[serverId] = [];
          
          const newEmbed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle(`――――――――∈ \`MUSIQUE\` ∋――――――――`)
            .setThumbnail("https://montessorimaispasque.com/wp-content/uploads/2018/02/colorful-musical-notes-png-4611381609.png")
            .setDescription("**丨𝐋a playlist est vide pour le moment丨**")
            .setFooter({
              text: `Cordialement, l'équipe ${bot.guilds.cache.get(serverId).name}`,
              iconURL: bot.guilds.cache.get(serverId).iconURL(),
            });
          message.edit({ embeds: [newEmbed] });
        })
        .catch((error) => {
          console.error(`Le message rechercher est introuvable : ${error}`);
        });
      }
    })
    .catch((error) => {
      console.error(`Failed to fetch music entry: ${error}`);
    });

    //Donne l'heure exact lors du démarrage dans la console
    function formatTwoDigits(num) {
      return num < 10 ? `0${num}` : num.toString();
    }
    const date = new Date();
    const jour = formatTwoDigits(date.getDate());
    const mois = formatTwoDigits(date.getMonth() + 1);
    const annee = date.getFullYear();
    const heures = formatTwoDigits(date.getHours());
    const minutes = formatTwoDigits(date.getMinutes());
    const dateHeureFrancaise = `${jour}/${mois}/${annee} à ${heures}:${minutes}`;

    console.log(
      "\x1b[33m" +
        `${bot.user.username} connecté le ` +
        "\x1b[33m" +
        `${dateHeureFrancaise}\n`
    );

    loadSlashCommands(bot);

    //Interval pour mettre a jour le salon vocal Minecraft
    setInterval(async () => {
      const server = bot.guilds.cache.first();
      checkMultipleStreamers(bot);
      updateVoiceChannelMinecraft(server);
    }, 60000);
    //Interval pour mettre a jour le salon vocal membre connecté
    setInterval(async () => {
      const server = bot.guilds.cache.first();
      updateVoiceChannelServer(server);
    }, 300000);

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
async function updateVoiceChannelMinecraft(server) {
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

// Mise à jour du nombre de personnes connectées sur le serveur
async function updateVoiceChannelServer(server) {
  let channel;
  try {
    // Mettre à jour le cache des membres
    await server.members.fetch();

    channel = server.channels.cache.find((channel) => 
      channel.name.startsWith("丨𝐎n𝐋ine")
    );

    if (!channel) {
      channel = await server.channels.create("丨𝐎n𝐋ine", {
        type: "GUILD_VOICE",
        permissionOverwrites: [
          {
            id: server.id,
            deny: ["VIEW_CHANNEL"],
          },
        ],
      });
    }

    const filteredMembers = server.members.cache.filter(member => 
      ['online', 'dnd', 'idle'].includes(member.presence?.status) && !member.user.bot
    );

    const onlineMembers = filteredMembers.size;
    const memberCount = server.members.cache.filter(member => !member.user.bot).size;

    channel.setName(`丨𝐎n𝐋ine ${onlineMembers} / ${memberCount}`)
      .catch(error => {
        console.error("Erreur lors de la mise à jour du nom du canal:", error);
      });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du salon vocal:", error);
    if (channel) {
      channel.setName(`丨𝐎n𝐋ine`).catch(err => console.error("Impossible de réinitialiser le nom du canal:", err));
    }
  }
}

// Envoie d'un message lorsqu'un streamer est en ligne
const axios = require('axios');
const clientId = config.twitch.clientId;
const clientSecret = config.twitch.clientSecret;

async function getTwitchAccessToken(clientId, clientSecret) {
  try {
    const response = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`);
    return response.data.access_token;
  } catch (error) {
    console.error('Erreur lors de la récupération du token Twitch :', error);
    return null;
  }
}

let twitchHeaders;

const streamers = {
  'Cyqop': false,
  'Kaystorms': false,
  'Navator_': false,
  'MikixFr': false,
};

const roleId = '813793302162702426';  
const discordUsernames = {
  'Kaystorms': 'kaystorms',
  'Navator_': 'navator_',
  'MikixFr': 'mikixfr',
};

(async () => {
  const accessToken = await getTwitchAccessToken(clientId, clientSecret);
  if (accessToken) {
    twitchHeaders = {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    };
  } else {
    console.error("Token d'accès non obtenu. Vérifiez vos identifiants.");
  }
})();

async function getUserProfilePic(streamer) {
  try {
    const response = await axios.get(`https://api.twitch.tv/helix/users?login=${streamer}`, twitchHeaders);
    return response.data.data[0].profile_image_url;
  } catch (error) {
    console.error(`Erreur lors de la récupération du profil Twitch : ${error}`);
    return null;
  }
}

async function getGameName(gameId, twitchHeaders) {
  try {
    const response = await axios.get(`https://api.twitch.tv/helix/games?id=${gameId}`, twitchHeaders);
    const gameData = response.data.data[0];
    return gameData.name;
  } catch (error) {
    console.error('Erreur lors de la récupération du nom du jeu :', error);
    return null;
  }
}

async function checkMultipleStreamers(bot) {
  for (const [streamer, isLive] of Object.entries(streamers)) {
    try {
      const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${streamer}`, twitchHeaders);
      const streamData = response.data.data[0];
      const channel = bot.channels.cache.get('812530008823955506');
      const discordUsername = discordUsernames[streamer];
      const guild = bot.guilds.cache.get('716810235985133568');
      const member = guild.members.cache.find(member => member.user.username === discordUsername);

      if (streamData && !isLive) {
        const streamTitle = streamData.title;
        const gameName = await getGameName(streamData.game_id, twitchHeaders);
        const profilePic = await getUserProfilePic(streamer);
        await member.roles.add(roleId);
        const liveEmbed = new EmbedBuilder()
          .setColor('#9146FF')
          .setTitle(`${streamer} est maintenant en 𝐋ive sur 𝐓𝐖𝐈𝐓𝐂𝐇 !`)
          .setURL(`https://www.twitch.tv/${streamer}`)
          .setDescription(`**${streamTitle}**\n丨${gameName}\n\n@here, 𝐕enez lui donner de la force.`)
          .setThumbnail(profilePic)
          .setTimestamp();

        await channel.send({ embeds: [liveEmbed] });
        streamers[streamer] = true;
      } else if (!streamData && isLive) {
        await member.roles.remove(roleId);
        const offlineEmbed = new EmbedBuilder()
          .setColor('#9146FF')
          .setTitle(`${streamer} est malheureusement 𝐇ors 𝐋igne.. :x:`)
          .setDescription(`丨${gameName}\n\nMais il revient prochainement pour de nouvelles aventures !`)
          .setURL(`https://www.twitch.tv/${streamer}`)
          .setTimestamp();
        
        await channel.send({ embeds: [offlineEmbed] });
        streamers[streamer] = false;
      }
    } catch (error) {
      console.error(`Error fetching Twitch API: ${error}`);
    }
  }
}
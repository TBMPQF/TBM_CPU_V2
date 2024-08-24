const { ActivityType, EmbedBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const Discord = require("discord.js");
const loadSlashCommands = require("../handlers/loaders/loadSlashCommands");
const fetch = require("node-fetch");
const config = require("../config.json");
const ServerConfig = require("../models/serverConfig");
const ServerRole = require("../models/serverRole");
const User = require("../models/experience");
const MINECRAFT_SERVER_DOMAIN = config.serveurMinecraftDOMAIN;
const Music = require("../models/music")
const SearchMateMessage = require('../models/searchMate');
const userChannels = require('../models/userChannels');
const VocalChannel = require('../models/vocalGames');
const ApexStreamer = require('../models/Streamers');
const InVocal = require("../models/inVocal")
const { voiceUsers, initializeXpDistributionInterval } = require('../models/shared');
const moment = require('moment-timezone');
const { verifierEtLancerJeuxBingo } = require('../bingoFunctions');
const fs = require('fs');

module.exports = {
  name: "ready",
  async execute(bot, member) {
    //Log de portainer en fichier .txt
    const CHANNEL_ID = '1272586896920285365';
    const logFilePath = 'logs/error.log';

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const timestamp = `${day}-${month}-${year}_${hours}h${minute}min${seconds}s`;
    const filteredLogFilePath = `Error_Scan_${timestamp}.js`;

    async function sendLogs() {
      try {
        if (fs.existsSync(logFilePath)) {
          const logContent = fs.readFileSync(logFilePath, 'utf-8');
          if (logContent.trim().length === 0) {
            return; 
          }
          fs.writeFileSync(filteredLogFilePath, logContent);

          const channel = await bot.channels.fetch(CHANNEL_ID);
          if (channel) {
            await channel.send({
              files: [filteredLogFilePath],
            });
          }

          fs.unlinkSync(filteredLogFilePath);
        } else {
          console.error(`Le fichier de logs n'a pas été trouvé à l'emplacement : ${logFilePath}`);
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi des logs:', error);
      }
    }

    await sendLogs();

    // Lancer le Bingo
    verifierEtLancerJeuxBingo(bot);

    // Vérification des membres et serveurs + ajout dans la BDD si besoin
    await initializeServersAndUsers(bot);
    async function initializeServersAndUsers(bot) {
      bot.guilds.cache.forEach(async (guild) => {
        let serverConfig = await ServerConfig.findOne({ serverID: guild.id });
        if (!serverConfig) {
          serverConfig = new ServerConfig({
            serverID: guild.id,
            serverName: guild.name,
          });
          await serverConfig.save();
        }
    
        guild.members.cache.forEach(async (member) => {
          if (!member.user.bot) {
            let user = await User.findOne({ userID: member.id, serverID: guild.id });
            if (!user) {
              user = new User({
                userID: member.id,
                username: member.user.tag,
                serverID: guild.id,
                serverName: guild.name,
                joinedAt: member.joinedAt,
              });
              await user.save();
            }
          }
        });
      });
    }

    const serverId = '716810235985133568';
    
    //Si un membre est dans un vocal, l'enregistrer pour qu'il gagne a nouveau l'xp et calcul du temps en vocal
    bot.guilds.cache.forEach(async guild => {
      await guild.members.fetch();
      guild.channels.cache.forEach(channel => {
        if (channel.type === ChannelType.GuildVoice) {
          channel.members.forEach(async member => {
            const isMemberRegistered = await InVocal.findOne({ discordId: member.id, serverId: guild.id });
            if (!member.user.bot && !isMemberRegistered) {
              const newInVocal = new InVocal({
                discordId: member.id,
                serverId: guild.id,
                username: member.user.tag,
                vocalName: channel.name,
                joinTimestamp: moment().tz("Europe/Paris").toDate()
              });
              await newInVocal.save();
              voiceUsers.set(member.id, { joinTimestamp: Date.now(), serverId: guild.id });
            }
          });
        }
      });
    });

    try {
      const inVocalEntries = await InVocal.find({});
      inVocalEntries.forEach(async entry => {
        if (bot.guilds.cache.has(entry.serverId)) {
          const guild = bot.guilds.cache.get(entry.serverId);
          const member = guild.members.cache.get(entry.discordId);
          const joinTimestamp = moment().tz("Europe/Paris").toDate();
          
          if (member && member.voice.channel) {
            voiceUsers.set(member.id, { joinTimestamp: joinTimestamp, serverId: guild.id });
          } else {
            await InVocal.deleteOne({ discordId: entry.discordId, serverId: entry.serverId });
          }
        }
      });

      initializeXpDistributionInterval(bot);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs en vocal:', error);
    }

    // Envoie d'un message lorsqu'un streamer est en ligne
    const axios = require('axios');
    const { clientId, clientSecret } = config.twitch;
    const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
    const TWITCH_BASE_API = 'https://api.twitch.tv/helix';
    const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
    const roleId = '813793302162702426';
    let twitchHeaders;
    let streamers = {};
    async function getTwitchAccessToken() {
      try {
        const response = await axios.post(`${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`);
        return response.data.access_token;
      } catch (error) {
        console.error('[TWITCH] Erreur lors de la récupération du token Twitch :', error);
        return null;
      }
    }
    async function initializeTwitchHeaders() {
      const accessToken = await getTwitchAccessToken();
      if (accessToken) {
        twitchHeaders = {
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
          }
        };
      } else {
        console.error("[TWITCH] Token d'accès non obtenu. Vérifiez vos identifiants.");
      }
    }
    async function fetchFromTwitch(endpoint, params = {}) {
      try {
        const url = new URL(`${TWITCH_BASE_API}/${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        return await axios.get(url.toString(), twitchHeaders);
      } catch (error) {
        console.error(`[TWITCH] Erreur lors de la récupération de ${endpoint} : ${error}`);
        return null;
      }
    }
    async function initializeStreamers() {
      const streamersFromDB = await ApexStreamer.find();
      streamersFromDB.forEach(streamer => {
          streamers[streamer.twitchUsername] = {
              isLive: streamer.isLive,
              lastMessageId: streamer.lastMessageId,
              startedAt: streamer.startedAt || null
          };
      });
  }
    async function getUserProfilePic(streamer) {
      const response = await fetchFromTwitch('users', { login: streamer });
      return response?.data.data[0].profile_image_url;
    }
    async function getLiveStreamThumbnailByUsername(username) {
      await initializeTwitchHeaders();
      const userId = await getUserID(username);
      if (!userId) {
        console.error(`Impossible de récupérer l'ID pour l'utilisateur ${username}`);
        return null;
      }
      try {
        const response = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${userId}`, twitchHeaders);
        const streams = response.data.data;
        if (streams.length > 0) {
          const streamInfo = streams[0];
          const thumbnailUrl = streamInfo.thumbnail_url
            .replace('{width}', '640').replace('{height}', '360').concat(`?timestamp=${new Date().getTime()}`);
          return thumbnailUrl;
        } else {
          return '';
        }
      } catch (error) {
        console.error('Erreur lors de la requête à l’API Twitch:', error);
        throw error;
      }
    }
    async function getUserID(username) {
      await initializeTwitchHeaders();
      const endpoint = 'users';
      const params = { login: username };
      
      const response = await fetchFromTwitch(endpoint, params);
      if (response && response.data.data.length > 0) {
        return response.data.data[0].id;
      } else {
        return null;
      }
    }
    async function getGameName(gameId) {
      try {
        const response = await fetchFromTwitch('games', { id: gameId });
        if (response && response.data && response.data.data && response.data.data.length > 0 && response.data.data[0].name) {
          return response.data.data[0].name;
        } else {
          console.error(`[TWITCH] Aucun nom de jeu trouvé pour l'ID ${gameId}`);
          return "Nom de jeu inconnu";
        }
      } catch (error) {
        console.error(`[TWITCH] Erreur lors de la récupération du nom du jeu pour l'ID ${gameId} : ${error}`);
        return "Nom de jeu inconnu";
      }
    }
    async function getGameThumbnailUrl(gameId) {
      try {
        const response = await fetchFromTwitch('games', { id: gameId });
        if (response && response.data && response.data.data && response.data.data.length > 0) {
          return response.data.data[0].box_art_url.replace('{width}', '285').replace('{height}', '380');
        } else {
          console.error(`[TWITCH] Aucune image trouvée pour le jeu ID ${gameId}`);
          return null;
        }
      } catch (error) {
        console.error(`[TWITCH] Erreur lors de la récupération de l'image pour le jeu ID ${gameId}:`, error);
        return null;
      }
    }
    let bootUpCheck = true;
    function formatPlural(number, text) {
      return `${text}${number > 1 ? 's' : ''}`;
    }
    function getStreamDuration(startTime) {
      if (!startTime || isNaN(new Date(startTime).getTime())) {
          console.error(`[STREAM DURATION] La valeur de startTime (${startTime}) n'est pas définie ou n'est pas valide.`);
          return "Durée non disponible";
      }
  
      const now = new Date();
      const start = new Date(startTime);
  
      if (isNaN(start.getTime())) {
          console.error(`La valeur de startTime (${startTime}) n'est pas une date valide.`);
          return "Données de durée non disponibles";
      }
  
      const duration = Math.abs(now - start) / 1000;
  
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
  
      let timeText = '';
  
      if (hours > 0) {
          const hoursText = `${hours.toString().padStart(2, '0')} ${formatPlural(hours, 'heure')}`;
          timeText += hoursText;
      }
  
      if (minutes > 0 || hours === 0) {
          const minutesText = `${minutes.toString().padStart(2, '0')} ${formatPlural(minutes, 'minute')}`;
          timeText += (hours > 0 ? ' et ' : '') + minutesText;
      }
  
      return timeText;
    }
    async function checkMultipleStreamers(bot) {
      await initializeStreamers();
      const channel = bot.channels.cache.get('812530008823955506');
      const guild = bot.guilds.cache.get('716810235985133568');
  
      for (const [twitchUsername, data] of Object.entries(streamers)) {
          try {
              const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, twitchHeaders);
              const streamData = response.data.data[0];
              const streamerEntry = await ApexStreamer.findOne({ twitchUsername: twitchUsername });
              if(!streamerEntry) continue;
              
              const member = guild.members.cache.find(m => m.user.tag === streamerEntry.discordUsername);
              if (!member) continue;
  
              if (streamData) {
                if (!data.isLive || bootUpCheck) {
                    handleStreamerLive(streamData, streamerEntry, member, channel, data, twitchHeaders);
                } else {
                    updateLiveStreamInfo(streamData, streamerEntry, channel, data, twitchHeaders);
                }
            } else if (data.isLive) {
                handleStreamerOffline(streamerEntry, member, channel, data);
            }
  
          } catch (error) {
              console.error(`[TWITCH] Erreur lors de la récupération de l'API Twitch pour ${twitchUsername}: ${error}`);
          }
      }
  
      bootUpCheck = false;
    }
    async function handleStreamerLive(streamData, streamerEntry, member, channel, data, twitchHeaders) {
      const specificStreamerUsername = 'tbmpqf';
      const specificChannelId = '717117472355909693';
      const streamTitle = streamData.title;
      const gameName = await getGameName(streamData.game_id, twitchHeaders);
      const profilePic = await getUserProfilePic(streamData.user_login);
      const streamThumbnailUrl = await getLiveStreamThumbnailByUsername(streamData.user_login, twitchHeaders);
      const gameThumbnailUrl = await getGameThumbnailUrl(streamData.game_id, twitchHeaders);
      const viewersCount = streamData.viewer_count;
    
      member.roles.add(roleId).catch(error => {
        console.error(`Erreur lors de l'ajout du rôle à ${member.user.tag} :`, error);
      });
    
      if (streamData.user_login.toLowerCase() === specificStreamerUsername.toLowerCase()) {
        channel = bot.channels.cache.get(specificChannelId);
      } else {
        channel = bot.channels.cache.get('812530008823955506');
      }
    
      const liveEmbed = new EmbedBuilder()
        .setColor('#9146FF')
        .setAuthor({ name: streamData.user_name, iconURL: profilePic, url: `https://www.twitch.tv/${streamData.user_login}` })
        .setTitle(streamTitle)
        .setURL(`https://www.twitch.tv/${streamData.user_login}`)
        .setDescription(`𝐌aintenant en Live sur 𝐓𝐖𝐈𝐓𝐂𝐇 !\n@here ➠ 𝐕ient on lui donne de la force.`)
        .setThumbnail(gameThumbnailUrl)
        .addFields(
          { name: gameName, value: `\u200B`, inline: true },
          { name: `\u200B`, value: `\u200B`, inline: true },
          { name: `:eyes:丨${viewersCount}`, value: `\u200B`, inline: true },
        )
        .setImage(streamThumbnailUrl)
        .setTimestamp()
        .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });
    
      if (data.isLive && data.lastMessageId) {
        try {
          const messageToDelete = await channel.messages.fetch(data.lastMessageId);
          if (messageToDelete.author.id === bot.user.id) {
            await messageToDelete.delete();
          }
        } catch (error) {
          console.error(`Erreur lors de la suppression du message pour ${streamData.user_name}: ${error}`);
        }
      }
      
      const newMessage = await channel.send({ embeds: [liveEmbed] });
      data.lastMessageId = newMessage.id;
      data.isLive = true;
    
      streamerEntry.lastMessageId = data.lastMessageId;
      streamerEntry.isLive = true;
      streamerEntry.startedAt = new Date();
      await streamerEntry.save();
    } 
    async function handleStreamerOffline(streamerEntry, member, channel, data) {
      const specificStreamerUsername = 'tbmpqf';
      const specificChannelId = '717117472355909693';
      member.roles.remove(roleId).catch(error => {
        console.error(`Erreur lors de la suppression du rôle de ${member.user.tag} :`, error);
      });
    
      const streamDuration = getStreamDuration(data.startedAt);
      const profilePic = await getUserProfilePic(streamerEntry.twitchUsername);
    
      if (streamerEntry.twitchUsername.toLowerCase() === specificStreamerUsername.toLowerCase()) {
        channel = bot.channels.cache.get(specificChannelId);
      } else {
        channel = bot.channels.cache.get('812530008823955506');
      }
    
      const offlineEmbed = new EmbedBuilder()
        .setColor('#9146FF')
        .setAuthor({ name: streamerEntry.twitchUsername, iconURL: profilePic, url: `https://www.twitch.tv/${streamerEntry.twitchUsername}` })
        .setTitle('𝐇ors Ligne... :x:')
        .setDescription(`𝐈l était en live pendant \`${streamDuration}\`.\n\n𝐌ais il revient prochainement pour de nouvelles aventures !`)
        .setURL(`https://www.twitch.tv/${streamerEntry.twitchUsername}`)
        .setThumbnail('https://i.postimg.cc/rFhsTf7F/72958602-d4c8-49d9-9f97-a330dbdc3bbc.png')
        .setTimestamp()
        .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });
    
      if (data.lastMessageId) {
        try {
          const messageToDelete = await channel.messages.fetch(data.lastMessageId);
          if (messageToDelete.author.id === bot.user.id) {
            await messageToDelete.delete();
          }
        } catch (error) {
          console.error(`Erreur lors de la suppression du message pour ${streamerEntry.twitchUsername}: ${error}`);
        }
      }
      
      const newMessage = await channel.send({ embeds: [offlineEmbed] });
      data.lastMessageId = newMessage.id;
      data.isLive = false;
      data.startedAt = null;
    
      streamerEntry.isLive = false;
      streamerEntry.startedAt = null;
      streamerEntry.lastMessageId = data.lastMessageId;
      await streamerEntry.save();
    }
    async function updateLiveStreamInfo(streamData, streamerEntry, channel, data, twitchHeaders) {
      if (!data.startedAt) {
        data.startedAt = streamerEntry.startedAt;
    }
      const streamTitle = streamData.title;
      const gameName = await getGameName(streamData.game_id, twitchHeaders);
      const profilePic = await getUserProfilePic(streamData.user_login);
      const streamThumbnailUrl = await getLiveStreamThumbnailByUsername(streamData.user_login, twitchHeaders);
      const gameThumbnailUrl = await getGameThumbnailUrl(streamData.game_id, twitchHeaders);
      const viewersCount = streamData.viewer_count;
      const specificStreamerUsername = 'tbmpqf';
      const specificChannelId = '717117472355909693';

      if (streamData.user_login.toLowerCase() === specificStreamerUsername.toLowerCase()) {
          channel = bot.channels.cache.get(specificChannelId);
      } else {
          channel = bot.channels.cache.get('812530008823955506');
      }
      const liveEmbed = new EmbedBuilder()
          .setColor('#9146FF')
          .setAuthor({ name: streamData.user_name, iconURL: profilePic, url: `https://www.twitch.tv/${streamData.user_login}` })
          .setTitle(streamTitle)
          .setURL(`https://www.twitch.tv/${streamData.user_login}`)
          .setDescription(`𝐌aintenant en Live sur 𝐓𝐖𝐈𝐓𝐂𝐇 !\n@here ➠ 𝐕ient on lui donne de la force.`)
          .setThumbnail(gameThumbnailUrl)
          .addFields(
              { name: gameName, value: `\u200B`, inline: true },
              { name: `\u200B`, value: `\u200B`, inline: true },
              { name: `:eyes:丨${viewersCount}`, value: `\u200B`, inline: true },
          )
          .setImage(streamThumbnailUrl)
          .setTimestamp()
          .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });
  
          if (data.lastMessageId) {
            try {
                const messageToUpdate = await channel.messages.fetch(data.lastMessageId);
                await messageToUpdate.edit({ embeds: [liveEmbed] });
            } catch (error) {
                console.error(`Erreur lors de la mise à jour du message pour ${streamData.user_name}: ${error}`);
            }
        }
    }
    async function startTwitchCheck(bot) {
      await initializeTwitchHeaders();
      await initializeStreamers();
      checkMultipleStreamers(bot);
      setInterval(() => { 
         checkMultipleStreamers(bot);
        },  CHECK_INTERVAL);
    }
    startTwitchCheck(bot);

    //Gestion qui supprime le vocal de jeu crée lorsqu'il tombe à 0 utilisateurs
    const ApexVoiceCategoryID = '716810236417278034';
    const CODVoiceCategoryID = '908478418939707493';
    bot.on('voiceStateUpdate', async (oldState, newState) => {
      if (oldState.channel && oldState.channel.members.size === 0) {
        const voiceChannel = oldState.channel;
    
        if (voiceChannel.parentId === ApexVoiceCategoryID || voiceChannel.parentId === CODVoiceCategoryID) {
          const dbEntry = await VocalChannel.findOne({ channelId: voiceChannel.id });
    
          if (dbEntry) {
            try {
              await voiceChannel.delete('Channel is empty');
              await VocalChannel.deleteOne({ channelId: voiceChannel.id });
            } catch (error) {
              console.log('[GAME VOCAL] Erreur lors de la suppression du salon vocal :', error);
            }
          }
        }
      }
    });

    //Lecture de fermeture d'un salon vocal pour permettre d'en reouvrir un pour Apex
    bot.on('channelDelete', async channel => {
      if (ChannelType.GuildVoice) {
        for (let [userId, userChannel] of userChannels) {
          if (userChannel.id === channel.id) {
            userChannels.delete(userId);
            break;
          }
        }
    
        try {
          await VocalChannel.deleteOne({ channelId: channel.id });
        } catch (error) {
          console.error('[APEX VOCAL] Erreur lors de la suppression de la référence du canal dans la base de données:', error);
        }
      }
    });

    //Suppresion du message en BDD ainsi que de la recherche Apex Mate lors d'un démarrage en cas de crash ou simple redemarrage
    (async () => {
      try {
        const ongoingSearches = await SearchMateMessage.find({});
    
        for (const search of ongoingSearches) {
          const guild = bot.guilds.cache.get(search.guildId);
          if (guild) {
            const channel = guild.channels.cache.get(search.channelId);
            if (channel) {
              try {
                const messageToDelete = await channel.messages.fetch(search.messageId);
                if (messageToDelete) {
                  await messageToDelete.delete();
                } else {
                  console.warn('[APEX SEARCH] Message pas trouvé.');
                }
              } catch (err) {
                console.error('[APEX SEARCH] Erreur lors de la suppression du message:', err);
              }
              
              try {
                await SearchMateMessage.deleteOne({ _id: search._id });
              } catch (err) {
                console.error('[APEX SEARCH] Erreur lors de la suppression en BDD :', err);
              }
            }
          }
        }
      } catch (err) {
        console.error('[APEX SEARCH] Erreur lors de l\'event :', err);
      }
    })();

    // Réinitialise le message de playlist pour la musique
    const channelMusicId = '1136327173343559810';
    Music.findOne({ serverId: serverId })
    .then((musicEntry) => {
      if (musicEntry && musicEntry.messageId) {
        const channel = bot.channels.cache.get(channelMusicId);
        if (!channel) return console.error('Channel not found!');
        
        channel.messages.fetch(musicEntry.messageId)
        .then((message) => {
          
          const newEmbed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle(`――――――――∈ \`MUSIQUES\` ∋――――――――`)
            .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
            .setDescription("**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.")
            .setFooter({
              text: `Cordialement, l'équipe${bot.guilds.cache.get(serverId).name}`,
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

    loadSlashCommands(bot);
    //Donne l'heure Française
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

    //Message connexion bot dans les logs
    console.log(
      "\x1b[33m" +
        `${bot.user.username} connecté le ` +
        "\x1b[33m" +
        `${dateHeureFrancaise}\n`
    );

    //Interval pour mettre a jour le salon vocal Minecraft et check les lives Twitch
    const TBMPQF_SERVER_ID = '716810235985133568';
    setInterval(async () => {
      const server = bot.guilds.cache.get(TBMPQF_SERVER_ID);
      checkMultipleStreamers(bot);
      updateCategoryMinecraft(server);
    }, 60000);
    //Interval pour mettre a jour le salon vocal membre connecté
    setInterval(async () => {
      const server = bot.guilds.cache.get(TBMPQF_SERVER_ID);
      updateVoiceChannelServer(server);
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

        const NewServerembed = new EmbedBuilder()
          .setTitle(`\`𝐇ey! 𝐔n grand 𝐌𝐄𝐑𝐂𝐈\` 🙏`)
          .setColor("#ffc394")
          .setDescription(
            `𝐏our commencer à utiliser toutes mes fonctionnalités, tu peux à présent me configurer en utilisant la commande \`/setConfig\` si tu es __administrateur__ du serveur (au minimum).\n\`𝐍'oublie pas de me mettre tout en haut de ta liste de rôle ainsi qu'administrateur du serveur.\`\n 𝐎u tout simplement rajouté le rôle __le plus haut__ de ton serveur au **bot**.\n\n𝐏our toute autre question, n'hésite surtout pas à contacter \`tbmpqf\` mon créateur.\n\n\n__𝐀vec moi, ta communauté à accès__ :\n\n◟𝐒ystème d'expérience complet. (message + vocal)\n◟𝐒ystème d'avertissement, mute.\n◟𝐒ystème de ticket.\n◟𝐒ystème de suggestion.\n◟𝐁ingo avec des récompenses exclusive.\n◟𝐒ystème de menu déroulant pour les rôles.\n◟𝐄t bien plus !!`
          )
          .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
          .setTimestamp()
          .setFooter({
            text: `Cordialement, l'équipe de 𝐓𝐁𝐌_𝐂𝐏𝐔_𝐕𝟐`,
            iconURL: "https://i.postimg.cc/L8B87btv/faucon-fond.png",
          });
          try {
            const owner = await guild.fetchOwner();
            await owner.send({ embeds: [NewServerembed] });
          } catch (error) {
            if (error.code === 50007) {
              const textChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
        
              const firstTextChannel = textChannels.first();
              if (firstTextChannel) {
                await firstTextChannel.send({ embeds: [NewServerembed] });
              }
            } else {
              console.error("Erreur lors de l'envoi du DM au propriétaire du serveur:", error);
            }
          }
        // Envoi sur mon discord pour m'informer d'un nouveau serveur
        const TBMPQFGuild = bot.guilds.cache.get('716810235985133568')
        const TBMPQFChannelLog = TBMPQFGuild.channels.cache.get('838440585341566996');
        const NewServerInfo = new EmbedBuilder()
          .setAuthor({
            name: `${guild.name}`,
            iconURL: guild.iconURL({ dynamic: true, size: 512 }),
          })
          .setTitle(`\`-丨𝐍ouveau 𝐒erveur丨-\` 🙏`)
          .setColor("#ffc394")
          .setDescription(
            `𝐇eureux de t'annoncer que ton bot vient de rejoindre un nouveau serveur.\nCréateur : \`${owner.user.tag}\``
          )
          .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
          .setTimestamp()
        TBMPQFChannelLog.send({ embeds: [NewServerInfo] });
      } catch (error) {
        console.error(
          "[DM OWNER] Erreur lors de l'envoi du message au propriétaire du serveur :",
          error
        );
      }
    });

    // Message de connexion du bot
    const myServerID = '716810235985133568';
    bot.guilds.cache.forEach((server) => {
      if (server.id === myServerID) {
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
      }
    });

    // Interval de messages pour le Daily.
    const channelId = "818640158693392405";
    const messageIdToKeep = "1193673840782483496"; // Message à ne pas supprimer
    setInterval(() => {
      const channelDaily = bot.channels.cache.get(channelId);
      if (!channelDaily) return;

      const DailyInterval = new EmbedBuilder()
        .setDescription(`@here. 𝐍'oubliez pas de récupérer votre \`𝐃aily\` ! `)
        .setColor("Red")
        .setFooter({
            text: `Cordialement, l'équipe${bot.guilds.cache.get(serverId).name}`,
            iconURL: bot.guilds.cache.get(serverId).iconURL(),
          })
        .setTimestamp();

      channelDaily.send({ embeds: [DailyInterval] });
    }, 43200000); // Toutes les 12 heures
    setInterval(async () => {
      const channel = await bot.channels.fetch(channelId);
      if (!channel) return;

      const messages = await channel.messages.fetch({ limit: 1 }); 
      messages.forEach(async (msg) => {
        if (msg.id !== messageIdToKeep) {
          await msg.delete().catch(console.error);
        }
      });
    }, 43200000); // Toutes les 12 heures

    // Activité du bot
    const activities = [
      { name: "𝐀pex 𝐋egends", type: ActivityType.Playing },
      { name: ``, type: ActivityType.Listening }, // Ceci sera mis à jour dynamiquement avec le nombre de serveurs
      { name: "le 𝐏aris 𝐒aint-𝐆ermain", type: ActivityType.Watching },
      { name: ``, type: ActivityType.Listening }, // Ceci sera mis à jour dynamiquement avec le nombre total de membres
    ];

    let i = 0;
    setInterval(() => {
      let activity = activities[i];
    
      if (activity.type === ActivityType.Listening && i === 1) {
        activity.name = `丨${bot.guilds.cache.size}丨𝐒erveurs`;
      } else if (activity.type === ActivityType.Listening && i === 3) {
        const totalMembers = bot.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        activity.name = `${totalMembers}丨𝐌embres`;
      }
    
      bot.user.setPresence({
        activities: [activity],
        status: "dnd",
      });
    
      i = (i + 1) % activities.length;
    }, 30 * 1000);
  },
};

// Mise a jour du nombre de joueurs sur le serveur Minecraft
let consecutiveFailures = 0;
async function updateCategoryMinecraft(server) {
  try {
    const category = server.channels.cache.find(channel =>
      channel.type === ChannelType.GuildCategory && channel.name.startsWith("丨MINECRAFT丨")
    );

    if (!category) {
      console.error("[MINECRAFT] Catégorie non trouvée pour mettre à jour le nombre d'utilisateurs connecté.");
      return;
    }

    const response = await fetch(`https://api.mcsrvstat.us/3/${MINECRAFT_SERVER_DOMAIN}`);
    if (!response.ok) {
      throw new Error(`[MINECRAFT] Erreur HTTP ! statut : ${response.status}`);
    }

    const data = await response.json();
    if (data.online) {
      const newCategoryName = `丨MINECRAFT丨 ${data.players.online} / ${data.players.max}`;
      await category.setName(newCategoryName);
      consecutiveFailures = 0;
    }
  } catch (error) {
    console.error("[MINECRAFT] Erreur lors de la récupération des données du serveur Minecraft :", error);
    handleFailure(server);
  }
}
function handleFailure(server) {
  consecutiveFailures++;
  if (consecutiveFailures >= 2) {
    console.error("[MINECRAFT] Plusieurs échecs consécutifs. J'essaye une nouvelle tentative...");
    setTimeout(() => {
      updateCategoryMinecraft(server);
    }, calculateExponentialBackoff(consecutiveFailures));
    consecutiveFailures = 0;
  }
}
function calculateExponentialBackoff(failureCount) {
  const baseDelay = 60000;
  return Math.min(baseDelay * 2 ** (failureCount - 1), 3600000); //Max 1h de délai
}

// Mise à jour du nombre de personnes connectées sur le serveur
async function updateVoiceChannelServer(server) {
  let channel;
  try {
    await server.members.fetch({ withPresences: true });

    channel = server.channels.cache.find((channel) =>
      channel.name.startsWith("丨𝐎n𝐋ine")
    );

    if (!channel) {
      channel = await server.channels.create({
        name: "丨𝐎n𝐋ine",
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: server.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });
    }

    const filteredMembers = server.members.cache.filter(
      (member) =>
        ['online', 'dnd', 'idle'].includes(member.presence?.status) &&
        !member.user.bot
    );

    const onlineMembers = filteredMembers.size;
    const memberCount = server.members.cache.filter(member => !member.user.bot).size;

    await channel.setName(`丨𝐎n𝐋ine ${onlineMembers} / ${memberCount}`)
      .catch(error => {
        if (error.code === 'GuildMembersTimeout') {
          console.warn("[ONLINE] Timeout lors de la mise à jour du canal, mais continuation du processus.");
          return;
        } else {
          throw error;
        }
      });

  } catch (error) {
    console.error("[ONLINE] Erreur lors de la mise à jour du salon vocal:", error);
    if (channel) {
      channel.setName(`丨𝐎n𝐋ine`).catch(err => console.error("[ONLINE] Impossible de réinitialiser le nom du canal:", err));
    }
  }
}
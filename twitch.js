const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require("./config.json");
const { clientId, clientSecret } = config.twitch;
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_BASE_API = 'https://api.twitch.tv/helix';
const TwitchStreamers = require('./models/TwitchStreamers');
const ServerConfig = require("./models/serverConfig");
const CHECK_INTERVAL = 1 * 60 * 1000; // Temps entre mise à jour de l'embed
let twitchHeaders;
let bootUpCheck = true;

const SPECIAL_STREAMERS = {
  "tbmpqf": "717117472355909693"
};

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
    console.error("[TWITCH] Token d'accès non obtenu. Vérifiez vos identifiants.")
  }
}
async function fetchFromTwitch(endpoint, params = {}) {
  try {
    const url = new URL(`${TWITCH_BASE_API}/${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await axios.get(url.toString(), twitchHeaders);
    if (response?.data?.data && response.data.data.length > 0) {
      return response;
    } else {
      console.error(`[TWITCH] Aucune donnée trouvée pour l'endpoint ${endpoint} avec les paramètres ${JSON.stringify(params)}`);
      return null
    }
  } catch (error) {
    console.error(`[TWITCH] Erreur lors de la récupération de ${endpoint} : ${error}`);
    return null;
  }
}
async function initializeStreamers(serverID) {
  const streamersFromDB = await TwitchStreamers.find({ serverID });

  return streamersFromDB.map(streamer => ({
    twitchUsername: streamer.twitchUsername,
    isLive: streamer.isLive,
    lastMessageId: streamer.lastMessageId,
    startedAt: streamer.startedAt || null,
    currentTitle: null,
    currentViewersCount: null,
    twitchChannelID: streamer.TwitchChannelID
  }));
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
async function getUserProfilePic(username) {
  const response = await fetchFromTwitch('users', { login: username });
  return response?.data.data[0].profile_image_url;
}
async function getLiveStreamThumbnailByUsername(username) {
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
    return null;
  }
}
async function getGameName(gameId) {
  try {
    const response = await fetchFromTwitch('games', { id: gameId });
    if (response?.data?.data.length > 0) {
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
    const response = await fetchFromTwitchWithRetry('games', { id: gameId });
    if (response && response.data && response.data.data.length > 0) {
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
function getStreamDuration(startTime) {
  const endTime = new Date();
  const durationInMilliseconds = endTime - new Date(startTime);

  const hours = Math.floor(durationInMilliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((durationInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));

  const hourLabel = hours > 1 ? 'heures' : 'heure';
  const minuteLabel = minutes > 1 ? 'minutes' : 'minute';

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');

  return `${formattedHours} ${hourLabel} ${formattedMinutes} ${minuteLabel}`;
}
async function fetchFromTwitchWithRetry(endpoint, params = {}, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fetchFromTwitch(endpoint, params);
    } catch (error) {
      attempt++;
      console.warn(`[TWITCH] Tentative ${attempt} échouée pour ${endpoint}: ${error}`);
      if (attempt >= retries) {
        console.error(`[TWITCH] Erreur irrécupérable après ${retries} tentatives : ${error}`);
        return null;
      }
    }
  }
}
async function handleStreamerLive(streamData, streamerEntry, member, channel, data, bot) {
  try {
    const liveEmbed = new EmbedBuilder()
      .setColor('#9146FF')
      .setAuthor({ name: streamData.user_name, iconURL: await getUserProfilePic(streamData.user_login), url: `https://www.twitch.tv/${streamData.user_login}` })
      .setTitle(streamData.title)
      .setURL(`https://www.twitch.tv/${streamData.user_login}`)
      .setThumbnail(await getGameThumbnailUrl(streamData.game_id))
      .setDescription(`𝐋ive sur 𝐓𝐖𝐈𝐓𝐂𝐇 !\n@here ➠ 𝐃onne-lui de la force.`)
      .setImage(await getLiveStreamThumbnailByUsername(streamData.user_login))
      .addFields(
        { name: await getGameName(streamData.game_id), value: '\u200B', inline: true },
        { name: `:eyes:丨${streamData.viewer_count}`, value: '\u200B', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });

    if (data.lastMessageId) {
      try {
        const existingMessage = await channel.messages.fetch(data.lastMessageId);
        if (existingMessage) {
          await existingMessage.delete();
        }
      } catch (error) {
        console.error(`[TWITCH] Erreur lors de la suppression du message pour ${streamData.user_name}: ${error}`);
      }
    }

    const newMessage = await channel.send({ embeds: [liveEmbed] });
    data.lastMessageId = newMessage.id;

    data.isLive = true;
    streamerEntry.lastMessageId = data.lastMessageId;
    streamerEntry.isLive = true;
    streamerEntry.startedAt = new Date();
    await streamerEntry.save();
  } catch (error) {
    console.error(`[TWITCH] Erreur dans le traitement du streamer en live : ${error}`);
  }
}
async function handleStreamerOffline(streamerEntry, member, channel, data, bot) {
  const streamDuration = getStreamDuration(data.startedAt);
  const profilePic = await getUserProfilePic(streamerEntry.twitchUsername);

  const offlineEmbed = new EmbedBuilder()
    .setColor('#9146FF')
    .setAuthor({ name: streamerEntry.twitchUsername, iconURL: profilePic, url: `https://www.twitch.tv/${streamerEntry.twitchUsername}` })
    .setTitle('𝐇ors Ligne... :x:')
    .setDescription(`𝐈l était en live pendant \`${streamDuration}\`.\n\n𝐌ais il revient prochainement pour de nouvelles aventures !`)
    .setURL(`https://www.twitch.tv/${streamerEntry.twitchUsername}`)
    .setThumbnail('https://i.postimg.cc/7hxqQGnS/5d9ce0bf-f54e-414a-acd8-92676df5b001.png')
    .setTimestamp()
    .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });

  if (data.lastMessageId) {
    const messageToUpdate = await channel.messages.fetch(data.lastMessageId);
    if (messageToUpdate.author.id === bot.user.id) {
      await messageToUpdate.edit({ embeds: [offlineEmbed] });
    }
  }

  data.isLive = false;
  data.startedAt = null;

  streamerEntry.isLive = false;
  streamerEntry.startedAt = null;
  streamerEntry.lastMessageId = data.lastMessageId;

  try {
    await streamerEntry.save();
  } catch (error) {
    console.error(`[TWITCH] Erreur lors de la mise à jour de l'état du streamer : ${error}`);
  }
}
async function checkMultipleStreamers(bot, serverID) {
  const streamers = await initializeStreamers(serverID);

  if (!streamers || streamers.length === 0) {
    return;
  }

  const guild = bot.guilds.cache.get(serverID);
  if (!guild) {
    console.error(`[TWITCH] Guilde non trouvée pour serverId: ${serverID}`);
    return;
  }

  const serverConfig = await ServerConfig.findOne({ serverID });
  if (!serverConfig || !serverConfig.TwitchChannelID) {
    return;
  }

  for (const streamerData of streamers) {
    const twitchUsername = streamerData.twitchUsername;

  const targetChannelId = SPECIAL_STREAMERS[twitchUsername.toLowerCase()] || serverConfig.TwitchChannelID;
  const channel = guild.channels.cache.get(targetChannelId);

  if (!channel) {
    console.error(`[TWITCH] Salon non trouvé pour ${twitchUsername}`);
  }

    try {
      const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, twitchHeaders);

      const streamData = response.data.data[0];
      if (!streamData) {
        if (streamerData.isLive) {
          const streamerEntry = await TwitchStreamers.findOne({ twitchUsername, serverID });
          if (streamerEntry) {
            const member = guild.members.cache.find(m => m.user.id === streamerEntry.discordUserID);
            await handleStreamerOffline(streamerEntry, member, channel, streamerData, bot);
          }
        }
        continue;
      }

      const streamerEntry = await TwitchStreamers.findOne({ twitchUsername, serverID });
      if (!streamerEntry) {
        console.error(`[TWITCH] Streamer non trouvé pour le username ${twitchUsername}`);
        continue;
      }

      const member = guild.members.cache.find(m => m.user.id === streamerEntry.discordUserID);
      if (streamData && member) {
        if (!streamerData.isLive || bootUpCheck) {
          await handleStreamerLive(streamData, streamerEntry, member, channel, streamerData, bot);
        } else {
          await updateLiveStreamInfo(streamData, streamerEntry, channel, streamerData, twitchHeaders);
        }
      }
    } catch (error) {
      console.error(`[TWITCH] Erreur lors de la récupération de l'API Twitch pour ${twitchUsername}: ${error}`);
    }
  }
  bootUpCheck = false;
}
async function updateLiveStreamInfo(streamData, streamerEntry, channel, data) {
  const streamTitle = streamData.title;
  const gameName = await getGameName(streamData.game_id);
  const profilePic = await getUserProfilePic(streamData.user_login);
  const streamThumbnailUrl = await getLiveStreamThumbnailByUsername(streamData.user_login);
  const gameThumbnailUrl = await getGameThumbnailUrl(streamData.game_id);
  const viewersCount = streamData.viewer_count;

  if (data.currentTitle === streamTitle && data.currentViewersCount === viewersCount) {
    console.log(`[TWITCH] Aucune modification à faire pour ${streamData.user_login}, le message est à jour.`);
    return;
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
      { name: `:eyes:丨${viewersCount}`, value: `\u200B`, inline: true }
    )
    .setImage(streamThumbnailUrl)
    .setTimestamp()
    .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });

  try {
    const messageToUpdate = await channel.messages.fetch(data.lastMessageId);
    await messageToUpdate.edit({ embeds: [liveEmbed] });

    data.currentTitle = streamTitle;
    data.currentViewersCount = viewersCount;
  } catch (error) {
    console.error(`[TWITCH] Erreur lors de la mise à jour du message pour ${streamData.user_name}: ${error}`);
  }
}
async function startTwitchCheck(bot) {
  await initializeTwitchHeaders();
  await initializeStreamers();
  setInterval(() => {
    bot.guilds.cache.forEach(guild => {
      checkMultipleStreamers(bot, guild.id);
    });
  }, CHECK_INTERVAL);
}

module.exports = {
  startTwitchCheck,
};
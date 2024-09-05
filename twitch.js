const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require("./config.json");
const { clientId, clientSecret } = config.twitch;
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_BASE_API = 'https://api.twitch.tv/helix';
const ApexStreamer = require('./models/Streamers');
const CHECK_INTERVAL = 2 * 60 * 1000; // Temps entre mise à jour de l'embed
let twitchHeaders;
let streamers = {};
let bootUpCheck = true;

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
    const response = await axios.get(url.toString(), twitchHeaders);
    if (response?.data?.data && response.data.data.length > 0) {
      return response;
    } else {
      console.error(`[TWITCH] Aucune donnée trouvée pour l'endpoint ${endpoint} avec les paramètres ${JSON.stringify(params)}`);
      return null;
    }
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
      startedAt: streamer.startedAt || null,
      currentTitle: null,
      currentViewersCount: null 
    };
  });
}

async function getUserProfilePic(streamer) {
  const response = await fetchFromTwitchWithRetry('users', { login: streamer });
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

  const response = await fetchFromTwitchWithRetry(endpoint, params);
  if (response && response.data.data.length > 0) {
    return response.data.data[0].id;
  } else {
    return null;
  }
}

async function getGameName(gameId) {
  try {
    const response = await fetchFromTwitchWithRetry('games', { id: gameId });
    if (response && response.data && response.data.data.length > 0) {
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

async function handleStreamerLive(streamData, streamerEntry, member, channel, data, bot) {
  try {
    // Vérification du serverId
    let serverId = streamerEntry.serverId;
    if (!serverId) {
      console.error(`[TWITCH] serverId indéfini pour le streamer: ${streamerEntry.twitchUsername}. Utilisation d'un serverId par défaut.`);
      serverId = '716810235985133568';  // Remplacez ceci par votre serverId par défaut
    }

    const guild = bot.guilds.cache.get(serverId);
    if (!guild) {
      console.error(`[TWITCH] Guilde non trouvée pour serverId: ${serverId}`);
      return;
    }

    const specificChannelId = streamData.user_login.toLowerCase() === 'tbmpqf' ? '717117472355909693' : '812530008823955506';
    channel = bot.channels.cache.get(specificChannelId);

    const liveEmbed = new EmbedBuilder()
      .setColor('#9146FF')
      .setAuthor({ name: streamData.user_name, iconURL: await getUserProfilePic(streamData.user_login), url: `https://www.twitch.tv/${streamData.user_login}` })
      .setTitle(streamData.title)
      .setURL(`https://www.twitch.tv/${streamData.user_login}`)
      .setThumbnail(await getGameThumbnailUrl(streamData.game_id))
      .setDescription(`Live sur TWITCH !\n@here ➠ Donne-lui de la force.`)
      .setImage(await getLiveStreamThumbnailByUsername(streamData.user_login))
      .addFields(
        { name: await getGameName(streamData.game_id), value: '\u200B', inline: true },
        { name: `:eyes:丨${streamData.viewer_count}`, value: '\u200B', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Twitch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });

    if (data.lastMessageId) {
      try {
        const existingMessage = await channel.messages.fetch(data.lastMessageId);
        await existingMessage.edit({ embeds: [liveEmbed] });
        console.log(`[TWITCH] Message existant mis à jour pour ${streamData.user_login}`);
      } catch (error) {
        console.error(`[TWITCH] Erreur lors de la modification du message pour ${streamData.user_name}: ${error}`);
      }
    } else {
      const newMessage = await channel.send({ embeds: [liveEmbed] });
      data.lastMessageId = newMessage.id;
    }

    data.isLive = true;
    streamerEntry.lastMessageId = data.lastMessageId;
    streamerEntry.isLive = true;
    streamerEntry.startedAt = new Date();
    await streamerEntry.save();
  } catch (error) {
    console.error(`[TWITCH] Erreur dans le traitement du streamer en live : ${error}`);
  }
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

  try {
    if (data.lastMessageId) {
      const messageToDelete = await channel.messages.fetch(data.lastMessageId);
      if (messageToDelete.author.id === bot.user.id) {
        await messageToDelete.delete();
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
  } catch (error) {
    console.error(`Erreur lors de la gestion du message de fin de live pour ${streamerEntry.twitchUsername}: ${error}`);
  }
}

async function checkMultipleStreamers(bot) {
  await initializeStreamers();
  
  const guildId = '716810235985133568';  // Assurez-vous que l'ID de la guilde est correct
  const guild = bot.guilds.cache.get(guildId);
  
  if (!guild) {
    console.error(`[TWITCH] Guilde non trouvée pour serverId: ${guildId}`);
    return;
  }

  const channel = guild.channels.cache.get('812530008823955506');
  
  if (!channel) {
    console.error(`[TWITCH] Channel non trouvé pour channelId: 812530008823955506`);
    return;
  }

  for (const [twitchUsername, data] of Object.entries(streamers)) {
    try {
      const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, twitchHeaders);
      const streamData = response.data.data[0];
      const streamerEntry = await ApexStreamer.findOne({ twitchUsername });

      if (!streamerEntry) {
        console.error(`[TWITCH] Streamer non trouvé pour le username ${twitchUsername}`);
        continue;
      }
      
      const member = guild.members.cache.find(m => m.user.tag === streamerEntry.discordUsername);

      if (streamData && member) {
        if (!data.isLive || bootUpCheck) {
          // Appeler la fonction pour gérer l'envoi ou la modification du message
          handleStreamerLive(streamData, streamerEntry, member, channel, data, bot);
        } else {
          // Si le streamer est déjà en live et le message a été envoyé, on met juste à jour
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

async function updateLiveStreamInfo(streamData, streamerEntry, channel, data, twitchHeaders) {
  // Récupère les informations actuelles du message
  if (!data.startedAt) {
    data.startedAt = streamerEntry.startedAt;
  }

  const streamTitle = streamData.title;
  const gameName = await getGameName(streamData.game_id, twitchHeaders);
  const profilePic = await getUserProfilePic(streamData.user_login);
  const streamThumbnailUrl = await getLiveStreamThumbnailByUsername(streamData.user_login, twitchHeaders);
  const gameThumbnailUrl = await getGameThumbnailUrl(streamData.game_id, twitchHeaders);
  const viewersCount = streamData.viewer_count;

  // Comparer avec les anciennes données pour voir si un changement est nécessaire
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

    // Mettre à jour les données sauvegardées
    data.currentTitle = streamTitle;
    data.currentViewersCount = viewersCount;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du message pour ${streamData.user_name}: ${error}`);
  }
}

async function startTwitchCheck(bot) {
  await initializeTwitchHeaders();
  await initializeStreamers();
  checkMultipleStreamers(bot);
  setInterval(() => { 
    checkMultipleStreamers(bot);
  }, CHECK_INTERVAL);
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

module.exports = {
  startTwitchCheck,
};

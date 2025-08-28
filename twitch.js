const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require("./config.json");
const { clientId, clientSecret } = config.twitch;

const TwitchStreamers = require('./models/TwitchStreamers');
const ServerConfig    = require("./models/serverConfig");
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_BASE_API  = 'https://api.twitch.tv/helix';
const CHECK_INTERVAL   = 60 * 1000;

const SPECIAL_STREAMERS = {
  "tbmpqf": "717117472355909693", // → ID du salon spécifique
};

let twitchHeaders = null;
let bootUpCheck   = true;

async function getTwitchAccessToken() {
  try {
    const url = `${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
    const { data } = await axios.post(url);
    return data.access_token;
  } catch (error) {
    console.error('[TWITCH] Erreur token:', error?.response?.status, error?.response?.data || error.message);
    return null;
  }
}
async function initializeTwitchHeaders() {
  const accessToken = await getTwitchAccessToken();
  if (!accessToken) {
    console.error("[TWITCH] Token introuvable (clientId/clientSecret ?)");
    twitchHeaders = null;
    return;
  }
  twitchHeaders = {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`
    },
    timeout: 10_000,
  };
}
async function twitchGet(endpoint, params = {}, retries = 1) {
  if (!twitchHeaders) await initializeTwitchHeaders();

  try {
    const url = new URL(`${TWITCH_BASE_API}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    const res = await axios.get(url.toString(), twitchHeaders);
    return res?.data?.data || [];
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 && retries > 0) {
      await initializeTwitchHeaders();
      return twitchGet(endpoint, params, retries - 1);
    }
    if (status === 503 && retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return twitchGet(endpoint, params, retries - 1);
    }
    console.error(`[TWITCH] GET ${endpoint} erreur:`, status, err?.response?.data || err.message);
    return [];
  }
}
async function getUserID(username) {
  const data = await twitchGet('users', { login: username });
  return data?.[0]?.id || null;
}
async function getUserProfilePic(username) {
  const data = await twitchGet('users', { login: username });
  return data?.[0]?.profile_image_url || null;
}
async function getLiveStreamThumbnailByUsername(username) {
  const userId = await getUserID(username);
  if (!userId) return null;

  const streams = await twitchGet('streams', { user_id: userId });
  if (!streams?.length) return '';
  const t = streams[0]?.thumbnail_url || '';
  return t ? t.replace('{width}', '640').replace('{height}', '360').concat(`?t=${Date.now()}`) : '';
}

async function getGameName(gameId) {
  const games = await twitchGet('games', { id: gameId });
  return games?.[0]?.name || 'Nom de jeu inconnu';
}

async function getGameThumbnailUrl(gameId) {
  const games = await twitchGet('games', { id: gameId });
  const url = games?.[0]?.box_art_url || null;
  return url ? url.replace('{width}', '285').replace('{height}', '380') : null;
}

function getStreamDuration(startTime) {
  if (!startTime) return '00 heure 00 minute';
  const end = new Date();
  const ms  = end - new Date(startTime);
  const h   = Math.floor(ms / 3_600_000);
  const m   = Math.floor((ms % 3_600_000) / 60_000);
  const hourLabel   = h > 1 ? 'heures' : 'heure';
  const minuteLabel = m > 1 ? 'minutes' : 'minute';
  return `${String(h).padStart(2,'0')} ${hourLabel} ${String(m).padStart(2,'0')} ${minuteLabel}`;
}

async function resolveLiveRole(guild, serverConfig) {
  try {
    if (!guild || !serverConfig) return null;

    if (serverConfig.TwitchRoleID) {
      const byId = guild.roles.cache.get(serverConfig.TwitchRoleID)
        || await guild.roles.fetch(serverConfig.TwitchRoleID).catch(() => null);
      if (byId) return byId;
    }
  
    if (serverConfig.TwitchRoleName) {
      const byName = guild.roles.cache.find(r => r.name === serverConfig.TwitchRoleName);
      if (byName) return byName;
    }
    return null;
  } catch {
    return null;
  }
}
async function setLiveRole(member, role, shouldHave) {
  if (!member || !role) return;
  if (shouldHave) {
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => {});
    }
  } else {
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch(() => {});
    }
  }
}
async function initializeStreamers(serverID) {
  const streamersFromDB = await TwitchStreamers.find({ serverID });
  return streamersFromDB.map(s => ({
    twitchUsername: s.twitchUsername,
    isLive: s.isLive,
    lastMessageId: s.lastMessageId,
    startedAt: s.startedAt || null,
    currentTitle: null,
    currentViewersCount: null,
    twitchChannelID: s.TwitchChannelID,
  }));
}
async function handleStreamerLive(streamData, streamerEntry, member, channel, data, bot, serverConfig) {
  try {
    const [pp, gameName, gameThumb, liveThumb] = await Promise.all([
      getUserProfilePic(streamData.user_login),
      getGameName(streamData.game_id),
      getGameThumbnailUrl(streamData.game_id),
      getLiveStreamThumbnailByUsername(streamData.user_login),
    ]);

    const liveEmbed = new EmbedBuilder()
      .setColor('#9146FF')
      .setAuthor({
        name: streamData.user_name,
        iconURL: pp || undefined,
        url: `https://www.twitch.tv/${streamData.user_login}`
      })
      .setTitle(streamData.title || 'En Live !')
      .setURL(`https://www.twitch.tv/${streamData.user_login}`)
      .setThumbnail(gameThumb || null)
      .setDescription(`𝐋ive sur 𝐓𝐖𝐈𝐓𝐂𝐇 !\n@here ➠ 𝐃onne-lui de la force.`)
      .setImage(liveThumb || null)
      .addFields(
        { name: gameName, value: '\u200B', inline: true },
        { name: `:eyes:丨${streamData.viewer_count}`, value: '\u200B', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });

    if (data.lastMessageId) {
      try {
        const oldMsg = await channel.messages.fetch(data.lastMessageId);
        if (oldMsg) await oldMsg.delete().catch(() => {});
      } catch {}
    }

    const newMessage = await channel.send({ embeds: [liveEmbed] });
    data.lastMessageId = newMessage.id;

    data.isLive = true;
    data.startedAt = new Date();
    data.currentTitle = streamData.title || '';
    data.currentViewersCount = streamData.viewer_count || 0;

    streamerEntry.lastMessageId = data.lastMessageId;
    streamerEntry.isLive = true;
    streamerEntry.startedAt = data.startedAt;
    await streamerEntry.save();

    const liveRole = await resolveLiveRole(channel.guild, serverConfig);
    await setLiveRole(member, liveRole, true);

  } catch (error) {
    console.error(`[TWITCH] handleStreamerLive erreur:`, error?.message);
  }
}
async function handleStreamerOffline(streamerEntry, member, channel, data, bot, serverConfig) {
  try {
    const duration = getStreamDuration(data.startedAt);
    const profilePic = await getUserProfilePic(streamerEntry.twitchUsername);

    const offlineEmbed = new EmbedBuilder()
      .setColor('#9146FF')
      .setAuthor({
        name: streamerEntry.twitchUsername,
        iconURL: profilePic || undefined,
        url: `https://www.twitch.tv/${streamerEntry.twitchUsername}`
      })
      .setTitle('𝐇ors Ligne... :x:')
      .setDescription(`𝐈l était en live pendant \`${duration}\`.\n\n𝐌ais il revient prochainement pour de nouvelles aventures !`)
      .setURL(`https://www.twitch.tv/${streamerEntry.twitchUsername}`)
      .setThumbnail('https://i.postimg.cc/7hxqQGnS/5d9ce0bf-f54e-414a-acd8-92676df5b001.png')
      .setTimestamp()
      .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });

    if (data.lastMessageId) {
      try {
        const msg = await channel.messages.fetch(data.lastMessageId);
        if (msg?.author?.id === bot.user.id) {
          await msg.edit({ embeds: [offlineEmbed] }).catch(() => {});
        }
      } catch {}
    }

    data.isLive = false;
    data.startedAt = null;
    data.currentTitle = null;
    data.currentViewersCount = null;

    streamerEntry.isLive = false;
    streamerEntry.startedAt = null;
    streamerEntry.lastMessageId = data.lastMessageId;
    await streamerEntry.save();

    const liveRole = await resolveLiveRole(channel.guild, serverConfig);
    await setLiveRole(member, liveRole, false);

  } catch (error) {
    console.error(`[TWITCH] handleStreamerOffline erreur:`, error?.message);
  }
}
async function updateLiveStreamInfo(streamData, streamerEntry, channel, data) {
  try {
    const streamTitle   = streamData.title || '';
    const viewersCount  = streamData.viewer_count || 0;

    if (data.currentTitle === streamTitle && data.currentViewersCount === viewersCount) return;

    const [gameName, profilePic, streamThumb, gameThumb] = await Promise.all([
      getGameName(streamData.game_id),
      getUserProfilePic(streamData.user_login),
      getLiveStreamThumbnailByUsername(streamData.user_login),
      getGameThumbnailUrl(streamData.game_id),
    ]);

    const liveEmbed = new EmbedBuilder()
      .setColor('#9146FF')
      .setAuthor({
        name: streamData.user_name,
        iconURL: profilePic || undefined,
        url: `https://www.twitch.tv/${streamData.user_login}`
      })
      .setTitle(streamTitle || 'En Live !')
      .setURL(`https://www.twitch.tv/${streamData.user_login}`)
      .setDescription(`𝐌aintenant en Live sur 𝐓𝐖𝐈𝐓𝐂𝐇 !\n@here ➠ 𝐕ient on lui donne de la force.`)
      .setThumbnail(gameThumb || null)
      .addFields(
        { name: gameName, value: `\u200B`, inline: true },
        { name: `\u200B`, value: `\u200B`, inline: true },
        { name: `:eyes:丨${viewersCount}`, value: `\u200B`, inline: true }
      )
      .setImage(streamThumb || null)
      .setTimestamp()
      .setFooter({ text: `𝐓witch`, iconURL: 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' });

    if (!data.lastMessageId) return;
    const messageToUpdate = await channel.messages.fetch(data.lastMessageId).catch(() => null);
    if (!messageToUpdate) return;

    await messageToUpdate.edit({ embeds: [liveEmbed] }).catch(() => {});
    data.currentTitle = streamTitle;
    data.currentViewersCount = viewersCount;

  } catch (error) {
    console.error(`[TWITCH] updateLiveStreamInfo erreur:`, error?.message);
  }
}
async function checkMultipleStreamers(bot, serverID) {
  const streamers = await initializeStreamers(serverID);
  if (!streamers?.length) return;

  const guild = bot.guilds.cache.get(serverID);
  if (!guild) return;

  const serverConfig = await ServerConfig.findOne({ serverID });
  if (!serverConfig || !serverConfig.TwitchChannelID) return;

  for (const streamerData of streamers) {
    const twitchUsername = (streamerData.twitchUsername || '').toLowerCase();
    const targetChannelId = SPECIAL_STREAMERS[twitchUsername] || serverConfig.TwitchChannelID;
    const channel = guild.channels.cache.get(targetChannelId);
    if (!channel) continue;

    const streamerEntry = await TwitchStreamers.findOne({ twitchUsername: streamerData.twitchUsername, serverID });
    if (!streamerEntry) continue;

    const member = streamerEntry.discordUserID
      ? (guild.members.cache.get(streamerEntry.discordUserID)
        || await guild.members.fetch(streamerEntry.discordUserID).catch(() => null))
      : null;

    let streams = [];
    try {
      streams = await twitchGet('streams', { user_login: twitchUsername }, 1);
    } catch (e) {
      console.error(`[TWITCH] Erreur API pour ${twitchUsername}:`, e?.message);
      continue;
    }

    const streamData = streams?.[0];

    if (!streamData) {

      if (streamerData.isLive) {
        await handleStreamerOffline(streamerEntry, member, channel, streamerData, bot, serverConfig);
      }
      continue;
    }

    if (!streamerData.isLive || bootUpCheck) {
      await handleStreamerLive(streamData, streamerEntry, member, channel, streamerData, bot, serverConfig);
    } else {
      await updateLiveStreamInfo(streamData, streamerEntry, channel, streamerData);
    }
  }

  bootUpCheck = false;
}
async function startTwitchCheck(bot) {
  await initializeTwitchHeaders();

  bot.guilds.cache.forEach(g => {
    checkMultipleStreamers(bot, g.id);
  });

  setInterval(() => {
    bot.guilds.cache.forEach(g => {
      checkMultipleStreamers(bot, g.id);
    });
  }, CHECK_INTERVAL);
}

module.exports = { startTwitchCheck };

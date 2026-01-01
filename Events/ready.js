const { ActivityType, EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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
const InVocal = require("../models/inVocal")
const { voiceUsers, initializeXpDistributionInterval } = require('../models/shared');
const moment = require('moment-timezone');
const { verifierEtLancerJeuxBingo } = require('../bingoFunctions');
const fs = require('fs');
const { startTwitchCheck } = require('../twitch');
const { networkInterfaces, hostname } = require("os");
const { startComplianceTicker } = require("../utils/complianceTicker");
const ApexStats = require("../models/apexStats");
const { updateApexStatsAutomatically } = require("../utils/apexAuto");
const axios = require("axios");

module.exports = {
  name: "ready",
  async execute(bot, member) {
    startComplianceTicker(bot);
    
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

    // Lancer le Bingo + la vérif Twitch
    verifierEtLancerJeuxBingo(bot);
    const serverId = '716810235985133568';
    
    //Si un membre est dans un vocal, l'enregistrer pour qu'il gagne a nouveau l'xp et calcul du temps en vocal
    function isEligibleChannel(guild, channel) {
      if (!channel) return false;
      if (guild?.afkChannelId && guild.afkChannelId === channel.id) return false;
      return channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice;
    }
    async function rehydrateVoicePresence(bot) {
      for (const [, guild] of bot.guilds.cache) {
        await guild.members.fetch().catch(() => {});
        await guild.channels.fetch().catch(() => {});

        for (const [, channel] of guild.channels.cache) {
          if (!isEligibleChannel(guild, channel)) continue;

          for (const [, member] of channel.members) {
            if (member.user.bot) continue;

            await InVocal.updateOne(
              { discordId: member.id, serverId: guild.id },
              {
                $set:   { username: member.user.tag, vocalName: channel.name },
                $setOnInsert: { joinTimestamp: moment().tz("Europe/Paris").toDate() },
              },
              { upsert: true }
            ).catch(() => {});

            voiceUsers.set(member.id, { joinTimestamp: Date.now(), serverId: guild.id });
            await sleep(25);
          }
        }
      }
    }
    await rehydrateVoicePresence(bot);
    initializeXpDistributionInterval(bot);

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

    // Réinitialise/crée le message de playlist pour la musique
    async function resetMusicMessage(serverId) {
      const channelMusicId = '1136327173343559810';

      const channel = bot.channels.cache.get(channelMusicId) || await bot.channels.fetch(channelMusicId).catch(() => null);
      if (!channel) return console.error('Channel not found!');
      const guild = bot.guilds.cache.get(serverId) || await bot.guilds.fetch(serverId).catch(() => null);
      if (!guild) return console.error('Guild not found!');

      const newEmbed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle("――――――――∈ `MUSIQUES` ∋――――――――")
        .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
        .setDescription("**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.\n𝐔ne fois la playlist crée, n'oublie pas d'être dans le même salon que le BOT pour intéragir avec les différents boutons. (:")
        .setFooter({
          text: `𝐂ordialement, l'équipe ${guild.name}`,
          iconURL: guild.iconURL(),
        });

      const rowPlayOnly = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('PLAY_MUSIC')
          .setLabel('▶️')
          .setStyle(ButtonStyle.Success)
      );

      const musicEntry = await Music.findOne({ serverId }).catch(() => null);
      if (musicEntry && musicEntry.messageId) {
        const existingMsg = await channel.messages.fetch(musicEntry.messageId).catch(() => null);
        if (existingMsg) {
          await existingMsg.edit({ embeds: [newEmbed], components: [rowPlayOnly] }).catch(() => {});
          return existingMsg;
        }
      }

      const sent = await channel.send({ embeds: [newEmbed], components: [rowPlayOnly] }).catch(() => null);
      if (sent) {
        await Music.findOneAndUpdate(
          { serverId },
          { serverId, channelId: channel.id, messageId: sent.id },
          { upsert: true }
        ).catch(() => {});
      }
      return sent;
    }

    await resetMusicMessage(serverId);
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

    //Interval pour mettre a jour le salon vocal Minecraft
    const TBMPQF_SERVER_ID = '716810235985133568';
    setInterval(async () => {
      const server = bot.guilds.cache.get(TBMPQF_SERVER_ID);
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
          TwitchChannelID : null,
          TwitchChannelName : null,
          TwitchRoleName : null,
          TwitchRoleID : null,
          AnnoucementChannelID : null,
          AnnoucementChannelName : null,
          lastBumpMessageID: null,
        });
        await serverConfig.save();

        const NewServerembed = new EmbedBuilder()
          .setTitle(`\`𝐇ey! 𝐔n grand 𝐌𝐄𝐑𝐂𝐈\` 🙏`)
          .setColor("#ffc394")
          .setDescription(
            `𝐏our commencer à utiliser toutes mes fonctionnalités, tu peux à présent me configurer en utilisant la commande \`/setConfig\` si tu es __administrateur__ du serveur (au minimum).\n\`𝐍'oublie pas de me mettre tout en haut de ta liste de rôle ainsi qu'administrateur du serveur.\`\n 𝐎u tout simplement rajouté le rôle __le plus haut__ de ton serveur au **bot**.\n\n𝐏our toute autre question, n'hésite surtout pas à contacter \`tbmpqf\` mon créateur.\n\n\n__𝐀vec moi, ta communauté à accès__ :\n\n◟𝐒ystème d'expérience complet. (message + vocal)\n◟𝐒ystème d'avertissement, mute.\n◟𝐍otifications des lives **𝐓witch**.\n◟𝐒ystème de ticket.\n◟𝐒ystème de suggestion.\n◟𝐁ingo avec des récompenses exclusive.\n◟𝐒ystème de menu déroulant pour les rôles.\n◟𝐄t bien plus !!`
          )
          .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
          .setTimestamp()
          .setFooter({
            text: `𝐂ordialement, l'équipe de 𝐓𝐁𝐌_𝐂𝐏𝐔_𝐕𝟐`,
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
    function getBotOrigin() {
      const nets = networkInterfaces();
      let isLocal = true;
      
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (!net.internal && net.family === "IPv4") {
            isLocal = false;
            break;
          }
        }
        if (!isLocal) break;
      }

      const host = hostname();
      return isLocal ? `Local (${host})` : `Serveur (${host})`;
    }
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

                  const origin = getBotOrigin();
                  const connectEmbed = new EmbedBuilder()
                    .setDescription(
                      "**Je viens tout juste de me connecter. :warning:**"
                    )
                    .setColor("White")
                    .setFooter({ text: `丨${origin}` })
                    .setTimestamp();

                  if (connectMessages.size > 0) {
                    logChannel.bulkDelete(connectMessages).then(() => {
                      logChannel.send({ embeds: [connectEmbed] });
                    });
                  } else {
                    logChannel.send({ embeds: [connectEmbed] });
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
            text: `𝐂ordialement, l'équipe${bot.guilds.cache.get(serverId).name}`,
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
    const API_FOOTBALL_KEY = config.football_api;
    const PSG_TEAM_ID = 85;

    const MATCH_CHECK_INTERVAL = 60 * 1000; // 1 min
    const ROTATION_INTERVAL = 30 * 1000; // 30 sec
    const END_MATCH_DELAY = 20 * 60 * 1000; // 20 min

    let mode = "normal"; // normal | match
    let matchEndTimeout = null;
    let activityIndex = 0;


    const activities = [
      { name: "🎮 𝐀pex 𝐋egends", type: ActivityType.Playing },
      { name: "", type: ActivityType.Custom },
      { name: "S'entraine au padel", type: ActivityType.Custom },
      { name: "Cuit des pâtes", type: ActivityType.Custom },
      { name: "Cherche le bouton mute", type: ActivityType.Custom },
      { name: "Carry son équipe", type: ActivityType.Custom },
      { name: "Spam des émotes", type: ActivityType.Custom },
      { name: "Perd un duel qu'il maîtrisait", type: ActivityType.Custom },
      { name: "Fait semblant de travailler", type: ActivityType.Custom },
      { name: "Oublie pourquoi il est là", type: ActivityType.Custom },
      { name: "Lag mentalement", type: ActivityType.Custom },
      { name: "Rage silencieusement", type: ActivityType.Custom },
      { name: "Attend que ça passe", type: ActivityType.Custom },
      { name: "Réfléchit trop longtemps", type: ActivityType.Custom },
      { name: "Gagne de l'XP imaginaire", type: ActivityType.Custom },
      { name: "Écrit puis efface son message", type: ActivityType.Custom },
      { name: "Regarde le chat sans répondre", type: ActivityType.Custom },
      { name: "A une idée géniale (presque)", type: ActivityType.Custom },
      { name: "", type: ActivityType.Custom },
    ];

    async function getPSGMatch() {
      try {
        const res = await axios.get(
          "https://v3.football.api-sports.io/fixtures",
          {
            headers: {
              "x-apisports-key": API_FOOTBALL_KEY,
            },
            params: {
              team: PSG_TEAM_ID,
              last: 1,
            },
          }
        );

        return res.data.response[0] || null;
      } catch (err) {
        console.error("❌ API-Football error :", err.message);
        return null;
      }
    }

    async function updateMatchPresence(bot) {
      const match = await getPSGMatch();
      if (!match) return;

      const { fixture, teams, goals } = match;

      const isPSGHome = teams.home.id === PSG_TEAM_ID;
      const opponent = isPSGHome ? teams.away.name : teams.home.name;

      const psgGoals = isPSGHome ? goals.home : goals.away;
      const oppGoals = isPSGHome ? goals.away : goals.home;

      const status = fixture.status.short;
      const minute = fixture.status.elapsed;

      let suffix = null;

      if (status === "1H" || status === "2H") {
        suffix = `${minute}'`;
        mode = "match";
      } else if (status === "HT") {
        suffix = "MT";
        mode = "match";
      } else if (status === "FT") {
        suffix = "FT";
        mode = "match";

        if (!matchEndTimeout) {
          matchEndTimeout = setTimeout(() => {
            mode = "normal";
            matchEndTimeout = null;
          }, END_MATCH_DELAY);
        }
      } else {
        return;
      }

      bot.user.setPresence({
        activities: [
          {
            name: `⚽丨PSG ${psgGoals} - ${oppGoals} ${opponent} (${suffix})`,
            type: ActivityType.Custom,
          },
        ],
        status: "dnd",
      });
    }

    setInterval(() => {
      if (mode !== "normal") return;

      let activity = activities[activityIndex];

      if (activityIndex === 1) {
        activity.name = `🌐丨${bot.guilds.cache.size} 𝐒erveurs`;
      }

      if (activityIndex === 18) {
        const totalMembers = bot.guilds.cache.reduce(
          (acc, guild) => acc + guild.memberCount,
          0
        );
        activity.name = `👥丨${totalMembers} 𝐌embres`;
      }

      bot.user.setPresence({
        activities: [activity],
        status: "dnd",
      });

      activityIndex = (activityIndex + 1) % activities.length;
    }, ROTATION_INTERVAL);

    setInterval(() => {
      updateMatchPresence(bot);
    }, MATCH_CHECK_INTERVAL);

    // Même emoji lors d'un emoji react
    bot.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      try {
        if (!reaction.message.partial) {
          await reaction.message.fetch();
        }
        if (!reaction.partial) {
          await reaction.fetch();
        }
        await reaction.message.react(reaction.emoji);
      } catch (error) {
        console.error('Erreur lors de la réaction automatique :', error);
      }
    });
    startTwitchCheck(bot);
  },
};

// Mise a jour du nombre de joueurs sur le serveur Minecraft
let consecutiveFailures = 0;
const MAX_RETRIES = 5;
const BASE_DELAY = 180000; // 3 minutes

async function updateCategoryMinecraft(server, retryCount = 0) {
  try {
    const category = server.channels.cache.find(channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name.startsWith("丨MINECRAFT丨")
    );

    if (!category) {
      console.warn("[MINECRAFT] Catégorie introuvable sur le serveur.");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://api.mcsrvstat.us/3/${MINECRAFT_SERVER_DOMAIN}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`[MINECRAFT] Erreur HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.online) {
      const playerCount = data.players?.online ?? 0;
      const maxPlayers = data.players?.max ?? "?";
      await category.setName(`丨MINECRAFT丨 ${playerCount} / ${maxPlayers}`);
      if (consecutiveFailures > 0) console.log("[MINECRAFT] Mise à jour réussie après des erreurs précédentes.");
      consecutiveFailures = 0;
    } else {
      await category.setName(`丨MINECRAFT丨 OFFLINE`);
      
    }
  } catch (error) {
    await handleFailure(server, retryCount, error);
  }
}

async function handleFailure(server, retryCount, error) {
  if (error.name === "AbortError") {
    console.warn("[MINECRAFT] Requête annulée après 10s de timeout.");
  } else if (error.code === "ETIMEDOUT") {
    console.warn("[MINECRAFT] Timeout lors de la récupération des données.");
  } else {
    console.error("[MINECRAFT] Erreur inconnue :", error.message || error);
  }

  consecutiveFailures++;
  console.warn(`[MINECRAFT] Échecs consécutifs : ${consecutiveFailures}/${MAX_RETRIES}.`);

  if (retryCount < MAX_RETRIES) {
    const delay = BASE_DELAY * (retryCount + 1);
    console.log(`[MINECRAFT] Nouvelle tentative dans ${Math.floor(delay / 1000)} secondes...`);
    setTimeout(() => updateCategoryMinecraft(server, retryCount + 1), delay);
  } else {
    console.error("[MINECRAFT] Trop d’échecs, nouvelle tentative reportée dans 3h.");
    setTimeout(() => updateCategoryMinecraft(server, 0), 3 * 60 * 60 * 1000);
  }
}

// Mise à jour du nombre de personnes connectées sur le serveur
const onlineUpdateLocks = new Map();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function withRetries(fn, { retries = 2, baseDelay = 800 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (e?.code === 'UND_ERR_CONNECT_TIMEOUT' || e?.name === 'ConnectTimeoutError') {
        if (i < retries) { await sleep(baseDelay * (i + 1)); continue; }
      }
      throw e;
    }
  }
  throw lastErr;
}
async function updateVoiceChannelServer(guild) {
  if (!guild || !guild.id) return;
  if (onlineUpdateLocks.get(guild.id)) return;
  onlineUpdateLocks.set(guild.id, true);

  let channel;
  try {
    let approx = await withRetries(() => guild.fetch({ withCounts: true }).catch(() => null));
    let onlineMembers = approx?.approximatePresenceCount ?? 0;
    let memberCount   = approx?.approximateMemberCount ?? (guild.memberCount ?? 0);

    try {
      await withRetries(() => guild.members.fetch({ withPresences: true }));
      const filtered = guild.members.cache.filter(
        (m) => !m.user.bot && ['online', 'idle', 'dnd'].includes(m.presence?.status)
      );
      onlineMembers = filtered.size;
      memberCount   = guild.members.cache.filter(m => !m.user.bot).size;
    } catch (e) {
      if (e?.code === 'UND_ERR_CONNECT_TIMEOUT' || e?.name === 'ConnectTimeoutError') {
        console.warn("[ONLINE] members.fetch timeout — fallback aux compteurs approximatifs.");
      } else {
        console.warn("[ONLINE] members.fetch échec — fallback aux compteurs approximatifs.", e?.message);
      }
    }

    channel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildVoice && c.name.startsWith("丨𝐎n𝐋ine")
    );
    if (!channel) {
      channel = await withRetries(() => guild.channels.create({
        name: "丨𝐎n𝐋ine",
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        ],
      }));
    }

    const newName = `丨𝐎n𝐋ine ${onlineMembers} / ${memberCount}`;
    if (channel.name !== newName) {
      await withRetries(() => channel.setName(newName));
    }

  } catch (error) {
    if (error?.code === 'UND_ERR_CONNECT_TIMEOUT' || error?.name === 'ConnectTimeoutError') {
      console.warn("[ONLINE] Timeout réseau — mise à jour reportée.");
      return;
    }
    console.error("[ONLINE] Erreur lors de la mise à jour du salon vocal:", error);
    if (channel) {
      channel.setName("丨𝐎n𝐋ine").catch((err) =>
        console.error("[ONLINE] Impossible de réinitialiser le nom du canal:", err)
      );
    }
  } finally {
    onlineUpdateLocks.delete(guild.id);
  }
}

// Update RP d'Apex Legends toutes les 5 minutes
function getTodayAt4AM() {
  const d = new Date();
  d.setHours(4, 0, 0, 0);
  return d;
}
function getMondayAt4AM() {
  const d = new Date();
  const day = d.getDay(); // 0 = dimanche, 1 = lundi
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(4, 0, 0, 0);
  return d;
}
function shouldResetDaily(lastResetAt) {
  const today4 = getTodayAt4AM();
  if (Date.now() < today4.getTime()) return false; // pas encore 04h
  if (!lastResetAt) return true;
  return new Date(lastResetAt) < today4;
}
function shouldResetWeekly(lastResetAt) {
  const monday4 = getMondayAt4AM();
  if (Date.now() < monday4.getTime()) return false; // pas encore lundi 04h
  if (!lastResetAt) return true;
  return new Date(lastResetAt) < monday4;
}
setInterval(async () => {
  try {
    const users = await ApexStats.find({});
    let dailyResets = 0;
    let weeklyResets = 0;

    for (const user of users) {
      let changed = false;

      if (shouldResetDaily(user.dailyResetAt)) {
        user.dailyRpGained = 0;
        user.dailyResetAt = new Date();
        changed = true;
        dailyResets++;
      }

      if (shouldResetWeekly(user.weeklyResetAt)) {
        user.weeklyRpGained = 0;
        user.weeklyResetAt = new Date();
        changed = true;
        weeklyResets++;
      }

      if (!user.server) {
        user.server = user.server || "Unknown";
      }
      if (changed) await user.save();
    }
  } catch (err) {
    console.error("[APEX RESET] Error:", err);
  }
}, 60 * 1000);
setInterval(() => {
  updateApexStatsAutomatically().catch(err =>
    console.error("[APEX AUTO] Update error:", err)
  );
}, 5 * 60 * 1000);
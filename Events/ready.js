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

    // Vérification des membres et serveurs + ajout BDD + rôle welcome
    const SLEEP_MS = 120;
    const envBool = (name, def = false) => {
      const v = String(process.env[name] ?? "").trim().toLowerCase();
      if (["1","true","yes","y","on"].includes(v))  return true;
      if (["0","false","no","n","off"].includes(v)) return false;
      return def;
    };

    const DO_SYNC_ON_BOOT = envBool("SYNC_ON_BOOT", false); // Mettre SYNC_ON_BOOT=true pour activer la synchro au démarrage
    const DEBUG_INIT      = envBool("DEBUG_INIT", true); // logs verbeux si true
    const C = {
      dim: s => `\x1b[2m${s}\x1b[0m`,
      gray: s => `\x1b[90m${s}\x1b[0m`,
      green: s => `\x1b[32m${s}\x1b[0m`,
      yellow: s => `\x1b[33m${s}\x1b[0m`,
      red: s => `\x1b[31m${s}\x1b[0m`,
      cyan: s => `\x1b[36m${s}\x1b[0m`,
      magenta: s => `\x1b[35m${s}\x1b[0m`,
      bold: s => `\x1b[1m${s}\x1b[0m`,
    };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function normalizeStored(val) {
      if (!val) return { id: undefined, name: undefined };
      if (Array.isArray(val)) return { id: val[0], name: val[1] };
      if (typeof val === "string") return { id: val, name: undefined };
      return { id: undefined, name: undefined };
    }
    async function fetchRoleRewardsByPrestige(serverID) {
      const doc = await ServerRole.findOne({ serverID });
      const out = {};
      for (let p = 0; p <= 10; p++) out[p] = [];
      if (!doc) return out;

      for (let p = 0; p <= 10; p++) {
        const data = doc[`prestige${p}Roles`];
        if (data && typeof data.get === "function") {
          data.forEach((rawVal, lvlKey) => {
            const { id, name } = normalizeStored(rawVal);
            const lvl = Number(lvlKey);
            if (Number.isFinite(lvl) && id) out[p].push({ level: lvl, roleId: id, roleName: name || "" });
          });
        } else if (data && typeof data === "object" && !Array.isArray(data)) {
          Object.entries(data).forEach(([lvlKey, rawVal]) => {
            const { id, name } = normalizeStored(rawVal);
            const lvl = Number(lvlKey);
            if (Number.isFinite(lvl) && id) out[p].push({ level: lvl, roleId: id, roleName: name || "" });
          });
        }
        out[p].sort((a, b) => a.level - b.level);
      }
      return out;
    }
    function pickRewardForLevel(rewards, level) {
      let chosen = null;
      for (const r of rewards) { if (r.level <= level) chosen = r; else break; }
      return chosen;
    }
    async function syncMemberPrestigeRole(guild, member, rewardsByPrestige, userDoc, welcomeRole) {
      const p = Math.max(0, Number(userDoc?.prestige) || 0);
      const l = Math.max(p > 0 ? 1 : 0, Number(userDoc?.level) || 0);

      const me = guild.members.me;
      if (!me || !me.permissions.has(PermissionFlagsBits.ManageRoles)) return { removed: 0, added: false };

      // ensemble de tous les rôles "récompense"
      const allRewardIds = new Set();
      for (const arr of Object.values(rewardsByPrestige)) for (const r of arr) if (r.roleId) allRewardIds.add(r.roleId);
      if (welcomeRole && !allRewardIds.has(welcomeRole.id)) allRewardIds.add(welcomeRole.id);

      const rewards = rewardsByPrestige[p] || [];
      let chosen = pickRewardForLevel(rewards, l);
      if (!chosen && p === 0 && l >= 1 && welcomeRole) {
        chosen = { roleId: welcomeRole.id, level: 1, roleName: welcomeRole.name };
      }

      const cache = member.roles.cache;
      const toRemove = [...allRewardIds].filter(id => (!chosen || id !== chosen.roleId) && cache.has(id));
      let removed = 0;
      if (toRemove.length) {
        const editable = toRemove.filter(id => guild.roles.cache.get(id)?.editable);
        if (editable.length) {
          await member.roles.remove(editable).catch(() => {});
          removed = editable.length;
          await sleep(SLEEP_MS);
        }
      }

      let added = false;
      if (chosen && !cache.has(chosen.roleId)) {
        const roleObj = guild.roles.cache.get(chosen.roleId) || await guild.roles.fetch(chosen.roleId).catch(() => null);
        if (roleObj?.editable) {
          await member.roles.add(roleObj).catch(() => {});
          added = true;
          await sleep(SLEEP_MS);
        }
      }
      return { removed, added };
    }
    function banner(title) {
      const line = "─".repeat(title.length + 2);
      console.log(C.cyan(`┌${line}┐`));
      console.log(C.cyan(`│ ${C.bold(title)} │`));
      console.log(C.cyan(`└${line}┘`));
    }
    function guildLine({ name, upserts, synced, errorsUpsert, errorsRole, ms }) {
      const base = `${C.bold(name)}  ${C.green("✓ upserts:")} ${upserts}  ${C.green("✓ roles:")} ${synced}`;
      const errs = (errorsUpsert || errorsRole)
        ? `  ${errorsUpsert ? C.yellow(`⚠ upsert:${errorsUpsert}`) : ""}${errorsRole ? C.yellow(`  ⚠ roles:${errorsRole}`) : ""}`
        : "";
      const time = `  ${C.dim(`${ms}ms`)}`;
      console.log(` • ${base}${errs}${time}`);
    }
    async function initializeServersAndUsers(bot) {
      if (!DO_SYNC_ON_BOOT) {
        banner("Initialisation SKIPPED");
        console.log(C.gray(" • Raison : SYNC_ON_BOOT=false (aucune synchro au démarrage)\n"));
        return;
      }
      banner("Initialisation serveurs & utilisateurs");
      console.log(C.gray(" • SYNC_ON_BOOT=true  → synchro au démarrage activée\n"));

      const t0 = Date.now();
      let totalUpserts = 0, totalSynced = 0, totalErrUpsert = 0, totalErrRole = 0;

      for (const [, guild] of bot.guilds.cache) {
        const g0 = Date.now();

        // Upsert config (léger)
        const serverConfig = await ServerConfig.findOneAndUpdate(
          { serverID: guild.id },
          {
            $setOnInsert: { serverID: guild.id },
            $set: { serverName: guild.name }
          },
          { upsert: true, new: true }
        );

        // Welcome role fallback (P0/L1)
        let welcomeRole = null;
        if (serverConfig.roleWelcomeID) {
          welcomeRole = guild.roles.cache.get(serverConfig.roleWelcomeID)
            || await guild.roles.fetch(serverConfig.roleWelcomeID).catch(() => null);
        }
        if (!welcomeRole && serverConfig.roleWelcomeName) {
          welcomeRole = guild.roles.cache.find(r => r.name === serverConfig.roleWelcomeName) || null;
        }

        // mapping récompenses
        const rewardsByPrestige = await fetchRoleRewardsByPrestige(guild.id);

        // charge membres (sans presences)
        try { await guild.members.fetch(); }
        catch (e) { if (DEBUG_INIT) console.warn(C.yellow(`[init] fetch members ${guild.name}: ${e?.code || e?.message}`)); }

        const members = guild.members.cache.filter(m => !m.user.bot);
        let upserts = 0, synced = 0, errUpsert = 0, errRole = 0;

        for (const member of members.values()) {
          // Upsert user compact (évite le conflit mongoose)
          try {
            await User.updateOne(
              { userID: member.id, serverID: guild.id },
              {
                $setOnInsert: {
                  userID: member.id,
                  serverID: guild.id,
                  joinedAt: member.joinedAt,
                },
                $set: {
                  username: member.user.tag,
                  serverName: guild.name,
                },
              },
              { upsert: true, setDefaultsOnInsert: true }
            );
            upserts++;
          } catch (err) {
            errUpsert++;
            if (DEBUG_INIT) console.warn(C.yellow(`[init] upsert ${member.user.tag}: ${err?.message || err}`));
          }

          try {
            const u = await User.findOne({ userID: member.id, serverID: guild.id }).lean();
            await syncMemberPrestigeRole(guild, member, rewardsByPrestige, u, welcomeRole);
            synced++;
          } catch (err) {
            errRole++;
            if (DEBUG_INIT) console.warn(C.yellow(`[init] roleSync ${member.user.tag}: ${err?.message || err}`));
          }
        }

        totalUpserts += upserts; totalSynced += synced;
        totalErrUpsert += errUpsert; totalErrRole += errRole;

        guildLine({
          name: guild.name,
          upserts, synced,
          errorsUpsert: errUpsert, errorsRole: errRole,
          ms: Date.now() - g0,
        });
      }

      const dt = Date.now() - t0;
      const summary =
        `${C.green("✓ upserts:")} ${totalUpserts}  ${C.green("✓ roles:")} ${totalSynced}` +
        (totalErrUpsert || totalErrRole
          ? `  ${C.yellow("⚠ upsert:")} ${totalErrUpsert}  ${C.yellow("⚠ roles:")} ${totalErrRole}`
          : "");
      console.log(C.cyan("─".repeat(60)));
      console.log(` ${summary}   ${C.dim(`${dt}ms`)}`);
      console.log(C.cyan("─".repeat(60)));
    }
    await initializeServersAndUsers(bot);

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
        .setDescription("**𝐋a playlist est vide pour le moment**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.\n𝐔ne fois la playlist crée, n'oublie pas d'être dans le même salon que le BOT pour intéragir avec les différents boutons. (:")
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


// Mise a jour des RP Apex Legends
async function updateApexStatsAutomatically() {

  const users = await ApexStats.find({});
  if (!users.length) return;

  for (const user of users) {
    try {
      const API_URL = `https://api.mozambiquehe.re/bridge?auth=${config.apex_api}&player=${encodeURIComponent(user.gameUsername)}&platform=${user.platform}`;
      const { data: stats } = await axios.get(API_URL, { timeout: 10_000 });

      const rankScore = stats?.global?.rank?.rankScore ?? null;
      if (rankScore === null) continue;

      if (user.lastRankScore === null) {
        user.lastRankScore = rankScore;
        user.dailyDiff = 0;
        await user.save();
        continue;
      }

      const diff = rankScore - user.lastRankScore;

      if (diff !== 0) {
        user.dailyDiff += diff;
        user.lastRankScore = rankScore;
        await user.save();
      }
    } catch (err) {
      console.error(`[APEX AUTO] Erreur lors de la mise à jour de ${user.username} :`, err.message || err);
    }
  }
}

setInterval(updateApexStatsAutomatically, 5 * 60 * 1000);
async function resetDailyApexRP() {
  const now = new Date();
  if (now.getHours() === 2 && now.getMinutes() === 0) {
    console.log("[APEX AUTO] Reset des gains journaliers...");
    await ApexStats.updateMany({}, { dailyDiff: 0 });
    console.log("[APEX AUTO] Reset terminé !");
  }
}

setInterval(resetDailyApexRP, 60 * 1000);
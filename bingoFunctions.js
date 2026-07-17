const { EmbedBuilder, ChannelType } = require("discord.js");
const Bingo = require("./models/bingo");
const ServerConfig = require("./models/serverConfig");
const User = require('./models/experience');
const levelUp = require('./models/levelUp');
let isFirstSchedulerSweep = true;

const ETAT_DB = {
  ACTIF: '𝐀𝐂𝐓𝐈𝐅',
  INACTIF: '𝐈𝐍𝐀𝐂𝐓𝐈𝐅',
};
const getAvatar = (user) => user?.displayAvatarURL?.({ size: 128, extension: 'png' }) ?? null;
const MINUTES_MODE = false;
const HOURS_BLOCKED = { start: 0, end: 7 };

function intervalleAleatoire(min, max) {
  if (MINUTES_MODE) {
    const minMs = min * 60 * 1000;
    const maxMs = max * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
  } else {
    const minMs = min * 24 * 60 * 60 * 1000;
    const maxMs = max * 24 * 60 * 60 * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
  }
}
async function ajouterXPUtilisateur(userId, guildId, xpAjouter, bot) {
  try {
    const user = await User.findOne({ userID: userId, serverID: guildId });
    if (!user) return;

    user.xp += xpAjouter;
    await user.save();

    const guild = bot.guilds.cache.get(guildId);
    if (!guild) return;

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    await levelUp({ guild, member, author: member.user }, user, user.xp);
  } catch (error) {
    console.error("[XP BINGO] Erreur lors de l'ajout des XP :", error);
  }
}
async function ajouterFalconixUtilisateur(userId, guildId, elapsedSeconds = 0, totalAttempts = 0) {
  try {
    const user = await User.findOne({ userID: userId, serverID: guildId });
    if (!user) return null;

    let base = 0.0005 + Math.random() * 0.001;
    let speedBonus = Math.max(1, 2.5 - (elapsedSeconds / 90));
    let attemptMalus = Math.max(0.6, 1.3 - totalAttempts / 70);
    let finalFalconix = base * speedBonus * attemptMalus;
    finalFalconix = Math.max(0.0004, Math.min(finalFalconix, 0.0035));

    finalFalconix = parseFloat(finalFalconix.toFixed(5));

    const currentFalconix = Number(user.falconix) || 0;
    user.falconix = parseFloat((currentFalconix + finalFalconix).toFixed(5));
    await user.save();

    return finalFalconix;
  } catch (error) {
    console.error("Erreur lors de l'ajout des Falconix :", error);
    return null;
  }
}
async function resolveBingoChannel(bot, guildId) {
  const guild = bot.guilds.cache.get(guildId);
  if (!guild) return null;

  const cfg = await ServerConfig.findOne({ serverID: guildId });
  const byId = cfg?.bingoChannelID;
  const bingoDoc = await Bingo.findOne({ serverID: guildId });
  const byName = bingoDoc?.bingoChannelName;

  let channel = null;

  if (byId) {
    channel = guild.channels.cache.get(byId) || await guild.channels.fetch(byId).catch(() => null);
    if (!channel) {
      await ServerConfig.updateOne({ serverID: guildId }, { $unset: { bingoChannelID: "" } });
      console.warn(`[BINGO] ID de salon invalide, purge: ${byId} @ ${guildId}`);
    }
  }

  if (!channel && byName) {
    channel = guild.channels.cache.find(c => c.name === byName) || null;
    if (!channel) {
      const all = await guild.channels.fetch().catch(() => null);
      if (all) channel = [...all.values()].find(c => c.name === byName) || null;
    }
    if (channel) {
      await ServerConfig.updateOne(
        { serverID: guildId },
        { $set: { bingoChannelID: channel.id, bingoChannelName: channel.name } },
        { upsert: true }
      );
      await Bingo.updateOne(
        { serverID: guildId },
        { $set: { bingoChannelName: channel.name } },
        { upsert: true }
      );
    }
  }

  if (channel && channel.type !== ChannelType.GuildText) {
    console.warn(`[BINGO] Le salon résolu n’est pas textuel: ${channel.id} (${channel.type})`);
  }

  return channel;
}
function isHourBlocked(date = new Date()) {
  const hour = date.getHours();
  const { start, end } = HOURS_BLOCKED;

  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}
function generateNextAllowedBingo(minDays = 2, maxDays = 5) {
  let next;
  do {
    next = new Date(Date.now() + intervalleAleatoire(minDays, maxDays));
  } while (isHourBlocked(next)); 
  return next;
}
function buildHints(bingoNumber, getClosest) {
  return [
    {
      delay: 60000, // 1 min
      make: () => {
        const parity = bingoNumber % 2 === 0 ? "pair" : "impair";
        return `💡**丨**𝐈ndice 1 : le nombre mystère est **${parity}**.`;
      },
    },
    {
      delay: 120000, // 2 min
      make: () => {
        const half = bingoNumber <= 250 ? "entre **1** et **250**" : "entre **251** et **500**";
        return `💡**丨**𝐈ndice 2 : le nombre mystère est ${half}.`;
      },
    },
    {
      delay: 180000, // 3 min
      make: () => {
        const bucketStart = Math.floor((bingoNumber - 1) / 50) * 50 + 1;
        const bucketEnd = bucketStart + 49;
        return `💡**丨**𝐈ndice 3 : le nombre mystère est entre **\`${bucketStart}\`** et **\`${bucketEnd}\`**.`;
      },
    },
    {
      delay: 240000, // 4 min
      make: () => {
        const closest = getClosest();
        if (closest?.guess != null) {
          const direction = closest.guess < bingoNumber ? "plus grand" : "plus petit";
          return `💡**丨**𝐈ndice 4 : la meilleure proposition jusqu'ici était **\`${closest.guess}\`** — le nombre mystère est **${direction}**.`;
        }
        const bucketStart = Math.floor((bingoNumber - 1) / 10) * 10 + 1;
        const bucketEnd = bucketStart + 9;
        return `💡**丨**𝐈ndice 4 : le nombre mystère est entre **\`${bucketStart}\`** et **\`${bucketEnd}\`**.`;
      },
    },
  ];
}

const activeGuildRuns = new Set();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const DELETE_GUESS_DELAY_MS = 500;

async function lancerJeuBingo(guildId, bot) {
  if (!guildId) return;

  if (activeGuildRuns.has(guildId)) {
    console.log(`[BINGO] Manche déjà en cours pour ${guildId}, skip.`);
    return;
  }

  const channel = await resolveBingoChannel(bot, guildId);
  if (!channel) {
    console.warn(`[BINGO] Aucun salon configuré. Manche annulée pour ${guildId}.`);
    return;
  }
  try {
    async function fetchAllBingoMessages(channel, maxMessages = 5000) {
      let lastId = null;
      const all = [];

      while (all.length < maxMessages) {
        const fetchLimit = Math.min(100, maxMessages - all.length);

        const fetched = await channel.messages.fetch({
          limit: fetchLimit,
          ...(lastId ? { before: lastId } : {})
        }).catch(() => null);

        if (!fetched || fetched.size === 0) break;

        const filtered = fetched.filter(m =>
          m.author.bot && m.embeds.length > 0 && (
            m.embeds[0].title?.startsWith('🎉◟𝐁ingo 𝐓ime!') ||
            m.embeds[0].title?.startsWith('⏳◟𝐁ingo 𝐓erminé') ||
            m.embeds[0].author?.name?.includes('◟𝐁ingo 𝐆agné')
          )
        );

        all.push(...filtered.values());

        lastId = fetched.last().id;
        if (!lastId) break;
      }

      return all;
    }

    try {
      const bingoMessages = await fetchAllBingoMessages(channel, 5000);

      for (const msg of bingoMessages) {
        await msg.delete().catch(() => {});
        await sleep(100);
      }
    } catch (e) {
      console.warn(`[BINGO] Impossible de supprimer les anciens messages de bingo :`, e.message);
    }
  } catch (e) {
    console.warn(`[BINGO] Impossible de supprimer les anciens messages de bingo :`, e.message);
  }

  activeGuildRuns.add(guildId);

  const bingoNumber = Math.floor(Math.random() * 500) + 1;
  const startTime = Date.now();
  let bingoWinner = null;

  const messagesGagnant = [
  `🎉**丨**𝐈ncroyable, tu as trouvé le nombre mystère **\`${bingoNumber}\`**. 𝐓u gagnes X Falconix!`,
  `🥳**丨**𝐁ravo, tu as le don de deviner, le nombre mystère était **\`${bingoNumber}\`**! 𝐓u récupères X Falconix!`,
  `🎊**丨**𝐓u es un véritable devin! Le nombre mystère était **\`${bingoNumber}\`**. 𝐓u empoches X Falconix!`,
  `🎉**丨**𝐅élicitations ! Le nombre était **\`${bingoNumber}\`**. 𝐓u gagnes X Falconix!`,
  `🍀**丨**𝐋a chance t'appelle par ton prénom : **\`${bingoNumber}\`** ! 𝐄mpoche X Falconix!`,
  `🧠**丨**𝐂alcul mental niveau grand maître : **\`${bingoNumber}\`**… ça tombe juste. X Falconix!`,
  `🎯**丨**𝐂ible parfaite : **\`${bingoNumber}\`**. 𝐓ir groupé sur X Falconix!`,
  `🚀**丨**𝐃écollage réussi, cap sur **\`${bingoNumber}\`** et X Falconix!`,
  `🔮**丨**𝐋a boule de cristal était claire : **\`${bingoNumber}\`**. 𝐑écompense : X Falconix!`,
  `🧩**丨**𝐃ernière pièce trouvée : **\`${bingoNumber}\`**. 𝐏uzzle complété, X Falconix!`,
  `⚡**丨**𝐑éflexe éclair : **\`${bingoNumber}\`** ! 𝐓u ramasses X Falconix!`,
  `🕵️**丨**𝐀bracadabra… **\`${bingoNumber}\`** ! 𝐄t hop, X Falconix dans la besace!`,
  `🐱‍👤**丨**𝐀ttaque furtive réussie : **\`${bingoNumber}\`**. 𝐁utin : X Falconix!`,
  `🏆**丨**𝐏odium réservé : **\`${bingoNumber}\`**. 𝐌édaille + X Falconix!`,
  `🎰**丨**𝐉ackpot numérique : **\`${bingoNumber}\`** ! Ça paye X Falconix!`,
  `📈**丨**𝐓es stats explosent : **\`${bingoNumber}\`**. 𝐃ividende : X Falconix!`,
  `🐟**丨**𝐅erré du premier coup : **\`${bingoNumber}\`** ! 𝐏rise du jour : X Falconix!`,
  `🎲**丨**𝐋e dé roulait pour toi : **\`${bingoNumber}\`**. 𝐌ise gagnante : X Falconix!`,
  `👑**丨**𝐋e trône te revient : **\`${bingoNumber}\`** ! 𝐓résor royal : X Falconix!`,
  `🍯**丨**𝐒ucré comme une victoire : **\`${bingoNumber}\`**. 𝐏ot de miel : X Falconix!`,
  `🧲**丨**𝐀ttiré comme un aimant vers **\`${bingoNumber}\`** ! 𝐁utin magnétique : X Falconix!`,
  `🥷**丨**𝐓echnique ninja imparable : **\`${bingoNumber}\`**. 𝐑écompense discrète : X Falconix!`,
  `🎈**丨**𝐓u t'envoles avec **\`${bingoNumber}\`** ! 𝐋est largué, gain : X Falconix!`,
  `🦊**丨**𝐑usé comme un renard, **\`${bingoNumber}\`** n'avait aucune chance. 𝐁utin : X Falconix!`,
  `🌟**丨**𝐄toile filante repérée : **\`${bingoNumber}\`**. 𝐕œu exaucé, X Falconix!`,
  `🥇**丨**𝐌édaille d'or méritée : **\`${bingoNumber}\`** ! 𝐏rime : X Falconix!`,
  `🍾**丨**𝐎n débouche le champagne pour **\`${bingoNumber}\`** ! 𝐓ournée générale : X Falconix!`,
  `🧨**丨**𝐄xplosion de chance sur **\`${bingoNumber}\`** ! 𝐑etombées : X Falconix!`,
];

const messagesPerdant = [
  `⏳**丨**𝐓emps écoulé, le nombre mystère **\`${bingoNumber}\`** s'est éclipsé !`,
  `😢**丨**𝐃ommage, le nombre mystère **\`${bingoNumber}\`** s'est volatilisé.`,
  `🏖️**丨**𝐀ujourd'hui, la chance était en congé ! 𝐂'était **\`${bingoNumber}\`**.`,
  `🏃**丨**𝐃écidément… le nombre **\`${bingoNumber}\`** s'est fait la malle.`,
  `⌛**丨**𝐋e sablier est vide… c'était **\`${bingoNumber}\`**. 𝐎n remet une pièce ?`,
  `🕯️**丨**𝐒oufflé comme une bougie : **\`${bingoNumber}\`** a disparu.`,
  `🥷**丨**𝐋e nombre **\`${bingoNumber}\`** était en planque. 𝐁elle filature, mais trop tard !`,
  `🐌**丨**𝐔n poil trop lent : **\`${bingoNumber}\`** t'a filé entre les doigts.`,
  `🥶**丨**𝐅roid, très froid… la bonne réponse était **\`${bingoNumber}\`**.`,
  `🚪**丨**𝐋a porte s'est refermée : **\`${bingoNumber}\`** est passé juste avant toi.`,
  `🎭**丨**𝐌asqué jusqu'au bout : **\`${bingoNumber}\`**. 𝐑ideau pour cette manche !`,
  `🍂**丨**𝐂omme une feuille au vent… **\`${bingoNumber}\`** s'est envolé.`,
  `🍦**丨**𝐈l a fondu sous tes yeux : **\`${bingoNumber}\`**. 𝐂ourage, ça revient !`,
  `😅**丨**𝐏resque ! 𝐋a réponse était **\`${bingoNumber}\`**. 𝐎n retente ?`,
  `📉**丨**𝐓endance baissière aujourd'hui… le bon chiffre : **\`${bingoNumber}\`**.`,
  `🕯️**丨**𝐎n éteint les espoirs pour cette fois : **\`${bingoNumber}\`**. 𝐍ouveau tour bientôt !`,
  `🐢**丨**𝐋a tortue a fini avant toi : **\`${bingoNumber}\`**. 𝐋a prochaine sera la bonne !`,
  `🎣**丨**𝐓u as pêché à côté : **\`${bingoNumber}\`** nageait plus loin.`,
  `🌫️**丨**𝐍oyé dans le brouillard : **\`${bingoNumber}\`** t'a échappé.`,
  `🎪**丨**𝐋e cirque est reparti sans toi : **\`${bingoNumber}\`** était le numéro gagnant.`,
  `🧊**丨**𝐆elé sur la ligne de départ : **\`${bingoNumber}\`** est passé sans toi.`,
  `🚂**丨**𝐋e train est parti sans toi : **\`${bingoNumber}\`** était à quai.`,
  `🪁**丨**𝐓on cerf-volant s'est décroché : **\`${bingoNumber}\`** s'est envolé loin.`,
  `🎁**丨**𝐌auvais paquet ouvert : **\`${bingoNumber}\`** était dans l'autre.`,
  `🦥**丨**𝐔n peu trop paresseux cette fois : **\`${bingoNumber}\`** t'a devancé.`,
  `🌪️**丨**𝐄mporté par le vent : **\`${bingoNumber}\`** a disparu dans la tempête.`,
  `🔦**丨**𝐋a lampe s'est éteinte trop tôt : c'était **\`${bingoNumber}\`**.`,
  `🎳**丨**𝐒trike manqué de peu : **\`${bingoNumber}\`** est resté debout.`,
];

  const bingoEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🎉◟𝐁ingo 𝐓ime!')
    .setDescription(':8ball:丨𝐓rouve le nombre mystère entre **1** et **500** dans les prochaines `5 minutes` pour gagner !')
    .setTimestamp();

  try {
    await channel.setRateLimitPerUser(10).catch(() => {});
    await channel.send({ embeds: [bingoEmbed] });

    const numericMsgIds = new Set();
    let winnerMessageId = null;

    const participants = new Map();
    let closestGuess = null;
    let closestGuessUser = null;
    let closestGuessDifference = Infinity;

    const collector = channel.createMessageCollector({ time: 300000 });

    const hintTimers = [];
    const hintMessageIds = [];
    const hints = buildHints(bingoNumber, () =>
      closestGuessUser ? { guess: closestGuess } : null
    );

    for (const hint of hints) {
      const timer = setTimeout(async () => {
        if (bingoWinner) return;
        const hintEmbed = new EmbedBuilder()
          .setColor('#f5c243')
          .setDescription(hint.make());
        const sent = await channel.send({ embeds: [hintEmbed] }).catch(() => null);
        if (sent) hintMessageIds.push(sent.id);
      }, hint.delay);
      hintTimers.push(timer);
    }

    collector.on('collect', async (message) => {
      if (message.author.bot) return;

      const content = message.content.trim();
      const isJustNumber = /^\d+$/.test(content);

      if (!participants.has(message.author.id)) {
        participants.set(message.author.id, { userId: message.author.id });
      }

      if (!isJustNumber) return;
      const guess = parseInt(content, 10);
      if (!Number.isFinite(guess)) return;
      numericMsgIds.add(message.id);

      if (guess < 1 || guess > 500) return;

      const diff = Math.abs(guess - bingoNumber);

      if (guess === bingoNumber) {
        bingoWinner = message.author;
        winnerMessageId = message.id;
        numericMsgIds.delete(message.id);

        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const falconix = await ajouterFalconixUtilisateur(
          bingoWinner.id,
          message.guild.id,
          elapsedSeconds,
          numericMsgIds.size
        );
        const line = messagesGagnant[Math.floor(Math.random() * messagesGagnant.length)]
          .replace('X Falconix!', `**\`${falconix ?? 0}\` Falconix**!`);

        const winEmbed = new EmbedBuilder()
          .setColor('#43b581')
          .setAuthor({ name: `${bingoWinner.tag} ◟𝐁ingo 𝐆agné !`, iconURL: getAvatar(bingoWinner) })
          .setDescription(line);

        await channel.send({ embeds: [winEmbed] }).catch(() => {});
        collector.stop('found');
      } else {

        if (diff < closestGuessDifference) {
          closestGuess = guess;
          closestGuessUser = message.author;
          closestGuessDifference = diff;
        }
      }
    });

    collector.on('end', async () => {
      hintTimers.forEach(t => clearTimeout(t));
      try {
        if (!bingoWinner) {
          const line = messagesPerdant[Math.floor(Math.random() * messagesPerdant.length)];
          const loseEmbed = new EmbedBuilder()
            .setColor('#f04747')
            .setTitle('⏳◟𝐁ingo 𝐓erminé')
            .setDescription(line);

          if (closestGuessUser) {
            loseEmbed.addFields({
              name: '𝐋e plus proche',
              value: `${closestGuessUser} avec **\`${closestGuess}\`**.`,
              inline: false,
            });
            const closestAvatar = getAvatar(closestGuessUser);
            if (closestAvatar) loseEmbed.setThumbnail(closestAvatar);
            loseEmbed.setFooter({ text: `𝐃ommage ${closestGuessUser.tag}...` });
          }

          await channel.send({ embeds: [loseEmbed] }).catch(() => {});
        }

        await channel.setRateLimitPerUser(0).catch(() => {});

        for (const p of participants.values()) {
          await ajouterXPUtilisateur(p.userId, guildId, 250, bot).catch(() => {});
        }

        const toDelete = [
          ...[...numericMsgIds].filter(id => id !== winnerMessageId),
          ...hintMessageIds,
        ];
        for (const id of toDelete) {
          const m = await channel.messages.fetch(id).catch(() => null);
          if (m) await m.delete().catch(() => {});
          await sleep(120);
        }

        const current = await Bingo.findOne({ serverID: guildId });
        if (current && (current.etat || '').trim() === ETAT_DB.ACTIF) {
          const nextTs = generateNextAllowedBingo(2, 5);
          await Bingo.updateOne(
            { serverID: guildId },
            { $set: { lastBingoTime: new Date(), nextBingoTime: nextTs } },
            { upsert: true }
          );
        } else {
          await Bingo.updateOne(
            { serverID: guildId },
            { $set: { lastBingoTime: new Date(), nextBingoTime: null } },
            { upsert: true }
          );
        }
      } catch (e) {
        console.error('[BINGO] Erreur fin de bingo :', e);
      } finally {
        activeGuildRuns.delete(guildId);
      }
    });
  } catch (e) {
    console.error('[BINGO] Erreur au lancement :', e);
    activeGuildRuns.delete(guildId);
  }
}


let isCheckingBingoGames = false;

async function verifierEtLancerJeuxBingo(bot) {
  if (isCheckingBingoGames) return;
  isCheckingBingoGames = true;

  try {
    const activeBingos = await Bingo.find({ etat: { $in: [ETAT_DB.ACTIF, 'ACTIF'] } });

    const now = Date.now();
    for (const b of activeBingos) {
      const next = b.nextBingoTime ? new Date(b.nextBingoTime).getTime() : 0;
      const due = !next || next <= now;

      const cfg = await ServerConfig.findOne({ serverID: b.serverID });
      if (!cfg?.bingoChannelID && !b.bingoChannelName) continue;

      if (due) {
        if (isFirstSchedulerSweep) {
          const nextTs = generateNextAllowedBingo(2, 5);
          await Bingo.updateOne(
            { serverID: b.serverID },
            { $set: { nextBingoTime: nextTs } },
            { upsert: true }
          );
          continue;
        }

        const nextTs = generateNextAllowedBingo(2, 5);
        await Bingo.updateOne(
          { serverID: b.serverID },
          { $set: { nextBingoTime: nextTs } },
          { upsert: true }
        );
        
        lancerJeuBingo(b.serverID, bot).catch(err => {
          console.error(`[BINGO] Échec lancement (server ${b.serverID}) :`, err);
        });
      }
    }
  } catch (error) {
    console.error("[BINGO] Erreur scheduler :", error);
  } finally {
    isCheckingBingoGames = false;
    if (isFirstSchedulerSweep) {
      isFirstSchedulerSweep = false;
    }
    setTimeout(() => verifierEtLancerJeuxBingo(bot), 20000);
  }
}

module.exports = {
  verifierEtLancerJeuxBingo,
  lancerJeuBingo,
  intervalleAleatoire,
  ajouterXPUtilisateur,
  ajouterFalconixUtilisateur,
  ETAT_DB,
};

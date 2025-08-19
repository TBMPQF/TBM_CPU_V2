// bingoFunctions.js — version robuste (résolution salon + resched + anti-doublon)
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
async function ajouterFalconixUtilisateur(userId, guildId) {
  try {
    const user = await User.findOne({ userID: userId, serverID: guildId });
    if (!user) return null;
    const randomFalconix = Math.random() * (0.001 - 0.00025) + 0.00025;
    const roundedFalconix = parseFloat(randomFalconix.toFixed(5));
    user.falconix += roundedFalconix;
    await user.save();
    return roundedFalconix;
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

const activeGuildRuns = new Set();

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

  activeGuildRuns.add(guildId);

  const bingoNumber = Math.floor(Math.random() * 500) + 1;
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
  ];

  const messagesPerdant = [
    `𝐓emps écoulé, le nombre mystère **\`${bingoNumber}\`** s'est éclipsé !`,
    `𝐃ommage, le nombre mystère **\`${bingoNumber}\`** s'est volatilisé.`,
    `𝐀ujourd'hui, la chance était en congé ! 𝐂'était **\`${bingoNumber}\`**.`,
    `𝐃écidément… le nombre **\`${bingoNumber}\`** s'est fait la malle.`,
    `𝐋e sablier est vide… c’était **\`${bingoNumber}\`**. 𝐎n remet une pièce ?`,
    `𝐒oufflé comme une bougie : **\`${bingoNumber}\`** a disparu.`,
    `𝐋e nombre **\`${bingoNumber}\`** était en planque. 𝐁elle filature, mais trop tard !`,
    `𝐔n poil trop lent : **\`${bingoNumber}\`** t’a filé entre les doigts.`,
    `𝐅roid, très froid… la bonne réponse était **\`${bingoNumber}\`**.`,
    `𝐋a porte s’est refermée : **\`${bingoNumber}\`** est passé juste avant toi.`,
    `𝐌asqué jusqu’au bout : **\`${bingoNumber}\`**. 𝐑ideau pour cette manche !`,
    `𝐂omme une feuille au vent… **\`${bingoNumber}\`** s’est envolé.`,
    `𝐈l a fondu sous tes yeux : **\`${bingoNumber}\`**. 𝐂ourage, ça revient !`,
    `𝐏resque ! 𝐋a réponse était **\`${bingoNumber}\`**. 𝐎n retente ?`,
    `𝐓endance baissière aujourd’hui… le bon chiffre : **\`${bingoNumber}\`**.`,
    `𝐎n éteint les espoirs pour cette fois : **\`${bingoNumber}\`**. 𝐍ouveau tour bientôt !`,
  ];


  const bingoEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🎉丨𝐁ingo 𝐓ime!丨🎉')
    .setDescription(':8ball:丨𝐓rouve le nombre mystère entre **1** et **500** dans les prochaines `5 minutes` pour gagner !')
    .setTimestamp();

  try {
    await channel.setRateLimitPerUser(10).catch(() => {});
    await channel.send({ embeds: [bingoEmbed] });

    const participants = new Map();
    let closestGuess = null;
    let closestGuessUser = null;
    let closestGuessDifference = Infinity;

    const collector = channel.createMessageCollector({ time: 300000 }); // 5 min
    collector.on('collect', async (message) => {
      if (message.author.bot) return;
      if (!participants.has(message.author.id)) {
        participants.set(message.author.id, { userId: message.author.id });
      }

      const guess = parseInt(message.content, 10);
      if (!Number.isFinite(guess) || guess < 1 || guess > 500) return;

      const diff = Math.abs(guess - bingoNumber);
      if (guess === bingoNumber) {
        bingoWinner = message.author;
        const falconix = await ajouterFalconixUtilisateur(bingoWinner.id, message.guild.id);

        const line = messagesGagnant[Math.floor(Math.random() * messagesGagnant.length)]
          .replace('X Falconix!', `**\`${falconix ?? 0}\` Falconix**!`);

        const winEmbed = new EmbedBuilder()
          .setColor('#43b581')
          .setAuthor({ name: `${bingoWinner.tag} ◟_𝐁ingo 𝐆agné_ !`, iconURL: getAvatar(bingoWinner) })
          .setDescription(line)

        await channel.send({ embeds: [winEmbed] }).catch(() => {});
        collector.stop('found');
      } else if (diff < closestGuessDifference) {
        closestGuess = guess;
        closestGuessUser = message.author;
        closestGuessDifference = diff;
      }
    });

    collector.on('end', async () => {
      try {
        if (!bingoWinner) {
          let line = messagesPerdant[Math.floor(Math.random() * messagesPerdant.length)];

          const loseEmbed = new EmbedBuilder()
            .setColor('#f04747')
            .setTitle('⏳◟_𝐁ingo 𝐓erminé_')
            .setDescription(line)

          if (closestGuessUser) {
            loseEmbed.addFields({
              name: '𝐋e plus proche',
              value: `${closestGuessUser} avec **\`${closestGuess}\`**.`,
              inline: false,
            });

            const closestAvatar = getAvatar(closestGuessUser);
            if (closestAvatar) loseEmbed.setThumbnail(closestAvatar);
            loseEmbed.setFooter({ text: `𝐃ommage ${closestGuessUser.tag}...`, iconURL: closestAvatar || undefined });
          }

          await channel.send({ embeds: [loseEmbed] }).catch(() => {});
        }

        await channel.setRateLimitPerUser(0).catch(() => {});

        for (const p of participants.values()) {
          await ajouterXPUtilisateur(p.userId, guildId, 250, bot).catch(() => {});
        }

        const current = await Bingo.findOne({ serverID: guildId });
        if (current && (current.etat || '').trim() === ETAT_DB.ACTIF) {
          const nextTs = new Date(Date.now() + intervalleAleatoire(2, 5));
          await Bingo.updateOne(
            { serverID: guildId },
            { $set: { lastBingoTime: new Date(), nextBingoTime: nextTs } },
            { upsert: true }
          );
          console.log(`[BINGO] Manche finie, prochain bingo @ ${nextTs.toISOString()} (server ${guildId})`);
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
          const nextTs = new Date(Date.now() + intervalleAleatoire(2, 5));
          await Bingo.updateOne(
            { serverID: b.serverID },
            { $set: { nextBingoTime: nextTs } },
            { upsert: true }
          );
          continue;
        }

        const nextTs = new Date(Date.now() + intervalleAleatoire(2, 5));
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

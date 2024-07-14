const { EmbedBuilder } = require("discord.js");
const Bingo = require("./models/bingo");
const ServerConfig = require("./models/serverConfig");
const User = require('./models/experience');

let isCheckingBingoGames = false;

function intervalleAleatoire(minJours, maxJours) {
  const minMilliseconds = minJours * 24 * 60 * 60 * 1000; // minJours * 24 heures * 60 minutes * 60 secondes * 1000 millisecondes
  const maxMilliseconds = maxJours * 24 * 60 * 60 * 1000; // maxJours * 24 heures * 60 minutes * 60 secondes * 1000 millisecondes
  return Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1) + minMilliseconds);
}

async function ajouterXPUtilisateur(userId, guildId, xpAjouter) {
  try {
    const user = await User.findOne({ userID: userId, serverID: guildId });
    if (!user) return;
    user.xp += xpAjouter;
    await user.save();
  } catch (error) {
    console.error("[XP BINGO] Erreur lors de l'ajout des XP :", error);
  }
}

async function ajouterFalconixUtilisateur(userId, guildId) {
  try {
    const user = await User.findOne({ userID: userId, serverID: guildId });
    if (!user) return null;
    const randomFalconix = Math.random() * (0.00100 - 0.00025) + 0.0001;
    const roundedFalconix = parseFloat(randomFalconix.toFixed(5));
    user.falconix += roundedFalconix;
    await user.save();
    return roundedFalconix;
  } catch (error) {
    console.error("Erreur lors de l'ajout des Falconix :", error);
    return null;
  }
}

async function lancerJeuBingo(guildId, bot) {
  if (!guildId) return;

  const serverConfig = await ServerConfig.findOne({ serverID: guildId });
  if (!serverConfig || !serverConfig.bingoChannelID) return;

  const bingoChannelID = serverConfig.bingoChannelID;
  const bingoChannel = bot.channels.cache.get(bingoChannelID);

  if (!bingoChannel) {
    console.error(`[BINGO] Salon de bingo avec l'ID ${bingoChannelID} non trouvé.`);
    return;
  }

  const bingoNumber = Math.floor(Math.random() * 500) + 1;
  let bingoWinner = null;
  let isBingoActive = true;

  const messagesGagnant = [
    `🎉**丨**𝐈ncroyable, tu as trouvé le nombre mystère \`${bingoNumber}\`. 𝐓u gagnes X Falconix!`,
    `🥳**丨**𝐁ravo, tu as le don de deviner, le nombre mystère était \`${bingoNumber}\`! 𝐓u récupères X Falconix!`,
    `🎊**丨**𝐓u es un véritable devin! 𝐋e nombre mystère était \`${bingoNumber}\`. 𝐓u empoches X Falconix!`,
    `🎉**丨**𝐅élicitations mais t'es sur que ta copine est au salon en train de regarder la 𝐒tar 𝐀cademy ? :star:' 𝐋e nombre était \`${bingoNumber}\`. 𝐓u gagnes X Falconix!`
  ];

  const messagesPerdant = [
    `**丨**𝐓emps écoulé, et comme un rendez-vous Tinder oublié, le nombre mystère \`${bingoNumber}\` s'est éclipsé! 𝐋a prochaine fois, swipez à droite plus vite sur vos claviers, les virtuoses du bingo. :8ball:`,
    `**丨**𝐃ommage, le nombre mystère \`${bingoNumber}\` s'est volatilisé comme l'envie de travailler un vendredi après-midi. 𝐋a prochaine fois, soyez plus vifs, sinon je commence à croire que vous avez laissé vos neurones en mode avion ! :airplane:`,
    `**丨**𝐀ujourd'hui, la chance a pris ses congés sans préavis ! 𝐋e nombre mystère était \`${bingoNumber}\`, plus insaisissable qu'une savonnette sous la douche. 𝐑estez glissants pour la prochaine fois ! :soap:`,
    `**丨**𝐃écidement.. 𝐋e nombre \`${bingoNumber}\` s'est éclipsé comme vos résolutions de Nouvel An. 𝐄ssayez encore ! :first_quarter_moon:`
  ];

  const bingoEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🎉丨𝐁ingo 𝐓ime!丨🎉')
    .setDescription(':8ball:丨𝐓rouve le nombre mystère entre **1** et **500** dans les prochaines \`5 minutes\` pour gagner!\n@here')
    .setTimestamp()
    .setFooter({
      text: `Cordialement, l'équipe ${bot.guilds.cache.get(guildId).name}`,
      iconURL: bot.guilds.cache.get(guildId).iconURL(),
    });

  await bingoChannel.setRateLimitPerUser(10);
  await bingoChannel.send({ embeds: [bingoEmbed] });

  const participants = new Map();
  const bingoCollector = bingoChannel.createMessageCollector({
    time: 300000, // 5 minutes pour trouver le bon nombre
  });

  let closestGuess = null;
  let closestGuessUser = null;
  let closestGuessDifference = Infinity;

  bingoCollector.on('collect', async message => {
    if (!isBingoActive) return;
    participants.set(message.author.id, { userId: message.author.id, interaction: message });

    const guess = parseInt(message.content);
    const guessDifference = Math.abs(guess - bingoNumber);

    if (guess === bingoNumber) {
      bingoWinner = message.author;
      const falconixGained = await ajouterFalconixUtilisateur(bingoWinner.id, message.guild.id);
      const messageGagnant = messagesGagnant[Math.floor(Math.random() * messagesGagnant.length)].replace('X Falconix!', `\`${falconixGained}\` **Falconix**!`);
      message.reply(`${messageGagnant}`);
      isBingoActive = false;
      bingoCollector.stop();
    } else if (guessDifference < closestGuessDifference) {
      closestGuess = guess;
      closestGuessUser = message.author;
      closestGuessDifference = guessDifference;
    }
  });

  bingoCollector.on('end', async collected => {
    if (!bingoWinner) {
      let finalMessage = messagesPerdant[Math.floor(Math.random() * messagesPerdant.length)];
      if (closestGuessUser) {
        finalMessage += `\n丨𝐋e joueur le __plus proche__ était **${closestGuessUser}** avec le nombre \`${closestGuess}\`.`;
      }
      bingoChannel.send(finalMessage);
    }
    await bingoChannel.setRateLimitPerUser(0);
    await Bingo.findOneAndUpdate(
      { serverID: guildId },
      { lastBingoTime: new Date() },
      { upsert: true }
    );
    participants.forEach(async (participant) => {
      try {
        await ajouterXPUtilisateur(participant.userId, guildId, 250);
      } catch (error) {
        console.error(`Erreur lors de l'ajout des XP au participant ${participant.userId} :`, error);
      }
    });
    participants.clear();
  });
}

async function verifierEtLancerJeuxBingo(bot) {
  if (isCheckingBingoGames) return;
  isCheckingBingoGames = true;

  Bingo.find({ etat: 'ACTIF' }).then(async activeBingos => {
    for (const bingo of activeBingos) {
      if (!bingo.nextBingoTime || new Date(bingo.nextBingoTime) <= new Date()) {
        await lancerJeuBingo(bingo.serverID, bot);
      }
    }
  }).catch(error => {
    console.error("[BINGO] Erreur lors de la vérification des états des serveurs pour le Bingo :", error);
  }).finally(() => {
    isCheckingBingoGames = false;
    setTimeout(() => verifierEtLancerJeuxBingo(bot), 20000); // 20 secondes pour les tests, remettre à une valeur raisonnable si besoin
  });
}

module.exports = {
  verifierEtLancerJeuxBingo,
  lancerJeuBingo,
  intervalleAleatoire
};
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
const User = require("../../models/experience");

module.exports = {
  name: "rank",
  description: "丨𝐀ffiche ton niveau d'expérience.",
  longDescription: ` 𝐀lors, tu veux savoir où tu te situes dans l'arène de l'XP ? 𝐁ienvenue dans la bataille de prestige où chaque message compte. 𝐂ette commande est là pour flatter ton ego (ou te donner un petit coup de réalité si tu n'as pas encore atteint le sommet 😜).\n\n𝐃isons-le franchement : avec **rank**, tu peux voir ton niveau actuel, ton prestigieux (ou non) classement, et combien de messages tu as envoyés. 𝐄n gros, plus tu envoies de messages, plus tu grimpes dans la hiérarchie. 🔥\n𝐅élicitations si tu as assez d'XP ! 𝐆arde en tête que tu vas peut-être bientôt passer au niveau supérieur et débloquer... bah, juste le droit de te vanter, mais c'est déjà pas mal, non ? 🤷‍♂️\n\n𝐇onnêtement, si tu n'as pas encore assez d'XP, pas de panique ! 𝐈l suffit de continuer de spammer (euh... discuter) et tu pourras admirer ta progression dans cette magnifique barre de progression. 𝐉uste à quel point tu es proche de devenir **le maître du serveur** ! 😎\n\n𝐊omment dire, tu peux soit afficher fièrement tes stats, soit pleurer en silence dans ton coin. 𝐋e choix t'appartient ! 💪`,
  dm: false,
  permission: "Aucune",
  async execute(interaction) {
    const guild = interaction.guild;
    const target = interaction.user;
    const user = await User.findOne({ userID: target.id, serverID: guild.id });

    if (!user) {
      return interaction.reply({
        content: "𝐓u veux que j'affiche quoi ? 𝐈l faut envoyer des messages avant !",
        ephemeral: true,
      });
    }

    const allUsers = await User.find({ serverID: guild.id }).sort({
      prestige: -1,
      xp: -1,
    });
    const position = allUsers.findIndex((u) => u.userID === target.id) + 1;
    const positionEmoji = getPositionEmoji(position);

    const nextLevel = user.level + 1;
    const xpRequiredForNextLevel = Math.pow(nextLevel / 0.1, 2);
    const currentLevelXP = Math.max(0, user.xp - Math.pow(user.level / 0.1, 2));
    const xpRequiredForCurrentLevel = Math.max(
      0,
      xpRequiredForNextLevel - Math.pow(user.level / 0.1, 2)
    );

    const progressBar = createProgressBar(
      Math.round(currentLevelXP),
      Math.round(xpRequiredForCurrentLevel),
      10
    );
    const percentage = (
      (currentLevelXP / xpRequiredForCurrentLevel) *
      100
    ).toFixed(0);

    const xpPerLevel = (level) => Math.pow(level / 0.1, 2);

    const calculateTotalXP = (level, xp, prestige) => {
      let totalXP = xp;
      for (let i = 0; i < prestige; i++) {
        for (let lvl = 1; lvl <= 50; lvl++) {
          totalXP += xpPerLevel(lvl);
        }
      }
      for (let lvl = 1; lvl < level; lvl++) {
        totalXP += xpPerLevel(lvl);
      }

      return Math.round(totalXP);
    };
    const totalXP = calculateTotalXP(user.level, user.xp, user.prestige);

    const rowLadder = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("LADDER_BUTTON")
        .setEmoji("🏋🏼‍♂️")
        .setLabel("Classement")
        .setStyle(ButtonStyle.Primary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("VOCAL_TIME_BUTTON")
        .setEmoji("🎤")
        .setLabel("Vocal Time")
        .setStyle(ButtonStyle.Primary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("FALCONIX_BUTTON")
        .setEmoji("1186719745106513971")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setColor("Random")
      .setTitle(`丨${position}${positionEmoji}`)
      .setDescription(
        `\n\n🔹 𝐍iveau : **${user.level}**.\n:large_blue_diamond: 𝐏restige : **${user.prestige}**.\n💠 𝐗P : **${user.xp.toLocaleString()} / ${xpRequiredForNextLevel.toLocaleString()}**.\n\n✨ **𝐗P Total : ${totalXP.toLocaleString()}**.\n\n𝐓u as envoyé : **${user.messageCount}** messages.\n\n𝐏rogression : ${progressBar} **\`${percentage}%\`**`
      );

    const reply = await interaction.reply({
      embeds: [embed],
      components: [rowLadder],
      fetchReply: true,
    });

    setTimeout(async () => {
      try {
        const message = await interaction.channel.messages.fetch(reply.id);
        await message.delete();
      } catch (error) {
        if (error.code !== 10008) {
          console.error("[RANK] Erreur lors de la suppression du message : ", error);
        }
      }
    }, 15000);
  },
};

function createProgressBar(value, maxValue, barLength) {
  const percentage = value / maxValue;
  const progress = Math.round(percentage * barLength);

  const progressChars = "▰".repeat(progress);
  const emptyChars = "▱".repeat(barLength - progress);

  return `${progressChars}${emptyChars}`;
}

function getPositionEmoji(position) {
  if (position === 1) {
    return "er 🥇";
  } else if (position === 2) {
    return "ème 🥈";
  } else if (position === 3) {
    return "ème 🥉";
  } else {
    return `ème`;
  }
}
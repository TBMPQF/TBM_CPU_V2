const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextInputComponent,
  TextInputAssertions,
  PermissionsBitField,
  ButtonBuilder,
  EmbedBuilder,
  ChannelType,
  ButtonStyle,
  StringSelectMenuBuilder,
  Embed, Discord
} = require("discord.js");
const mongoose = require("mongoose");
const config = require("../config");
const User = require("../models/experience");
const levelUp = require("../models/levelUp");
const interactionSetConfig = require("./interactionsetconfig");
const ServerRole = require("../models/serverRole");
const Bingo = require("../models/bingo")
const axios = require('axios');
const ServerConfig = require("../models/serverConfig");
const SearchMateMessage = require('../models/searchMate');
const VocalChannel = require('../models/vocalGames');
const ApexStats = require('../models/apexStats');
const ServerRoleMenu = require('../models/serverRoleMenu')
const Warning = require('../models/warns')
const { unmuteRequests } = require('../models/shared');
const { intervalleAleatoire, lancerJeuBingo } = require('../bingoFunctions');
const Suggestion = require('../models/suggestion');
const TwitchStreamers = require("../models/TwitchStreamers")

mongoose.connect(config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = {
  name: "interactionCreate",
  async execute(interaction, bot) {

    //Gestion des suggestions
    async function sendLogMessage(interaction, message) {
      const serverConfig = await ServerConfig.findOne({ serverID: interaction.guild.id });
    
      if (serverConfig && serverConfig.logChannelID) {
        const logChannel = interaction.guild.channels.cache.get(serverConfig.logChannelID);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(message)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
    
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    }
    async function handleAcceptSugg(interaction, suggestionMessageID) {
      const suggestion = await Suggestion.findOne({ messageID: suggestionMessageID });
    
      if (!suggestion) {
        return interaction.reply({
          content: "❌丨𝐋a suggestion n'a pas été trouvée.",
          ephemeral: true,
        });
      }
    
      const hasVotedUp = suggestion.upvotes.includes(interaction.user.id);
      const hasVotedDown = suggestion.downvotes.includes(interaction.user.id);
    
      if (hasVotedUp || hasVotedDown) {
        const alreadyVotedMessage = hasVotedUp
          ? "🚫丨**𝐎ops!** 𝐓u as déjà voté `𝐏𝐎𝐔𝐑` à cette suggestion, pas besoin de doubler la mise !"
          : "🚫丨**𝐇é!** 𝐓u as déjà voté `𝐂𝐎𝐍𝐓𝐑𝐄` à cette suggestion !";
        
        return interaction.reply({
          content: alreadyVotedMessage,
          ephemeral: true,
        });
      }
    
      suggestion.upvotes.push(interaction.user.id);
      await suggestion.save();
    
      const embed = interaction.message.embeds[0];
      const newFieldValue = parseInt(embed.fields[1].value) + 1;
      embed.fields[1].value = newFieldValue.toString();
    
      const updatedEmbed = new EmbedBuilder()
        .setColor(embed.color)
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(embed.fields);
    
      await interaction.message.edit({ embeds: [updatedEmbed] });
      await interaction.reply({ content: "**𝐌erci. 𝐓on vote a bien été pris en compte.** :bulb:", ephemeral: true });
    
      await sendLogMessage(interaction, `✔️丨𝐕ient de voter **POUR** à la suggestion : \n\n\`${embed.description}\`.`);
    }
    async function handleNopSugg(interaction, suggestionMessageID) {
      const suggestion = await Suggestion.findOne({ messageID: suggestionMessageID });
    
      if (!suggestion) {
        return interaction.reply({
          content: "❌丨𝐋a suggestion n'a pas été trouvée.",
          ephemeral: true,
        });
      }
    
      const hasVotedUp = suggestion.upvotes.includes(interaction.user.id);
      const hasVotedDown = suggestion.downvotes.includes(interaction.user.id);
    
      if (hasVotedUp || hasVotedDown) {
        const alreadyVotedMessage = hasVotedDown
          ? "🚫丨**𝐇é!** 𝐓u as déjà voté `𝐂𝐎𝐍𝐓𝐑𝐄` à cette suggestion !"
          : "🚫丨**𝐎ops!** 𝐓u as déjà voté `𝐏𝐎𝐔𝐑` à cette suggestion !";
        
        return interaction.reply({
          content: alreadyVotedMessage,
          ephemeral: true,
        });
      }
    
      suggestion.downvotes.push(interaction.user.id);
      await suggestion.save();
    
      const embed = interaction.message.embeds[0];
      const newFieldValue = parseInt(embed.fields[2].value) + 1;
      embed.fields[2].value = newFieldValue.toString();
    
      const updatedEmbed = new EmbedBuilder()
        .setColor(embed.color)
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(embed.fields);
    
      await interaction.message.edit({ embeds: [updatedEmbed] });
      await interaction.reply({ content: "**𝐌erci. 𝐓on vote a bien été pris en compte.** :bulb:", ephemeral: true });
    
      await sendLogMessage(interaction, `❌丨𝐕ient de voter **CONTRE** à la suggestion : \n\n\`${embed.description}\`.`);
    }
    async function handleDeleteSugg(interaction, suggestionMessageID) {
      const suggestion = await Suggestion.findOne({ messageID: suggestionMessageID });
    
      if (!suggestion) {
        return interaction.reply({
          content: "❌丨𝐋a suggestion est introuvable dans la base de données.",
          ephemeral: true,
        });
      }
    
      const suggestionMessage = await interaction.channel.messages.fetch(suggestionMessageID).catch(() => null);
    
      if (!suggestionMessage) {
        return interaction.reply({
          content: "❌丨𝐋e message de la suggestion est introuvable ou a déjà été supprimé.",
          ephemeral: true,
        });
      }
    
      await suggestionMessage.delete();
      await Suggestion.deleteOne({ messageID: suggestionMessageID });
    
      await interaction.reply({
        content: "✅丨𝐋a suggestion a été supprimée avec succès.",
        ephemeral: true,
      });
    
      await sendLogMessage(interaction, `🗑️丨La suggestion \`${suggestion.suggestionText}\` a été supprimée par **${interaction.user.tag}**.`);
    }
    async function handleMarkAsDone(interaction, suggestionMessageID) {
      const suggestion = await Suggestion.findOne({ messageID: suggestionMessageID });
    
      if (!suggestion) {
        return interaction.reply({
          content: "❌丨𝐋a suggestion n'a pas été trouvée.",
          ephemeral: true,
        });
      }
    
      const suggestionMessage = await interaction.channel.messages.fetch(suggestionMessageID).catch(() => null);
    
      if (!suggestionMessage) {
        return interaction.reply({
          content: "❌丨𝐋e message original de la suggestion est introuvable.",
          ephemeral: true,
        });
      }
    
      const embed = suggestionMessage.embeds[0];
      const today = new Date();
      const formattedDate = today.toLocaleDateString('fr-FR');
    
      const updatedFields = embed.fields.filter(field => !field.name.includes("𝐏our") && !field.name.includes("𝐂ontre"));
    
      const updatedEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(updatedFields)
        .setFooter({ text: `丨𝐄ffectué le ${formattedDate}`, iconURL: interaction.guild.iconURL() });
    
      await suggestionMessage.edit({ embeds: [updatedEmbed], components: [] });
      await Suggestion.deleteOne({ messageID: suggestionMessageID });
    
      await interaction.reply({
        content: "✅丨𝐋a suggestion a été marquée comme effectuée.",
        ephemeral: true,
      });
    
      await sendLogMessage(interaction, `✔️丨La suggestion \`${embed.description}\` a été marquée comme effectuée par **${interaction.user.tag}**.`);
    }
    async function handleRecycleVotes(interaction, suggestionMessageID) {
      const suggestion = await Suggestion.findOne({
        serverID: interaction.guild.id,
        messageID: suggestionMessageID,
      });
    
      if (!suggestion) {
        return interaction.reply({
          content: "❌丨𝐋a suggestion n'a pas été trouvée dans la base de données.",
          ephemeral: true,
        });
      }
    
      const suggestionMessage = await interaction.channel.messages.fetch(suggestionMessageID).catch(() => null);
    
      if (!suggestionMessage) {
        return interaction.reply({
          content: "❌丨𝐋e message original de la suggestion est introuvable.",
          ephemeral: true,
        });
      }
    
      const embed = suggestionMessage.embeds[0];
    
      const isAlreadyZeroInEmbed = embed.fields.some(field => field.name.includes("𝐏our") && field.value === "0") &&
        embed.fields.some(field => field.name.includes("𝐂ontre") && field.value === "0");
    
      const isAlreadyZeroInDB = suggestion.upvotes.length === 0 && suggestion.downvotes.length === 0;
    
      if (isAlreadyZeroInEmbed && isAlreadyZeroInDB) {
        return interaction.reply({
          content: "⚠️丨𝐋es votes sont déjà à zéro.",
          ephemeral: true,
        });
      }
    
      // Mettre à jour les champs des votes dans l'embed
      const updatedFields = embed.fields.map(field => {
        if (field.name.includes("𝐏our")) {
          return { name: field.name, value: "0", inline: true };
        }
        if (field.name.includes("𝐂ontre")) {
          return { name: field.name, value: "0", inline: true };
        }
        return field;
      });
    
      const updatedEmbed = new EmbedBuilder()
        .setColor(embed.color)
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(updatedFields);
    
      await suggestionMessage.edit({ embeds: [updatedEmbed] });
    
      // Remettre les votes à zéro dans la base de données
      await Suggestion.updateOne(
        { serverID: interaction.guild.id, messageID: suggestionMessageID },
        { $set: { upvotes: [], downvotes: [] } }
      );
    
      await interaction.reply({
        content: "♻️丨𝐋es votes ont été remis à zéro avec succès.",
        ephemeral: true,
      });
    
      await sendLogMessage(interaction, `♻️丨Les votes de la suggestion \`${embed.description}\` ont été réinitialisés par **${interaction.user.tag}**.`);
    }
    async function handleConfigSugg(interaction, suggestionMessageID) {
      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
    
      if (!serverConfig || !serverConfig.ticketAdminRoleID) {
        return interaction.reply({
          content: "**𝐀ction impossible car la configuration du rôle administrateur n'a pas été définie dans le `/setconfig`.**",
          ephemeral: true,
        });
      }
    
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const adminRole = interaction.guild.roles.cache.get(serverConfig.ticketAdminRoleID);
    
      if (!adminRole || !member.roles.cache.has(adminRole.id)) {
        return interaction.reply({
          content: "𝐌on petit... 𝐃ésolé, mais tu n'as pas la permission d'utiliser ce bouton.",
          ephemeral: true,
        });
      }
    
      // Récupère la suggestion en fonction de serverID et messageID
      const suggestion = await Suggestion.findOne({
        serverID: interaction.guild.id,
        messageID: suggestionMessageID,  // Utilise suggestionMessageID
      });
    
      if (!suggestion) {
        return interaction.reply({
          content: "❌丨𝐋a suggestion est introuvable dans la base de données.",
          ephemeral: true,
        });
      }
    
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`SUGG_DELETE_SUGGESTION_${suggestionMessageID}`)  // Ajout de suggestionMessageID
          .setLabel("Supprimer")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`SUGG_MARK_DONE_${suggestionMessageID}`)  // Ajout de suggestionMessageID
          .setLabel("Effectuer")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`SUGG_RECYCLE_VOTES_${suggestionMessageID}`)  // Ajout de suggestionMessageID
          .setEmoji("♻")
          .setStyle(ButtonStyle.Secondary)
      );
    
      await interaction.reply({
        content: "**𝐐ue veux-tu faire avec cette suggestion ?**\n𝐀ttention néanmoins à ne pas faire n'importe quoi. :no_pedestrians:",
        components: [row],
        ephemeral: true,
      });
    }
    if (interaction.customId && interaction.customId.startsWith("SUGG_")) {
      const customIdParts = interaction.customId.split('_');
      
      if (customIdParts.length === 3) {
        const action = customIdParts[1];
        const suggestionMessageID = customIdParts[2];
    
        switch (action) {
          case "ACCEPTSUGG":
            await handleAcceptSugg(interaction, suggestionMessageID);
            break;
          case "NOPSUGG":
            await handleNopSugg(interaction, suggestionMessageID);
            break;
          case "CONFIGSUGG":
            await handleConfigSugg(interaction, suggestionMessageID);
            break;
          default:
            return interaction.reply({
              content: "❌丨Action inconnue.",
              ephemeral: true,
            });
        }
      } else if (customIdParts.length === 4) {
        const action = `${customIdParts[1]}_${customIdParts[2]}`;
        const suggestionMessageID = customIdParts[3];
    
        switch (action) {
          case "DELETE_SUGGESTION":
            await handleDeleteSugg(interaction, suggestionMessageID);
            break;
          case "MARK_DONE":
            await handleMarkAsDone(interaction, suggestionMessageID);
            break;
          case "RECYCLE_VOTES":
            await handleRecycleVotes(interaction, suggestionMessageID);
            break;
          default:
            return interaction.reply({
              content: "❌丨Action inconnue.",
              ephemeral: true,
            });
        }
      }
    } else {
      
    // Bouton Daily, pour récupérer son bonus quotidien.
    if (interaction.customId === "DAILYXP") {
      const user = await User.findOne({
        serverID: interaction.guild.id,
        userID: interaction.user.id,
      });

      if (!user) {
        return interaction.reply({
          content:
            "𝐀vant de vouloir récupérer ton bonus, ne veux-tu pas d'abord faire un peu connaissance avec tes nouveaux camarades ?",
          ephemeral: true,
        });
      }

      const now = new Date();
      const lastClaim = user.lastDaily;
      const msIn47Hours = 47 * 60 * 60 * 1000;
      const msIn23Hours = 23 * 60 * 60 * 1000;
      const daysInWeek = 7;
      let resetConsecutiveDaily = false;

      if (lastClaim && now.getTime() - lastClaim.getTime() < msIn47Hours) {
        const timeSinceLastClaim = now.getTime() - lastClaim.getTime();
      
        if (timeSinceLastClaim < msIn23Hours) {
          const timeRemaining = msIn23Hours - timeSinceLastClaim;
          const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
          const minutesRemaining = Math.floor(
            (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
          );
          const secondsRemaining = Math.floor(
            (timeRemaining % (60 * 1000)) / 1000
          );
      
          let timeRemainingMessage = "";
          if (hoursRemaining > 0) {
              timeRemainingMessage += `\`${hoursRemaining} heure${hoursRemaining > 1 ? 's' : ''}\`, `;
              timeRemainingMessage += `\`${minutesRemaining.toString().padStart(2, "0")} minute${minutesRemaining > 1 ? 's' : ''}\` et `;
          } else if (minutesRemaining > 0) {
              timeRemainingMessage += `\`${minutesRemaining.toString().padStart(2, "0")} minute${minutesRemaining > 1 ? 's' : ''}\` et `;
          }
          timeRemainingMessage += `\`${secondsRemaining.toString().padStart(2, "0")} seconde${secondsRemaining > 1 ? 's' : ''}\``;
      
          return interaction.reply({
            content: `丨𝐓u dois attendre encore ${timeRemainingMessage} avant de pouvoir récupérer ton __𝐃aily__ !`,
            ephemeral: true,
          });
        }

        user.consecutiveDaily += 1;
      } else {
        user.lostConsecutiveDaily = user.consecutiveDaily;
        resetConsecutiveDaily = true;
        user.consecutiveDaily = 1;
      }

      if (user.consecutiveDaily > user.maxDaily) {
        user.maxDaily = user.consecutiveDaily;
      }

      const SPECIAL_DAILY_STREAK = 50;
      const randomMessages = [
        `𝐀ttention, **${interaction.user.username}** vient d'atteindre \`${user.consecutiveDaily}\` jours consécutifs de bonus quotidien ! 💥 Peut-on l'arrêter ?!`,
        `**${interaction.user.username}** a enchaîné \`${user.consecutiveDaily}\` jours d'affilée ! On dirait qu'il ou elle ne dort jamais ! 🛌`,
        `𝐀vec \`${user.consecutiveDaily}\` jours consécutifs, **${interaction.user.username}** est devenu un maître du daily bonus ! 🏆`,
        `𝐎h là là ! **${interaction.user.username}** a survécu \`${user.consecutiveDaily}\` jours sans oublier son bonus quotidien ! Respect ! 🙌`,
        `𝐄st-ce un robot ? 𝐍on, c'est juste **${interaction.user.username}** qui a atteint \`${user.consecutiveDaily}\` jours de streak !`,
        `\`${user.consecutiveDaily}\` jours consécutifs de daily bonus pour **${interaction.user.username}** ! 𝐁ientôt une statue à son effigie dans le serveur ! 🗿`
      ];

      const selectedMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];

      if (user.consecutiveDaily % SPECIAL_DAILY_STREAK === 0) {
          const specialChannel = interaction.guild.channels.cache.get('717144491525406791');
          if (specialChannel) {
              specialChannel.send(selectedMessage)
                  .then(message => {
                      const reactions = ['🇱', '🇴', '🇸', '🇪', '🇷'];
                      reactions.forEach(reaction => message.react(reaction));
                  })
                  .catch(console.error);
          }
      }


      const baseXP = 200;
      const weeksConsecutive = Math.floor(user.consecutiveDaily / daysInWeek);
      const bonusXP = baseXP * 0.02 * weeksConsecutive;
      let totalXP = baseXP + bonusXP;

      if (user.malusDuration > 0) {
        if (user.malusDaily > totalXP) {
          user.malusDaily = totalXP;
        }

        totalXP -= user.malusDaily;
        user.malusDuration -= 1;

        if (user.malusDuration == 0) {
          user.malusDaily = 0;
        }
      }

      user.xp += totalXP;
      levelUp(interaction, user, user.xp);

      let dailyMessage = "";

      if (lastClaim == null) {
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` ! - :tada:`;
      } else if (resetConsecutiveDaily) {
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` ! - :tada:\n\n 𝐌ais tu as __perdu__ toute tes flammes \`1\` - :fire:\n 𝐓on ancien record est de \`${user.maxDaily}\`.`;
      } else if (user.consecutiveDaily === 1) {
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` ! - :tada:`;
      } else {
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` ! - :tada:\n\n 𝐓u es en **feu** \`${user.consecutiveDaily}\` - :fire:\n 𝐓on record est de \`${user.maxDaily}\`.`;
      }

      user.lastDaily = now;

      const dailyEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(dailyMessage)
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      let components = [];

      if (resetConsecutiveDaily == true && lastClaim != null) {
        const RécupDailyrow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("RECUPDAILY_BUTTON")
            .setEmoji("💨")
            .setLabel("丨𝐑attraper mon 𝐃aily")
            .setStyle(ButtonStyle.Primary)
        );

        components.push(RécupDailyrow);
      }

      interaction.reply({
        embeds: [dailyEmbed],
        components: components,
        ephemeral: true,
      });

      //LOG Pour Daily.
      const serverInfo = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });

      if (serverInfo || !serverInfo.logChannelID) {
        const XPLOG = new EmbedBuilder()
          .setColor("Orange")
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTitle(
            `丨𝐕ient de récuperer son bonus quotidien. 💸`
          )
          .setTimestamp()
          .setFooter({
            text: `𝐒érie en cours : ${user.consecutiveDaily}`
          });

        if (serverInfo && serverInfo.logChannelID) {
          const logChannel = bot.channels.cache.get(serverInfo.logChannelID);
          if (logChannel) {
            logChannel.send({ embeds: [XPLOG] });
          }
        }
      }
    }
    // Bouton récupération lors de perte du daily
    if (interaction.customId === "RECUPDAILY_BUTTON") {
      const user = await User.findOne({
        serverID: interaction.guild.id,
        userID: interaction.user.id,
      });

      const currentXP = Number(user.xp) || 0;
      const storedConsecutiveDaily = Number(user.lostConsecutiveDaily) || 0;

      const costXP = calculateCostXP(storedConsecutiveDaily);
      const malus = calculateMalus(storedConsecutiveDaily);
      const malusDuration = calculateMalusDuration(storedConsecutiveDaily);
      const xpLoss = costXP; // Supposons que la perte d'XP est égale au coût
      const lostLevels = calculateLostLevels(currentXP, xpLoss);

      if (user.xp >= costXP) {
        const confirmMessage = `丨𝐓u veux vraiment récupérer ton __𝐃aily__ ? 𝐓u avais une série de \`${
            user.lostConsecutiveDaily
        }\`.\n Ça te coûtera \`${costXP.toLocaleString()}\` 𝐗p, tu perdras \`${lostLevels}\` niveau(x), et tu auras un malus de \`${malus}\` 𝐗p pour \`${malusDuration}\` jour(s) sur tes prochains __𝐃aily__.`;

        const yesButton = new ButtonBuilder()
          .setCustomId("CONFIRM_RECUPDAILY_BUTTON")
          .setLabel("Oui")
          .setStyle(ButtonStyle.Success);
        const noButton = new ButtonBuilder()
          .setCustomId("CANCEL_RECUPDAILY_BUTTON")
          .setLabel("Non")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

        await interaction.reply({
          content: confirmMessage,
          components: [row],
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: `丨𝐓u n'as pas assez d'𝐗p pour rattraper ton __bonus quotidien__. 𝐓u as besoin de \`${costXP.toLocaleString()}\` 𝐗p minimum et tu as uniquement \`${user.xp.toLocaleString()}\` 𝐗p disponible.`,
          ephemeral: true,
        });
      }
    }
    function calculateLostLevels(currentXP, xpLoss) {
      // Calculer le niveau actuel à partir de l'XP actuel
      let currentLevel = Math.floor(0.1 * Math.sqrt(currentXP));
    
      // Calculer le nouvel XP après la perte
      let newXP = Math.max(0, currentXP - xpLoss);
    
      // Calculer le nouveau niveau à partir du nouvel XP
      let newLevel = Math.floor(0.1 * Math.sqrt(newXP));
    
      // Calculer les niveaux perdus
      let lostLevels = currentLevel - newLevel;
    
      return Math.max(0, lostLevels);
    }
    function calculateCostXP(consecutiveDaily) {
      // Chaque jour de la série coûte 600 xp
      return consecutiveDaily * 600;
    }
    function calculateMalus(consecutiveDaily) {
      // Malus est de 50 si la série est inférieure à 7 jours, sinon c'est 75
      return consecutiveDaily < 7 ? 50 : 75;
    }
    function calculateMalusDuration(consecutiveDaily) {
      // Chaque semaine de la série rajoute 1 jour de malus
      return Math.max(1, Math.floor(consecutiveDaily / 7));
    }
    // Bouton confirmation récupération de daily
    if (interaction.customId === "CONFIRM_RECUPDAILY_BUTTON") {
      const user = await User.findOne({
        serverID: interaction.guild.id,
        userID: interaction.user.id,
      });
      if (user.lostConsecutiveDaily === 0) {
        return interaction.reply({
          content: "丨𝐀h, voilà que le vent de l'indécision souffle plus fort qu'une mouette après un festin de frites ! 𝐃ésolé mais.. c'est trop tard !",
          ephemeral: true,
        });
      }
      const serverConfig = await ServerConfig.findOne({ serverID: interaction.guild.id });
      const implicationsChannelID = serverConfig ? serverConfig.implicationsChannelID : null;

      const storedConsecutiveDaily = user.lostConsecutiveDaily || 0;
      const costXP = calculateCostXP(storedConsecutiveDaily);
      const malus = calculateMalus(storedConsecutiveDaily);
      const malusDuration = calculateMalusDuration(storedConsecutiveDaily);
      const levelBeforeLoss = user.level;

      if (user.xp >= costXP) {
        user.xp -= costXP;
        user.consecutiveDaily = user.lostConsecutiveDaily;
        user.lostConsecutiveDaily = 0;
        user.malusDaily = malus;
        user.malusDuration = malusDuration;
        user.lastDaily = new Date(Date.now());
        const newLevel = Math.floor(0.1 * Math.sqrt(user.xp));
        user.level = newLevel;
        await user.save();

        const levelDownMessages = [
          `**${interaction.user}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`**. 𝐂'est comme trouver un parking en plein **Paris**, rare et un peu décevant. 𝐀llez, un petit daily et on oublie tout ça !`,
          `**${interaction.user}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`**. 𝐓u es comme le WiFi gratuit : tout le monde s'excite, mais personne ne s'attend à de la rapidité. 𝐀llez, ton daily t'attend ! -`,
          `**${interaction.user}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`**. 𝐁ravo ! 𝐓u progresses à la vitesse d'un escargot en pause café. 𝐍'oublie pas ton daily, ça pourrait peut-être accélérer les choses ! -`,
          `**${interaction.user}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`**. 𝐓u évolues comme un dinosaure en 2024. Extinction imminente, fais vite ton daily ! -`,
          `**${interaction.user}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`**. 𝐂'est comme perdre à un concours de pierre-papier-ciseaux contre un poisson rouge. 𝐍'oublie pas ton daily, champion ! -`,
          `**${interaction.user}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`**. 𝐂'est comme fêter un anniversaire de plus à l'âge de 90 ans : surprenant, un peu triste, mais on applaudit quand même. 𝐂ourage pour ton daily, ça ne peut que s'améliorer... en théorie ! -`,
        ];
        const randomMessage = levelDownMessages[Math.floor(Math.random() * levelDownMessages.length)];

        if (newLevel < levelBeforeLoss && implicationsChannelID) {
          const levelDownChannel = interaction.guild.channels.cache.get(implicationsChannelID);
          if (levelDownChannel) {
            levelDownChannel.send(randomMessage);
          }
        }

        await interaction.reply({
          content: `丨𝐓u as rattrapé ton __𝐃aily__ pour seulement \`${costXP.toLocaleString()}\` 𝐗p. 𝐓es copains ne diront plus que tu es un rat ! 𝐏ar contre.. __𝐔n malus__ de \`${malus}\` a été appliqué pour \`${malusDuration} jour(s)\`.`,
          ephemeral: true,
        });

        const recoveredDailyLog = new EmbedBuilder()
          .setColor("Orange")
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTitle(`丨𝐕ient de récupéré son Daily manqué !`)
          .setDescription(`\n_Série recupérée_ : \`${user.consecutiveDaily}\`.\n\n_XP dépensé_ : \`${costXP.toLocaleString()}\` XP.\n\n_Malus appliqué_ : \`${malus}\` XP pour \`${malusDuration}\` jours.`)
          .setFooter({
            text: `XP restant : ${user.xp.toLocaleString()}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 })
          })
          .setTimestamp();

      const serverInfo = await ServerConfig.findOne({ serverID: interaction.guild.id });
        if (serverInfo && serverInfo.logChannelID) {
          const logChannel = bot.channels.cache.get(serverInfo.logChannelID);
          if (logChannel) {
            logChannel.send({ embeds: [recoveredDailyLog] });
          }
        }
      } else {
        return interaction.reply({
          content: `丨**L'application met trop de temps à répondre -> contact mon créateur \`tbmpqf\`.**`,
          ephemeral: true,
        });
      }
    }
    // Bouton cancel récupération de daily
    if (interaction.customId === "CANCEL_RECUPDAILY_BUTTON") {
      const userId = interaction.user.id;
      const serverId = interaction.guild.id;
    
      User.findOneAndUpdate(
        { userID: userId, serverID: serverId },
        { $set: { lostConsecutiveDaily: 0 } },
        { new: true }
      )
      .then(updatedUser => {
        if (!updatedUser) {
          console.error(`Utilisateur non trouvé (userID: ${userId}, serverID: ${serverId})`);
        } else {
          interaction.reply({
            content: "丨𝐓u as décidé de ne pas récupérer ton __𝐃aily__. 𝐐uelle audace ! 𝐍'oublie pas ➠ **ce qui ne te tue pas, te rend plus fort**... ou pas ! 😅",
            ephemeral: true,
          });
        }
      })
      .catch(error => {
        console.error("Erreur lors de la mise à jour de lostConsecutiveDaily", error);
      });
    }

    //SelectMenu pour le channel rôle, sélecteur de jeux.
    if (interaction.isStringSelectMenu()) {
      const member = interaction.member;

      if (interaction.customId === "RoleCustomID") {
        let choice = interaction.values[0];
        interaction.deferReply({ ephemeral: true }).then(() => {
          if (choice == "APEX") {
            const roleID = "811662603713511425";
            handleRole(interaction, member, roleID, "Apex Legends");
          } else if (choice == "NEWORLD") {
            const roleID = "907320710559576105";
            handleRole(interaction, member, roleID, "New World");
          } else if (choice == "PALWORLD") {
            const roleID = "1078754580113920020";
            handleRole(interaction, member, roleID, "Palworld");
          } else if (choice == "CALLOF") {
            const roleID = "813800188317663254";
            handleRole(interaction, member, roleID, "Call of Duty");
          } else if (choice == "ROCKET") {
            const roleID = "811663563558092841";
            handleRole(interaction, member, roleID, "Rocket League");
          } else if (choice == "MINECRAFT") {
            const roleID = "811663653140168741";
            handleRole(interaction, member, roleID, "Minecraft");
          } else if (choice == "DISCORDJS") {
            const roleID = "1185978943745040384";
            handleRole(interaction, member, roleID, "Discord JS");
          } 
        });
      } else if (interaction.customId === interactionSetConfig.name) {
        interactionSetConfig.execute(interaction);
      }
    }

    //Unmute quelqu'un avec le bouton sur le message des logs
    if (interaction.customId === "UNMUTE") {
      const memberId = unmuteRequests.get(interaction.message.id);
      if (!memberId) {
        return interaction.reply({ content: 'Membre non trouvé', ephemeral: true });
      }
    
      const member = await interaction.guild.members.fetch(memberId);
      if (!member) {
        return interaction.reply({ content: 'Membre non trouvé', ephemeral: true });
      }
    
      let secondsRemaining = 30;
      const originalContent = `🙏🏻丨𝐌erci de répondre la **raison** pour laquelle tu veux unmute **\`${member.user.tag}\`**.`;
      const replyMessage = await interaction.reply({
        content: `${originalContent} ***${secondsRemaining}s***`,
        fetchReply: true
      });
    
      const interval = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining > 0) {
          replyMessage.edit({ content: `${originalContent} ***${secondsRemaining}s***` }).catch(error => {
            if (error.code === 10008) {
              clearInterval(interval);
            } else {
              console.error('Erreur lors de la mise à jour du message :', error);
            }
          });
        } else {
          clearInterval(interval);
        }
      }, 1000);
    
      const filter = response => response.author.id === interaction.user.id && !response.author.bot;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });
    
      collector.on('collect', async response => {
        clearInterval(interval);
        const reason = response.content;
    
        const muteRole = interaction.guild.roles.cache.find(role => role.name === "丨𝐌uted");
        if (muteRole) {
          await member.roles.remove(muteRole).catch(console.error);
          const roleStillInUse = interaction.guild.members.cache.some(m => m.roles.cache.has(muteRole.id));
          if (!roleStillInUse) {
            await muteRole.delete().catch(console.error);
          }
        }
    
        await Warning.deleteOne({ userId: member.id, guildId: interaction.guild.id });
    
        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTitle(`丨𝐕ient d'unmute ***${member.user.tag}***.`)
          .setDescription(`𝐏our la raison suivante : \`${reason}.\``)
          .setColor("Green")
          .setTimestamp();
    
        const serverConfig = await ServerConfig.findOne({ serverID: interaction.guild.id });
        if (serverConfig && serverConfig.logChannelID) {
          const logChannel = interaction.guild.channels.cache.get(serverConfig.logChannelID);
          if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] }).catch(console.error);
          }
        }
    
        await response.delete().catch(console.error);
        await replyMessage.delete().catch(console.error);
        const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);
        const newEmbed = originalMessage.embeds[0];
        await originalMessage.edit({ embeds: [newEmbed], components: [] }).catch(console.error);
      });
    
      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ content: '⏳丨𝐓emps écoulé pour la réponse, on est déjà à l\'épisode suivant de la série. 𝐀ucune raison fournie pour l\'unmute.', components: [] });
        }
      });
    }

    // Gérer les rôles des utilisateurs
    async function handleRole(interaction, member, roleID, roleName) {
      if (member.roles.cache.some((role) => role.id == roleID)) {
        await member.roles.remove(roleID);
        interaction.editReply({
          content: `Votre rôle \`${roleName}\` a été supprimé.`,
        });
      } else {
        await member.roles.add(roleID);
        interaction.editReply({
          content: `Vous avez récupéré votre rôle \`${roleName}\`.`,
        });
      }
    }

    // Validation règlement avec rôle
    if (interaction.customId === "VALID_REGL") {
      const guild = await interaction.client.guilds.fetch(interaction.guildId);
      const member = await guild.members.fetch(interaction.user.id);

      const serverConfig = await ServerConfig.findOne({ serverID: guild.id });

      if (serverConfig && serverConfig.roleReglementID) {
        const roleId = serverConfig.roleReglementID;

        if (!guild.roles.cache.has(roleId)) {
          await interaction.reply({
            content: `Le rôle ${roleId} n'existe pas sur ce serveur.`,
            ephemeral: true,
          });
          return;
        }

        if (member.roles.cache.has(roleId)) {
          await interaction.reply({
            content:
              "丨𝐓u as déjà validé le règlement, quelque chose à te reprocher peut-être ?? :thinking:",
            ephemeral: true,
          });
          return;
        }

        try {
          await member.roles.add(roleId);
          await interaction.reply({
            content:
              "Merci d'avoir pris connaissance du règlement. :sunglasses:",
            ephemeral: true,
          });
        } catch (error) {
          if (error.code === 50013) {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content:
                  "Contact un modérateur avec l'erreur suivante : Le bot doit être `tout en haut` dans la liste des rôles du serveur. N'oublie pas de me mettre `administrateur`.\nUne fois que c'est fait tu pourras validé le règlement !",
                ephemeral: true,
              });
            } else if (interaction.deferred || interaction.replied) {
              await interaction.followUp({
                content:
                  "Contact un modérateur avec l'erreur suivante : Le bot doit être `tout en haut` dans la liste des rôles du serveur. N'oublie pas de me mettre `administrateur`.\nUne fois que c'est fait tu pourras validé le règlement !",
                ephemeral: true,
              });
            }
          } else {
            console.error(error);
          }
        }
      }
    }

    //Bouton pour Ticket => Création salon avec fermeture une fois terminé.
    if (interaction.customId === "CREATE_CHANNEL") {
      const serverConfig = await mongoose
          .model("ServerConfig")
          .findOne({ serverID: interaction.guild.id });
      const DisboardBOTId = "302050872383242240";
      const AdminRoleID = serverConfig.ticketAdminRoleID;
      await interaction.deferReply({ ephemeral: true });
  
      const parentChannel = interaction.channel;
  
      const existingChannel = interaction.guild.channels.cache.find(channel => 
          channel.name.includes(`𝐓icket丨${interaction.user.username}`) && 
          channel.parentId === parentChannel.parentId
      );
  
      if (existingChannel) {
            await interaction.editReply({
              content: "丨𝐖hoa, du calme champion ! 𝐓u as déjà un __ticket__ ouvert. 𝐎n n'est pas des robots... enfin presque. 𝐋aisse-nous un peu de temps avant d'en ouvrir un autre !",
          });
          return;
      }
  
      let permissionOverwrites = [
          {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
              id: interaction.user.id,
              allow: [
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ViewChannel,
              ],
          },
          {
              id: DisboardBOTId,
              deny: [PermissionsBitField.Flags.ViewChannel],
          },
      ];
  
      if (AdminRoleID) {
          permissionOverwrites.push({
              id: AdminRoleID,
              allow: [
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ViewChannel,
              ],
          });
      }
  
      let channel = await interaction.guild.channels.create({
          name: `🎫丨𝐓icket丨${interaction.user.username}`,
          parent: parentChannel.parentId,
          type: ChannelType.GuildText,
          permissionOverwrites: permissionOverwrites,
      });
  
      const clearembed = new EmbedBuilder()
          .setDescription(
              `${interaction.user}\n丨𝐓on dossier va être étudié, __merci d'être patient__, notre équipe s'occupe de tout !`
          )
          .setColor("Blue");
  
      const deletebutton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
              .setCustomId("DELETE_TICKET")
              .setEmoji("❌")
              .setLabel("Supprimer le ticket")
              .setStyle(ButtonStyle.Danger)
      );
  
      await channel.send({
          embeds: [clearembed],
          components: [deletebutton],
      });
  
      if (!AdminRoleID) {
          await channel.send(
              "⚠丨__**Attention**__丨Le rôle d'administrateur __n'est pas__ défini pour la gestion des tickets. Un modérateur vient d'être contacté pour traiter le problème dans les plus brefs délais, désolé de l'attente."
          );
      }
  
      await interaction.editReply({
          content: "丨𝐍otre équipe arrive à ton soutien camarade !",
      });
    }
    if (interaction.customId === "DELETE_TICKET") {
      const surbutton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("VALID_DELETE")
            .setLabel("Oui")
            .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("PAS_SUPPRIMER")
            .setLabel("Non")
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({
        content: "**Es-tu sur de vouloir supprimer ce ticket ?**",
        components: [surbutton],
        ephemeral: true,
      });
    }
    if (interaction.customId === "VALID_DELETE") {
      await interaction.guild.channels.delete(interaction.channel);
    }

    //Gestion du SetConfig
    if (interaction.customId === "LOG_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon pour les `𝐋og` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false;
  
      const interval = setInterval(() => {
          if (messageDeleted) {
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐄ssaie avec un salon qui existe non ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  logChannelID: channelId,
                  logChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour les \`𝐋ogs\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, on a découvert de nouvelles planètes depuis.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "ROLE_LISTE") { //OK
      const serverRoles = await ServerRole.findOne({
        serverID: interaction.guild.id,
      });

      const rowRolesListe = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ROLES_PERSOLISTE")
          .setEmoji("🖌️")
          .setLabel("Modifier les rôles")
          .setStyle(ButtonStyle.Secondary)
      );

      if (!serverRoles) {
        return interaction.reply({
          content: "👁️‍🗨️丨𝐈l n'y a pas de rôles stockés pour ce serveur.",
          components: [rowRolesListe],
        });
      }

      const levels = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

      const prestige0Roles = serverRoles.prestige0Roles
        .map(
          (id, index) =>
            `𝐍iveau **${levels[index]}** | ${
              interaction.guild.roles.cache.get(id)?.toString() ||
              "Rôle inconnu"
            }`
        )
        .join("\n");
      const prestige1Roles = serverRoles.prestige1Roles
        .map(
          (id, index) =>
            `𝐍iveau **${levels[index]}** | ${
              interaction.guild.roles.cache.get(id)?.toString() ||
              "Rôle inconnu"
            }`
        )
        .join("\n");

      const roleEmbed = new EmbedBuilder()
        .setTitle("__𝐋iste des Rôles__")
        .setColor("#b3c7ff")
        .setDescription(
          `__**𝐑ôles Prestige 0 :**__\n\n ${prestige0Roles}\n\n\n__**𝐑ôles Prestige 1 :**__\n\n ${prestige1Roles}`
        );

      interaction.reply({ embeds: [roleEmbed], components: [rowRolesListe] });
    }
    if (interaction.customId === "ROLES_PERSOLISTE") {
      if (!interaction.guild) {
          return interaction.reply({ content: "Cette commande ne peut être utilisée que dans une guilde.", ephemeral: true });
      }
  
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(console.error);
      if (!botMember) {
          return interaction.reply({ content: "Erreur : Impossible de récupérer les informations du bot dans la guilde.", ephemeral: true });
      }
  
      let currentPrestige = "prestige0Roles";
      let secondsRemaining = 180;
      let originalContent = `🙏🏻丨Merci de répondre en mentionnant les rôles personnalisés. Tu peux mentionner jusqu'à 12 rôles. *(Exemple: @Role1, @Role2, etc.)*`;
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(console.error);
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 180000
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
  
          const roles = m.mentions.roles.map(role => role.id);
  
          if (roles.length > 12) {
              await interaction.followUp("😵 Vous avez mentionné trop de rôles, le maximum est de 12.");
              return;
          }
  
          if (roles.some(roleId => interaction.guild.roles.cache.get(roleId).position >= botMember.roles.highest.position)) {
              await interaction.followUp("↘️ Un ou plusieurs des rôles mentionnés sont supérieurs à mon rôle le plus élevé.");
              return;
          }
  
          let server = await ServerRole.findOne({ serverID: interaction.guild.id }) || new ServerRole({
              serverID: interaction.guild.id,
              serverName: interaction.guild.name,
              prestige0Roles: [],
              prestige1Roles: [],
          });
  
          server[currentPrestige] = roles;
          await server.save();
  
          const successMessage = `🤘 Les rôles pour le prestige \`${currentPrestige.replace('prestige', '').replace('Roles', '')}\` ont été enregistrés avec succès !`;
          await interaction.followUp({ content: successMessage, ephemeral: true });
  
          if (currentPrestige === "prestige0Roles") {
              currentPrestige = "prestige1Roles";
              originalContent = `🙏🏻 Entrez maintenant les rôles pour le prestige \`1\`. N'oubliez pas, vous pouvez mentionner jusqu'à 12 rôles pour chaque prestige.`;
              await interaction.followUp({ content: originalContent, ephemeral: false });
              secondsRemaining = 180; // Reset timer for next collection
          } else {
              collector.stop();
          }
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time") {
              await interaction.followUp({ content: "⏳ Temps écoulé pour la réponse. Veuillez réessayer.", ephemeral: true });
          }
      });
    }
    if (interaction.customId === "WELCOME_BUTTON") { // OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon de `𝐁ienvenue` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false;
  
      const interval = setInterval(() => {
          if (messageDeleted) { 
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐄ssaie avec un salon qui existe non ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  welcomeChannelID: channelId,
                  welcomeChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon de \`𝐁ienvenue\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, on est déjà à l'épisode suivant de la série.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "REGL_BUTTON") { // OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon de `𝐑èglement` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false;
  
      const interval = setInterval(() => {
          if (messageDeleted) { 
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐄ssaye avec un salon qui existe non ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  reglementChannelID: channelId,
                  reglementChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘🏻丨𝐋e salon pour le \`𝐑èglement\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, tu as fini de peindre la Joconde ?", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "REGL_PUSH") { 
      let serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
      if (!serverConfig || !serverConfig.reglementChannelID) {
        return interaction.reply({
          content:
            "Aucun salon de 𝐑èglement n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salons`.",
          ephemeral: true,
        });
      }

      const Reglementembed = new EmbedBuilder()
        .setColor("#b3c7ff")
        .setTitle(
          `*_~𝐑èglement de la ${interaction.guild.name} pour votre bonne formation~_*`
        )
        .setDescription(
          `\n**Merci de bien vouloir lire toute les règles ainsi que de les respecter !**\n\n:wave:\`丨𝐁ienvenue :\` \nTout d'abord bienvenue parmi nous. Tu peux à présent lire et valider le règlement puis choisir tes rôles dans le salon \`Rôles\`. Si tu es un streamer, tu peux obtenir le rôle \`Streamer\` pour avoir les notifications de TES lives sur notre serveur ! Pour toute demande, informations ou signalement, tu peux ouvrir un ticket dans le \`salon prévu à cet effet\`, un modérateur se fera un plaisir de te répondre.\n\n:rotating_light:\`丨𝐌entions :\`\n Évitez les mentions inutiles et \`réfléchissez\` avant de poser une question. Vous n'êtes pas seuls et les réponses ont souvent déjà été données. Il sera punissable d'une \`exclusion\` et/ou d'un \`bannissement\` avec sursis.\n\n:warning:\`丨𝐏ublicités :\`\n Toute publicité \`non autorisé\` par un membre du staff est \`strictement interdite\` sur le serveur mais également par message privé. Il sera punissable d'une \`exclusion\` et/ou d'un \`bannissement\` avec sursis.\n\n:underage:\`丨𝐍SFW :\`\nNSFW, NSFL et le contenu malsain n'est \`pas autorisé\` sur le serveur. Il sera punissable d'un \`bannissement\` !\n\n:flag_fr:\`丨𝐅rançais :\`\nLa structure est \`francophone\`, veuillez donc écrire français uniquement pour une compréhension facile de tous les membres de la communauté. Il sera punissable si les avertissements sont répétés et non écoutés.`
        )
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({
          text: `𝐂ordialement l'équipe ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });

      const rowValidRegl = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("VALID_REGL")
          .setLabel("📝丨𝐕alider le 𝐑èglement丨📝")
          .setStyle(ButtonStyle.Success)
      );
      const ReglementChannel = bot.channels.cache.get(
        serverConfig.reglementChannelID
      );
      if (ReglementChannel) {
        ReglementChannel.send({
          embeds: [Reglementembed],
          components: [rowValidRegl],
        });
      }
    }
    if (interaction.customId === "REGL_ROLE") { //OK
      if (!interaction.guild) {
          return interaction.reply({ content: "Cette commande ne peut être utilisée que dans une guilde.", ephemeral: true });
      }
  
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(console.error);
      if (!botMember) {
          return interaction.reply({ content: "Erreur : Impossible de récupérer les informations du bot dans la guilde.", ephemeral: true });
      }
  
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre en faisant un **tag** (@votre_rôle) pour donner le rôle lorsqu'un utilisateur validera le `𝐑èglement`.";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
  
      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  clearInterval(interval);
                  console.error('Erreur lors de la mise à jour du message :', error);
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const role = m.mentions.roles.first();
          if (!role) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐑ôle invalide/inexistant. 𝐎ublie pas l'arobase (*@*).", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
  
          if (role.position >= botMember.roles.highest.position) {
              const errorMsg = await interaction.followUp({ content: "↘️丨𝐋e rôle doit être inférieur à mon rôle le plus élevé.", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
  
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              { roleReglementID: role.id, roleReglementName: role.name },
              { upsert: true, new: true }
          );
  
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e rôle pour le \`𝐑èglement\` a été mis à jour avec succès : **${role.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time") {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, même les glaciers fondent plus vite.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code === 10008) {
                      } else {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                        }
                    });    
                });
          }, 1000);
        });
    }
    if (interaction.customId === "WELCOME_ROLE") { //OK
      if (!interaction.guild) {
          return interaction.reply({ content: "Cette commande ne peut être utilisée que dans une guilde.", ephemeral: true });
      }
  
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(console.error);
      if (!botMember) {
          return interaction.reply({ content: "Erreur : Impossible de récupérer les informations du bot dans la guilde.", ephemeral: true });
      }
  
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre en faisant un tag (@votre_rôle) pour le rôle `𝐁ienvenue` lors de l'arrivée de tes utilisateurs.";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
  
      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  clearInterval(interval);
                  console.error('Erreur lors de la mise à jour du message :', error);
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const role = m.mentions.roles.first();
          if (!role) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐑ôle invalide/inexistant. 𝐎ublie pas l'arobase (*@*).", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
  
          if (role.position >= botMember.roles.highest.position) {
              const errorMsg = await interaction.followUp({ content: "↘️丨𝐋e rôle doit être inférieur à mon rôle le plus élevé.", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
  
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              { roleWelcomeID: role.id, roleWelcomeName: role.name },
              { upsert: true, new: true }
          );
  
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e rôle de \`𝐁ienvenue\` a été mis à jour avec succès : **${role.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time") {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse. Même la confiture prend moins de temps à se figer.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code === 10008) {
                      } else {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "IMPLICATION_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon de `𝐈mplications` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false;
  
      const interval = setInterval(() => {
          if (messageDeleted) {
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐄ssaie avec un salon qui existe non ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  implicationsChannelID: channelId,
                  implicationsChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour les \`𝐈mplications\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, et la pizza est encore au four ?", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "DAILY_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon pour le `𝐃aily` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
    
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
    
      let followUpMessages = [];
      let messageDeleted = false; // Variable pour suivre si le message initial a été supprimé
    
      const interval = setInterval(() => {
          if (messageDeleted) { 
              clearInterval(interval);
              return;
          }
    
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) { // Si le message n'existe plus
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
    
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
    
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
    
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐄ssaie avec un salon qui existe non ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  dailyChannelID: channelId,
                  dailyChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour le \`𝐃aily\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
    
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) { // Vérifie si le message initial existe toujours
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, on a changé de président depuis.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "DAILY_PUSH") { 
      let serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
      if (!serverConfig || !serverConfig.dailyChannelID) {
        return interaction.reply({
          content:
            "Aucun salon pour le 𝐃aily n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salon`.",
          ephemeral: true,
        });
      }
      const DailyEmbed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle(`――――――∈ 𝐆ain d'𝐗𝐏 journalier ! ∋――――――`)
        .setDescription(
          `\n𝐂'est ici que tu peux récupérer ton \`𝐃aily\`. 𝐈l sera disponible à nouveau après \`23H\`. 𝐍e l'oublie pas, lui en tout cas ne t'oublieras pas haha.`
        )
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({
          text: `𝐂ordialement l'équipe ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });

      const rowPushDaily = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("DAILYXP")
          .setLabel("💸丨𝐑écupérer l'𝐗𝐏丨💸")
          .setStyle(ButtonStyle.Success)
      );
      const dailyChannel = bot.channels.cache.get(serverConfig.dailyChannelID);
      if (dailyChannel) {
        dailyChannel.send({
          embeds: [DailyEmbed],
          components: [rowPushDaily],
        });
      }
    }
    if (interaction.customId === "IDEE_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon pour les `𝐒uggestions` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false; // Variable pour suivre si le message a été supprimé
  
      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) { // Vérifie si le message n'existe plus
                      clearInterval(interval);
                      messageDeleted = true;
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐄ssaye avec un salon qui existe non ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  suggestionsChannelID: channelId,
                  suggestionsChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour les \`𝐒uggestions\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) { // Vérifie si le message initial a été supprimé
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, j'ai eu le temps d'apprendre le chinois.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "ROLECHANNEL_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon pour les `𝐑ôles` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
  
      let messageDeleted = false;

      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      clearInterval(interval);
                      messageDeleted = true;
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);

      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });

      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);

          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐄ssaye avec un salon qui existe non ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  roleChannelID: channelId,
                  roleChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour les \`𝐑ôles\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });

      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, tu préparais un gâteau ouuuu un gratte-ciel ?", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "TICKET_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon pour les `𝐓ickets` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
    
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false;
    
      const interval = setInterval(() => {
          if (messageDeleted) {
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
    
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
    
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐓u m'as mis quoi ton code de carte bleue ou quoi ?", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  ticketChannelID: channelId,
                  ticketChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour les \`𝐓ickets\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
    
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, et j'ai déjà oublié pourquoi j'attendais...", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "TICKET_PUSH") { 
      let serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
      if (!serverConfig || !serverConfig.ticketChannelID) {
        return interaction.reply({
          content:
            "Aucun salon pour les 𝐓ickets n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salon`.",
          ephemeral: true,
        });
      }
      const TicketEmbed = new EmbedBuilder()
        .setColor("#b3c7ff")
        .setTitle(`―――――― :inbox_tray: 𝐎uvrir un 𝐓icket :inbox_tray: ――――――`)
        .setDescription(
          `\n**𝐌erci de respecter les règles concernant les \`𝐓ickets\` !**\n\n\`1.\` 𝐍e pas créer de ticket sans raison.\n\n\`2.\` 𝐍e pas mentionner le staff sauf si vous n'avez pas eu de réponse durant 24h.\n\n\`3.\` 𝐍e pas créer de ticket pour insulter le staff ou une autre personne.`
        )
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({
          text: `𝐂ordialement, l'équipe ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });

      const rowPushTicket = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("CREATE_CHANNEL")
          .setLabel("🎫丨𝐂réer un 𝐓icket丨🎫")
          .setStyle(ButtonStyle.Primary)
      );
      const ticketChannel = bot.channels.cache.get(
        serverConfig.ticketChannelID
      );
      if (ticketChannel) {
        ticketChannel.send({
          embeds: [TicketEmbed],
          components: [rowPushTicket],
        });
        return interaction.reply({ content: "Embed crée.", ephemeral: true });
      }
    }
    if (interaction.customId === "TICKET_ROLE") { // OK
      if (!interaction.guild) {
          return interaction.reply({ content: "Cette commande ne peut être utilisée que dans une guilde.", ephemeral: true });
      }
  
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(console.error);
      if (!botMember) {
          return interaction.reply({ content: "Erreur : Impossible de récupérer les informations du bot dans la guilde.", ephemeral: true });
      }
  
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre en faisant un tag (@votre_rôle) pour le rôle `𝐀dministrateur` de ton serveur.";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
      
      let followUpMessages = [];
      
      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  clearInterval(interval);
                  console.error('Erreur lors de la mise à jour du message :', error);
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
      
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
      
      collector.on("collect", async (m) => {
          clearInterval(interval);
          await deleteMessage(m)
          followUpMessages.push(m);
      
          const role = m.mentions.roles.first();
          if (!role) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐑ôle invalide/inexistant. 𝐎ublie pas l'arobase (*@*).", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
      
          if (role.position >= botMember.roles.highest.position) {
              const errorMsg = await interaction.followUp({ content: "↘️丨𝐋e rôle doit être inférieur à mon rôle le plus élevé.", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
      
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              { ticketAdminRoleID: role.id, ticketAdminRoleName: role.name },
              { upsert: true, new: true }
          );
      
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e rôle \`𝐀dministrateur\` a été mis à jour avec succès : **${role.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
      
      collector.on("end", async (collected, reason) => {
          if (reason === "time") {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, tu as démêlé tous les fils de tes écouteurs ?", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code === 10008) {
                      } else {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "ROLECHANNEL_PUSH") {
      const serverRoleMenus = await ServerRoleMenu.findOne({ serverID: interaction.guild.id });
  
      if (!serverRoleMenus || serverRoleMenus.menus.length === 0) {
          return interaction.reply({ content: "Aucun menu déroulant pour les rôles n'a été configuré sur ce serveur.", ephemeral: true });
      }
  
      const serverConfig = await ServerConfig.findOne({ serverID: interaction.guild.id });
      if (!serverConfig || !serverConfig.roleChannelID) {
          return interaction.reply({ content: "Le channel des rôles n'est pas configuré.", ephemeral: true });
      }
  
      const roleChannel = interaction.guild.channels.cache.get(serverConfig.roleChannelID);
      if (!roleChannel) {
          return interaction.reply({ content: "Le channel des rôles configuré est introuvable.", ephemeral: true });
      }
  
      const menuOptions = serverRoleMenus.menus.flatMap(menu => {
          if (!menu.menuName || !Array.isArray(menu.roles) || menu.roles.length === 0) {
              console.warn(`Menu invalide trouvé : ${menu.menuName}`);
              return [];
          }
  
          return menu.roles.map(role => {
              const emojiMatch = role.displayName.match(/<:\w+:\d+>/);
              const emoji = emojiMatch ? {
                  name: emojiMatch[0].slice(2, -1).split(':')[0],
                  id: emojiMatch[0].slice(2, -1).split(':')[1]
              } : undefined;
  
              const label = emojiMatch ? role.displayName.replace(emojiMatch[0], '').trim() : role.displayName;
  
              return {
                  label: label,
                  value: role.roleId,
                  emoji: emoji || undefined,
              };
          });
      });
  
      const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
              .setCustomId('Role_Menu')
              .setPlaceholder('丨𝐒éléctionne un rôle. 🎭')
              .addOptions(menuOptions)
      );
  
      const descriptions = [
          `🌟 ◟𝐂hoisis tes rôles et débloque l’accès aux salons réservés pour papoter avec la communauté passionnée de ton jeu préféré ! 🎮\n\n🔥 ◟𝐐ue tu sois là pour échanger des stratégies, partager tes exploits ou simplement pour rigoler avec d'autres gamers, cet endroit est fait pour toi ! 𝐄t si l'envie de changer de jeu te prend, pas de souci : tu peux modifier tes rôles à tout moment.\n\n **𝐑ejoins-nous**, amuse-toi, et plonge dans un océan de fun et d’amitié ! 𝐏rêt à faire partie de cette légende ? 𝐂’est parti, à toi de jouer ! ✨`,
          `🎊 ◟𝐓u es à un clic de l'aventure ! Choisis tes rôles et ouvre les portes des salons où les passionnés de ton jeu se réunissent ! 🎮\n\n🔥 ◟𝐓u peux discuter de stratégies, partager tes réussites, ou juste t’amuser avec d’autres gamers ! 𝐄t si un autre jeu t’appelle, change tes rôles sans hésiter !\n\n **𝐑ejoins-nous**, amuse-toi, et fais partie de cette communauté incroyable ! 𝐏rêt à te lancer ? 𝐂’est à toi de jouer ! ✨`,
          `🎮 ◟𝐂'est le moment de briller ! Choisis tes rôles et accède aux salons réservés où les fans de ton jeu se retrouvent ! 🌟\n\n🔥 ◟𝐔ne multitude de discussions t'attendent, que ce soit pour échanger des conseils ou juste pour passer un bon moment ! 𝐄t si l'envie d'explorer un autre jeu te prend, adapte tes rôles à ta guise.\n\n **𝐑ejoins-nous**, amuse-toi, et plonge dans l'univers du gaming ! 𝐏rêt à écrire ta propre légende ? 𝐂’est parti, à toi de jouer ! ✨`,
          `✨ ◟𝐍e manque plus qu'une chose : tes rôles ! Choisis-les pour accéder aux salons où se trouve la communauté de ton jeu préféré ! 🎮\n\n🔥 ◟𝐂e lieu est parfait pour échanger des stratégies, partager tes exploits, ou juste rigoler avec d'autres gamers ! 𝐄t si un nouveau défi te tente, change tes rôles à tout moment.\n\n **𝐑ejoins-nous**, amuse-toi, et plonge dans un océan de fun ! 𝐏rêt à faire partie de cette grande aventure ? 𝐂’est le moment de te lancer ! 💥`,
          `💬 ◟𝐒électionne tes rôles et débloque des salons exclusifs pour discuter avec d'autres passionnés de ton jeu ! 🎮\n\n🔥 ◟𝐓u peux échanger des astuces, partager tes victoires ou juste profiter d'un bon moment ensemble ! 𝐄t si tu veux changer d’univers, modifie tes rôles comme bon te semble.\n\n **𝐑ejoins-nous**, éclate-toi, et fais partie de cette communauté dynamique ! 𝐏rêt à vivre cette aventure ? 𝐂’est à toi de jouer ! ✨`,
          `🚀 ◟**𝐄mbarque pour une nouvelle quête !** 𝐂hoisis tes rôles pour accéder aux salons exclusifs et connecter avec la communauté de ton jeu adoré ! 🎮\n\n🌟 ◟Que tu sois ici pour partager des astuces, célébrer tes victoires ou juste t'amuser, cet endroit est fait pour toi ! 𝐄t si l’appel d’un autre jeu se fait sentir, pas de souci : change tes rôles quand tu veux.\n\n**𝐑ejoins-nous**, éclate-toi, et plonges dans un océan de fun et d’amitié ! 𝐏rêt à faire partie de cette aventure incroyable ? 𝐂’est le moment de briller ! ✨`,
          `🎉 ◟**𝐋a fête commence ici !** 𝐂hoisis tes rôles pour accéder aux salons réservés et te connecter avec les fans de ton jeu préféré ! 🎮\n\n🎊 ◟Que tu sois là pour échanger des conseils, partager tes succès ou juste pour rire, cet endroit est fait pour toi ! 𝐄t si l’envie d’un autre jeu te prend, pas de problème : modifie tes rôles à ta guise.\n\n**𝐑ejoins-nous**, amuse-toi, et plonge dans un océan de bonne humeur et d’amitié ! 𝐏rêt à rejoindre la légende ? 𝐂’est parti, à toi de jouer ! ✨`,
          `🌈 ◟**𝐋’aventure t’attend !** 𝐂hoisis tes rôles pour débloquer l’accès aux salons dédiés et interagir avec la communauté de ton jeu favori ! 🎮\n\n💪 ◟Que tu souhaites échanger des stratégies, partager tes succès ou simplement t’amuser, cet espace est pour toi ! 𝐄t si tu veux changer de jeu, aucun souci : adapte tes rôles à tout moment.\n\n**𝐑ejoins-nous**, amuse-toi, et plonge dans un monde de fun et d’amitié ! 𝐏rêt à faire partie de cette grande aventure ? 𝐂’est le moment de briller ! 💥`,
      ];
  
      const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  
      if (menuOptions.length === 0) {
          console.error('[ROLEMENU] Aucune option de menu disponible. Vérifiez les noms des menus et les rôles associés.');
          await interaction.reply({ content: "Aucune option de rôle valide à afficher. -> contact mon créateur `tbmpqf`", ephemeral: true });
          return;
      } else {
          const RoleEmbed = new EmbedBuilder()
              .setColor("#b3c7ff")
              .setTitle(`丨𝐂hoisis tes rôles 🏷️`)
              .setDescription(randomDescription)
              .setFooter({
                  text: `𝐂ordialement, l'équipe ${interaction.guild.name}`,
                  iconURL: interaction.guild.iconURL(),
              });
  
          await roleChannel.send({ embeds: [RoleEmbed], components: [row] });
          await interaction.reply({ content: "丨𝐋e menu des rôles a été envoyé dans le salon de rôles configuré.", ephemeral: true });
      }
    }
    if (interaction.customId === "ROLECHANNEL_LISTE") { 
      const serverRoleMenus = await ServerRoleMenu.findOne({ serverID: interaction.guild.id });
      
      const NewRoleButton = new ButtonBuilder()
          .setCustomId('ROLECHANNEL_ADD')
          .setLabel('Ajouter rôle')
          .setEmoji("➕")
          .setStyle(ButtonStyle.Success);
  
      const DeleteRoleButton = new ButtonBuilder()
          .setCustomId('ROLECHANNEL_REMOVE')
          .setLabel('Supprimer rôle')
          .setEmoji("❌")
          .setStyle(ButtonStyle.Danger);
  
      const ActionButtons = new ActionRowBuilder().addComponents(NewRoleButton, DeleteRoleButton);
      
      if (!serverRoleMenus || serverRoleMenus.menus.length === 0) {
          return interaction.reply({
              content: "丨𝐀ucune donnée pour le rôle menu n'a été configurée pour ce serveur. 𝐏our en ajouter un, utilise le bouton \`Ajouter rôle\` ! 𝐂ela te permettra de créer un nouveau menu et d’y associer les rôles souhaités. 𝐏rends quelques instants pour configurer cela et donner plus de choix à la communauté ! 𝐒i jamais tu as fais une erreur ou si tu souhaites apporter des modifications par la suite pas de panique, tu pourras toujours ajuster les paramètres !",
              components: [ActionButtons],
              ephemeral: true
          });
      }
  
      const embed = new EmbedBuilder()
          .setTitle("丨__𝐋iste des rôles configurés__")
          .setColor("#0099ff")
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/5151/5151145.png");
  
      serverRoleMenus.menus.forEach(menu => {
          embed.addFields({ 
              name: menu.menuName !== 'DefaultMenu' ? menu.menuName : '\u200B',
              value: menu.roles.map(role => {
                  const roleObject = interaction.guild.roles.cache.get(role.roleId);
                  const displayName = role.displayName || role.roleName || 'INCONNU';
                  return `**◟** ${roleObject ? `${displayName} - ${roleObject.toString()}` : '𝐑ôle non trouvé.'}`;
              }).join('\n\n') || '𝐀ucun rôle configuré.'
          });
      });
  
      await interaction.reply({
          embeds: [embed],
          components: [ActionButtons],
          ephemeral: true
      });
    }
    if (interaction.customId === 'ROLECHANNEL_ADD') {
      if (!interaction.guild) {
          return interaction.reply({ content: "Cette commande ne peut être utilisée que dans un serveur.", ephemeral: true });
      }
  
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(console.error);
      if (!botMember) {
          return interaction.reply({ content: "Erreur : Impossible de récupérer les informations du bot dans le serveur.", ephemeral: true });
      }
  
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre le rôle et de fournir un nom pour le menu. (**exemple : @MONROLE NomDeMonRôle**). ~~Possibilité de mettre un emoji devant le nom.~~";
  
      const initialReply = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let messageDeleted = false;

    const interval = setInterval(async () => {
        if (secondsRemaining > 0) {
            secondsRemaining--;
            if (initialReply && initialReply.editable) {
                await initialReply.edit(`${originalContent} ***${secondsRemaining}s***`).catch((error) => {
                    if (error.code === 10008) {
                        clearInterval(interval);
                        messageDeleted = true;
                    } else {
                        console.error('Erreur lors de l’édition du message:', error);
                    }
                });
            } else {
                clearInterval(interval);
                messageDeleted = true;
            }
        } else {
            clearInterval(interval);
        }
    }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          await deleteMessage(m)
  
          const role = m.mentions.roles.first();
          const displayName = m.content.replace(`<@&${role.id}>`, "").trim();
  
          if (!role) {
              await interaction.followUp({ content: "😵丨𝐑ôle invalide/inexistant. 𝐍'oublie pas l'arobase (*@*).", ephemeral: true });
              return deleteMessage(initialReply);
          }
  
          if (role.position >= botMember.roles.highest.position) {
              await interaction.followUp({ content: "↘️丨𝐋e rôle doit être inférieur à mon rôle le plus élevé.", ephemeral: true });
              return deleteMessage(initialReply);
          }
  
          const serverRoleMenu = await ServerRoleMenu.findOne({ serverID: interaction.guild.id });
  
          if (!serverRoleMenu) {
              await ServerRoleMenu.create({
                  serverID: interaction.guild.id,
                  serverName: interaction.guild.name,
                  menus: [{
                      menuName: 'DefaultMenu',
                      roles: [{
                          roleName: role.name,
                          roleId: role.id,
                          displayName: displayName || role.name
                      }]
                  }]
              });
              await interaction.followUp({ content: `🤘丨𝐋e rôle a été ajouté avec succès : **${role.name}** sous le nom **${displayName || role.name}**.`, ephemeral: true });
              return deleteMessage(initialReply);
          }
  
          const menu = serverRoleMenu.menus.find(m => m.menuName === 'DefaultMenu');
          if (!menu) {
              await interaction.followUp({ content: "🚫丨𝐀ucun menu de rôles trouvé.", ephemeral: true });
              return deleteMessage(initialReply);
          }
  
          const roleExists = menu.roles.find(r => r.roleId === role.id);
          if (roleExists) {
              await interaction.followUp({ content: "⚠️丨𝐂e rôle est déjà ajouté.", ephemeral: true });
              return deleteMessage(initialReply);
          }
  
          menu.roles.push({
              roleName: role.name,
              roleId: role.id,
              displayName: displayName || role.name
          });
  
          await serverRoleMenu.save();
  
          await interaction.followUp({ content: `🤘丨𝐋e rôle a été ajouté avec succès : **${role.name}** sous le nom **${displayName || role.name}**.`, ephemeral: true });
          await deleteMessage(initialReply);
      });
  
      collector.on("end", async (collected, reason) => {
        clearInterval(interval);
        if (reason === "time" && !messageDeleted) {
            await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse. 𝐌ême la confiture prend moins de temps à se figer.", ephemeral: true });
        }
        await deleteMessage(initialReply);
      });
    }
    // FONCTION ERROR DELETE MESSAGE
    async function deleteMessage(message) {
      if (message && message.deletable) {
          try {
              await message.delete();
          } catch (error) {
              if (error.code !== 10008) {
                  return
              }
          }
      }
    }
    if (interaction.customId === 'ROLECHANNEL_REMOVE') {
      const serverRoleMenus = await ServerRoleMenu.findOne({ serverID: interaction.guild.id });
  
      // Vérifiez si serverRoleMenus existe avant d'accéder à ses propriétés
      if (!serverRoleMenus || !serverRoleMenus.menus || serverRoleMenus.menus.length === 0) {
          return interaction.reply({ content: "丨𝐈l n'y a aucun rôle disponible pour la suppression sur ton serveur.", ephemeral: true });
      }
  
      const roleOptions = serverRoleMenus.menus.flatMap(menu => 
          menu.roles.map(role => {
              const roleObject = interaction.guild.roles.cache.get(role.roleId);
              return roleObject ? { label: roleObject.name, value: roleObject.id } : null;
          }).filter(option => option)
      );
  
      if (roleOptions.length === 0) {
          return interaction.reply({ content: "丨𝐈l n'y a aucun rôle disponible pour la suppression sur ton serveur.", ephemeral: true });
      }
  
      const roleSelectMenu = new StringSelectMenuBuilder()
          .setCustomId('ROLECHANNEL_SELECT_REMOVE')
          .setPlaceholder('丨𝐐uel rôle supprimer ?')
          .addOptions(roleOptions);
  
      const roleSelectRow = new ActionRowBuilder().addComponents(roleSelectMenu);
  
      await interaction.reply({ content: "丨𝐋'heure est grave ! 𝐐uel rôle va se faire éjecter du club des rôles ? 𝐀 toi de jouer !", components: [roleSelectRow], ephemeral: true });
    }
    if (interaction.customId === 'ROLECHANNEL_SELECT_REMOVE') {
        const selectedRoleId = interaction.values[0];
        const serverRoleMenus = await ServerRoleMenu.findOne({ serverID: interaction.guild.id });
    
        if (!serverRoleMenus || !serverRoleMenus.menus) {
            return interaction.reply({ content: "🚫丨Aucun menu de rôles trouvé.", ephemeral: true });
        }
    
        await ServerRoleMenu.updateOne(
            { serverID: interaction.guild.id, "menus.roles.roleId": selectedRoleId },
            { $pull: { "menus.$.roles": { roleId: selectedRoleId } } }
        );
    
        await ServerRoleMenu.updateOne(
            { serverID: interaction.guild.id },
            { $pull: { menus: { roles: { $size: 0 } } } }
        );
    
        const updatedServerRoleMenus = await ServerRoleMenu.findOne({ serverID: interaction.guild.id });
        if (!updatedServerRoleMenus || updatedServerRoleMenus.menus.length === 0) {
            await ServerRoleMenu.deleteOne({ serverID: interaction.guild.id });
        }
    
        await interaction.update({
            content: `丨𝐋e rôle et son nom ont été complètement supprimés de la base de données. 💾`,
            components: [],
            embeds: [],
            ephemeral: true
        });
    }
    if (interaction.customId === "Role_Menu") { 
      const roleId = interaction.values[0];
      const role = interaction.guild.roles.cache.get(roleId);
      const serverRoleMenus = await ServerRoleMenu.findOne({ serverID: interaction.guild.id });
  
      if (!serverRoleMenus || serverRoleMenus.menus.length === 0) {
          return interaction.reply({ content: "Aucun menu déroulant pour les rôles n'a été configuré sur ce serveur.", ephemeral: true });
      }
  
      if (!role) {
          return interaction.reply({ content: "𝐋e rôle sélectionné est introuvable.", ephemeral: true });
      }
  
      const member = interaction.member;
  
      try {
          if (member.roles.cache.has(roleId)) {
              await member.roles.remove(roleId);
              await interaction.reply({ content: `丨𝐓on rôle **\`${role.name}\`** a été **supprimé**.`, ephemeral: true });
          } else {
              await member.roles.add(roleId);
              await interaction.reply({ content: `丨𝐓u viens de **récupéré** le rôle **\`${role.name}\`**.`, ephemeral: true });
          }

          const menuOptions = serverRoleMenus.menus.flatMap(menu => {
            if (!menu.menuName || !Array.isArray(menu.roles) || menu.roles.length === 0) {
                console.warn(`Menu invalide trouvé : ${menu.menuName}`);
                return [];
            }
    
            return menu.roles.map(role => {
                const emojiMatch = role.displayName.match(/<:\w+:\d+>/);
                const emoji = emojiMatch ? {
                    name: emojiMatch[0].slice(2, -1).split(':')[0],
                    id: emojiMatch[0].slice(2, -1).split(':')[1]
                } : undefined;
    
                const label = emojiMatch ? role.displayName.replace(emojiMatch[0], '').trim() : role.displayName;
    
                return {
                    label: label,
                    value: role.roleId,
                    emoji: emoji || undefined,
                };
            });
        });
  
          const newMenu = new StringSelectMenuBuilder()
              .setCustomId('Role_Menu')
              .setPlaceholder('𝐂hoisis tes rôles.')
              .addOptions(menuOptions);
  
          const newRow = new ActionRowBuilder().addComponents(newMenu);
  
          await interaction.message.edit({ components: [newRow] });
  
      } catch (error) {
          console.error("[ROLE MENU] Erreur lors de la gestion du rôle :", error);
          await interaction.reply({ content: "Une erreur est survenue lors de la gestion du rôle. Veuillez contacter notre **grand** \`tbmpqf\`.", ephemeral: true });
      }
    }
    if (interaction.customId === "BINGO_PUSH") {
      const serverConfig = await ServerConfig.findOne({ serverID: interaction.guild.id });
      if (!serverConfig) {
        return interaction.reply({ content: "Configuration du serveur non trouvée.", ephemeral: true });
      }
    
      const bingoChannelName = serverConfig.bingoChannelName || "Salon non configuré";
    
      const result = await Bingo.findOneAndUpdate(
        { serverID: interaction.guild.id },
        {
          $set: {
            etat: 'ACTIF',
            serverName: interaction.guild.name,
            bingoChannelName: bingoChannelName
          },
          $setOnInsert: {
            nextBingoTime: null
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    
      if (!result.nextBingoTime) {
        const delayToNextBingo = intervalleAleatoire(2, 5); // 2 à 5 jours
        const nextBingoTime = new Date(Date.now() + delayToNextBingo);
        await Bingo.findOneAndUpdate(
          { serverID: interaction.guild.id },
          { $set: { nextBingoTime: nextBingoTime } }
        );
      }
    
      await interaction.reply({ content: "丨𝐋e \`𝐁ingo\` a été activé ! :comet:", ephemeral: true });
    }
    if (interaction.customId === "BINGO_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon pour le `𝐁ingo` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false;
  
      const interval = setInterval(() => {
          if (messageDeleted) {
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐘é pas trouvé ton salone (*accent espagnol*).", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  bingoChannelID: channelId,
                  bingoChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour le \`𝐁ingo\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, *Game of Thrones* aurait eu le temps de refaire sa dernière saison.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "TWITCH_BUTTON") { //OK
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon `𝐓witch` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
    
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false; 
  
      const interval = setInterval(() => {
          if (messageDeleted) { 
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) { 
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐘é pas trouvé ton salone (*accent espagnol*).", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  TwitchChannelID: channelId,
                  TwitchChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon \`𝐓witch\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) { 
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, j'ai lu une bibliothèque entière en t'attendant.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true; 
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "TWITCH_ROLE") { // A FINIR
      
    }
    if (interaction.customId === "TWITCH_LISTE") {
      const streamersList = await TwitchStreamers.find({ serverID: interaction.guild.id });
  
      let embedDescription;
      
      if (streamersList.length === 0) {
          embedDescription = "👻丨𝐀ucun streamer n'est actuellement enregistré.\n\n𝐍'aie pas peur, enregistre ton premier streamer en cliquant ci-dessous !";
      } else {
          embedDescription = streamersList.map((streamer, index) => 
              `**${index + 1}.** 𝐓witch: [${streamer.twitchUsername}](https://www.twitch.tv/${streamer.twitchUsername})\n𝐃iscord: <@${streamer.discordUserID}>`
          ).join("\n\n");
      }
  
      const embed = new EmbedBuilder()
          .setColor('#9146FF')
          .setTitle("🎥丨𝐋iste des Streamers enregistrés")
          .setDescription(embedDescription)
          .setFooter({ text: "Utilise les boutons ci-dessous pour ajouter ou supprimer un streamer." });
  
      const row = new ActionRowBuilder()
          .addComponents(
              new ButtonBuilder()
                  .setCustomId("TWITCH_ADD_STREAMER")
                  .setLabel("+1")
                  .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                  .setCustomId("TWITCH_REMOVE_STREAMER")
                  .setLabel("-1")
                  .setStyle(ButtonStyle.Danger)
          );
  
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
    if (interaction.customId === "TWITCH_ADD_STREAMER") {
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre avec le **`pseudo 𝐓witch et l'ID Discord`** du streamer *(séparés par un espace TABITEADURCY 123456789)*.";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
  
      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  clearInterval(interval);
                  console.error('Erreur lors de la mise à jour du message :', error);
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const [twitchUsername, discordUserID] = m.content.split(" ");
          if (!twitchUsername || !discordUserID) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐌auvaise syntaxe. Veuillez entrer un nom Twitch et un ID Discord.", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
  
          // Enregistre le streamer dans la base de données pour ce serveur
          await TwitchStreamers.create({
              twitchUsername,
              discordUserID,
              serverID: interaction.guild.id,  // Ajout de l'ID du serveur
              serverName: interaction.guild.name,  // Ajout du nom du serveur
          });
  
          const successMsg = await interaction.followUp({ content: `✅丨𝐋e streamer **${twitchUsername}** a été ajouté avec succès pour le serveur **${interaction.guild.name}** !`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time") {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code !== 10008) {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "TWITCH_REMOVE_STREAMER") {
      const streamersList = await TwitchStreamers.find({ serverID: interaction.guild.id });
  
      if (streamersList.length === 0) {
          return interaction.reply({ content: "❌丨𝐀ucun streamer enregistré sur ce serveur à supprimer.", ephemeral: true });
      }
  
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre avec le `nom 𝐓witch` du streamer que tu souhaites supprimer.";
  
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
  
      const interval = setInterval(() => {
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  clearInterval(interval);
                  console.error('Erreur lors de la mise à jour du message :', error);
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const twitchUsername = m.content.trim();
          // Recherche du streamer spécifiquement pour le serveur actuel
          const streamer = await TwitchStreamers.findOne({ 
              twitchUsername, 
              serverID: interaction.guild.id  // On filtre par serverID
          });
  
          if (!streamer) {
              const errorMsg = await interaction.followUp({ content: `😵丨𝐋e streamer **${twitchUsername}** n'existe pas dans la base de données pour ce serveur.`, ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
  
          await TwitchStreamers.deleteOne({ 
              twitchUsername,
              serverID: interaction.guild.id  // Assure que l'on supprime uniquement pour le serveur actuel
          });
  
          const successMsg = await interaction.followUp({ content: `✅丨𝐋e streamer **${twitchUsername}** a été supprimé avec succès !`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time") {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code !== 10008) {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
    if (interaction.customId === "ANNONCE_BUTTON") { 
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre l'**ID** du salon des `𝐀nnonces` désiré (clique droit dessus ◟**Copier l'identifiant du salon**).";
    
      const replyMessage = await interaction.reply({
          content: `${originalContent} ***${secondsRemaining}s***`,
          fetchReply: true
      });
  
      let followUpMessages = [];
      let messageDeleted = false;
  
      const interval = setInterval(() => {
          if (messageDeleted) {
              clearInterval(interval);
              return;
          }
  
          secondsRemaining--;
          if (secondsRemaining > 0) {
              replyMessage.edit(`${originalContent} ***${secondsRemaining}s***`).catch(error => {
                  if (error.code === 10008) {
                      messageDeleted = true;
                      clearInterval(interval);
                  } else {
                      console.error('Erreur lors de la mise à jour du message :', error);
                  }
              });
          } else {
              clearInterval(interval);
          }
      }, 1000);
  
      const collector = interaction.channel.createMessageCollector({
          filter: (m) => m.author.id === interaction.user.id,
          time: 60000,
          max: 1
      });
  
      collector.on("collect", async (m) => {
          clearInterval(interval);
          followUpMessages.push(m);
  
          const channelId = m.content.trim();
          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
              const errorMsg = await interaction.followUp({ content: "😵丨𝐒alon invalide. 𝐘é pas trouvé ton salone (*accent espagnol*).", ephemeral: true });
              followUpMessages.push(errorMsg);
              return;
          }
          await ServerConfig.findOneAndUpdate(
              { serverID: interaction.guild.id },
              {
                  AnnoucementChannelID: channelId,
                  AnnoucementChannelName: channel.name
              },
              { upsert: true, new: true }
          );
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e salon pour les \`𝐀nnonces\` a été mis à jour avec succès : **${channel.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time" && !messageDeleted) {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, même *Pythagore* a eu le temps de remettre en question son théorème.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  messageDeleted = true;
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code !== 10008) {
                          console.error('Erreur lors de la suppression du message de suivi :', error);
                      }
                  });
              });
          }, 1000);
      });
    }
  
    //Bouton suppresion de données dans la bdd pour la réinitialisé
    if (interaction.customId === "ANNONCE_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
  
      if (!serverConfig) {
          return interaction.reply({ content: "❌丨Configuration du serveur introuvable.", ephemeral: true });
      }
  
      serverConfig.AnnoucementChannelID = null;
      serverConfig.AnnoucementChannelName = null;
  
      try {
          await serverConfig.save();
          await interaction.reply({ content: "Le __salon__ pour les 𝐀nnonces a été réinitialisé avec succès !", ephemeral: true });
      } catch (error) {
          console.error('Erreur lors de la mise à jour de la configuration du serveur:', error);
          await interaction.reply({ content: "❌丨Erreur lors de la réinitialisation du salon Annonces.", ephemeral: true });
      }
    }
    if (interaction.customId === "TWITCH_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
  
      if (!serverConfig) {
          return interaction.reply({ content: "❌丨Configuration du serveur introuvable.", ephemeral: true });
      }
  
      serverConfig.TwitchRoleID = null;
      serverConfig.TwitchRoleName = null;
      serverConfig.TwitchChannelID = null;
      serverConfig.TwitchChannelName = null;
  
      try {
          await serverConfig.save();
          await interaction.reply({ content: "Le __salon__ et le __rôle__ pour 𝐓witch a été réinitialisé avec succès !", ephemeral: true });
      } catch (error) {
          console.error('Erreur lors de la mise à jour de la configuration du serveur:', error);
          await interaction.reply({ content: "❌丨Erreur lors de la réinitialisation du rôle et du salon Twitch.", ephemeral: true });
      }
    }
    if (interaction.customId === "LOG_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.logChannelID = null;
      serverConfig.logChannelName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ des 𝐋og a été réinitialisé avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
      }
    }
    if (interaction.customId === "ROLECHANNEL_DESAC") {
      const serverID = interaction.guild.id;
      
      try {
          const serverConfig = await ServerConfig.findOne({ serverID: serverID });
          if (serverConfig) {
              serverConfig.roleChannelID = null;
              serverConfig.roleChannelName = null;
              await serverConfig.save();
          }
  
          await ServerRoleMenu.deleteMany({ serverID: serverID });
          await interaction.reply('Le salon des 𝐑ôles a été réinitialisé avec succès et toutes les données de menus de rôles ont été supprimées.');
      } catch (error) {
          console.error('Error handling ROLECHANNEL_DESAC:', error);
          await interaction.followUp({ content: "Une erreur est survenue lors de la réinitialisation.", ephemeral: true });
      }
    }
    if (interaction.customId === "REGL_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.reglementChannelID = null;
      serverConfig.reglementChannelName = null;
      serverConfig.roleReglementID = null;
      serverConfig.roleReglementName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ ainsi que le __rôle__ du 𝐑èglement a été réinitialisé avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
      }
    }
    if (interaction.customId === "WELCOME_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.welcomeChannelID = null;
      serverConfig.welcomeChannelName = null;
      serverConfig.roleWelcomeID = null;
      serverConfig.roleWelcomeName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ ainsi que le __rôle__ de 𝐖elcome ont été réinitialisées avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
      }
    }
    if (interaction.customId === "IMPLICATION_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.implicationsChannelID = null;
      serverConfig.implicationsChannelName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ pour l\'𝐈mplications a été réinitialisé avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
      }
    }
    if (interaction.customId === "SUGG_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.suggestionsChannelID = null;
      serverConfig.suggestionsChannelName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ pour les 𝐒uggestions a été réinitialisé avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
      }
    }
    if (interaction.customId === "DAILY_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.dailyChannelID = null;
      serverConfig.dailyChannelName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ pour le 𝐃aily a été réinitialisé avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
      }
    }
    if (interaction.customId === "ROLES_DESAC") {

    }
    if (interaction.customId === "TICKET_DESAC") {
      const serverID = interaction.guild.id;
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.ticketChannelID = null;
      serverConfig.ticketChannelName = null;
      serverConfig.ticketAdminRoleID = null;
      serverConfig.ticketAdminRoleName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ et le __rôle admin__ pour les 𝐓icket a été réinitialisé avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
      }
    }
    if (interaction.customId === "BINGO_DESAC") {
      // Mettre à jour la configuration du bingo pour ce serveur
      Bingo.findOneAndUpdate({ serverID: interaction.guild.id }, { 
          etat: 'INACTIF', 
          nextBingoTime: null,
          bingoChannelName: null
      }, { new: true }).then(updatedBingoConfig => {
          if (updatedBingoConfig) {
              interaction.reply({content: '丨𝐋e \`𝐁ingo\` a été désactivé et le prochain temps de bingo enlevé.',  ephemeral: true });
          } else {
              interaction.reply('Configuration du bingo introuvable pour ce serveur.');
          }
      }).catch(error => {
          console.error('Erreur lors de la mise à jour du statut du bingo:', error);
          interaction.reply('Une erreur s\'est produite lors de la désactivation du bingo.');
      });
  
      // Mettre à jour la configuration du serveur pour enlever le salon du bingo
      ServerConfig.findOneAndUpdate({ serverID: interaction.guild.id }, { 
          bingoChannelID: null, 
          bingoChannelName: null 
      }, { new: true }).then(updatedServerConfig => {
      }).catch(error => {
          console.error('Erreur lors de la mise à jour de la configuration du serveur:', error);
      });
    }

    // Bouton Classement Général
    if (interaction.customId === "LADDER_BUTTON") {
      const guild = interaction.guild;
  
      const topUsers = await User.find({ serverID: guild.id })
          .sort({ prestige: -1, xp: -1 })
          .limit(5);
  
      if (topUsers.length === 0) {
          return interaction.reply({ content: ":hand_splayed:丨𝐇alt ! 𝐀ucun utilisateur n'a de l'expérience sur ce serveur.", ephemeral: true });
      }
  
      const leaderboardEmbed = new EmbedBuilder()
          .setColor("Gold")
          .setTitle(`📊丨𝐂lassement du serveur ${guild.name}`)
          .setDescription(
              topUsers.map((user, index) => {
                  let positionSuffix = "ᵉᵐᵉ";
                  let medalEmoji = "";
                  const prestigeStars = user.prestige > 0 ? " ⭐".repeat(user.prestige) : "";
  
                  switch (index) {
                      case 0:
                          positionSuffix = "ᵉʳ";
                          medalEmoji = "🥇";
                          break;
                      case 1:
                          medalEmoji = "🥈";
                          break;
                      case 2:
                          medalEmoji = "🥉";
                          break;
                  }
  
                  const username = bot.users.cache.get(user.userID)?.username || "Utilisateur Mystère";
  
                  return `**${medalEmoji} ${index + 1}${positionSuffix}** ◟ **${username}**\n🔹 **𝐍iveau** : \`${user.level}${prestigeStars}\`\n💠 **𝐗P** : \`${user.xp.toLocaleString()}\``;
              }).join("\n────────────────────────\n")
          )
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter({ text: `𝐂ordialement l'équipe ${guild.name}`, iconURL: guild.iconURL() })
          .setTimestamp();
  
      const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
              .setCustomId("SHOW_MORE_BUTTON")
              .setLabel("Voir plus")
              .setStyle(ButtonStyle.Primary)
      );
  
      const replyMessage = await interaction.reply({
          embeds: [leaderboardEmbed],
          components: [row],
          fetchReply: true
      });
  
      setTimeout(async () => {
          try {
              await replyMessage.delete();
          } catch (error) {
              if (error.code !== 10008) { // Ignorer l'erreur "Unknown Message" si le message est déjà supprimé
                  console.error("[LADDER] Erreur lors de la suppression du message : ", error);
              }
          }
      }, 15000);
    }
    if (interaction.customId === "SHOW_MORE_BUTTON") {
      const guild = interaction.guild;
      const totalUsers = await User.countDocuments({ serverID: guild.id });
    
      const topUsers = await User.find({ serverID: guild.id })
        .sort({ prestige: -1, xp: -1 })
        .skip(5)
        .limit(5);
    
      if (topUsers.length === 0) {
        return interaction.reply({ content: "丨𝐕ous êtes que 5 sur le serveur my bad. :joy:", ephemeral: true });
      }
    
      const leaderboardEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(`📊丨𝐂lassement du serveur ${guild.name}`)
        .setDescription(
          topUsers
            .map((user, index) => {
              const position = index + 6;
              const username = bot.users.cache.get(user.userID)?.username || "Utilisateur mystère";
              const prestigeStars = user.prestige > 0 ? " ⭐".repeat(user.prestige) : "";
    
              return `**${position}ᵉᵐᵉ** ◟ **${username}**\n🔹 **𝐍iveau** : \`${user.level}${prestigeStars}\`\n💠 **𝐗P** : \`${user.xp.toLocaleString()}\``;
            })
            .join("\n────────────────────────\n")
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: `𝐂ordialement l'équipe ${guild.name}`, iconURL: guild.iconURL() })
        .setTimestamp();
    
      await interaction.reply({
        embeds: [leaderboardEmbed],
        ephemeral: true,
      });
    }
    function padNumber(number) {
      return number < 10 ? `0${number}` : number;
    }
    
    // Bouton Vocal Time
    if (interaction.customId === "VOCAL_TIME_BUTTON") {
      const userId = interaction.user.id;
      const serverId = interaction.guild.id;

      User.findOne({ userID: userId, serverID: serverId }, (err, user) => {
        if (err) {
          console.error(err);
          interaction.reply({ content: "Une erreur est survenue lors de la récupération des données.", ephemeral: true });
          return;
        }

        if (!user) {
          interaction.reply({ content: "Impossible de trouver les données de l'utilisateur.", ephemeral: true });
          return;
        }

        const totalSeconds = user.voiceTime;
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = padNumber(Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60)));
        const minutes = padNumber(Math.floor((totalSeconds % (60 * 60)) / 60));
        const seconds = padNumber(Math.floor(totalSeconds % 60));

        let timeString = '';
        if (days > 0) timeString += `\`${days} jour${days > 1 ? 's' : ''}\`, `;
        if (hours > 0 || days > 0) timeString += `\`${hours} heure${hours > 1 ? 's' : ''}\`, `;
        if (minutes > 0 || hours > 0 || days > 0) timeString += `\`${minutes} minute${minutes > 1 ? 's' : ''}\` et `;
        timeString += `\`${seconds} seconde${seconds > 1 ? 's' : ''}\``;

        interaction.reply({ content: `Temps passé en vocal: ${timeString}.`, ephemeral: true });
      });
    }

    // Bouton Falconix
    if (interaction.customId === "FALCONIX_BUTTON") {
      const user = await User.findOne({
        userID: interaction.user.id,
        serverID: interaction.guild.id
      });
    
      if (!user) {
        return interaction.reply({ content: "Erreur : Utilisateur non trouvé dans la base de données.", ephemeral: true });
      }

      const formattedFalconix = parseFloat(user.falconix).toFixed(5);
    
      const FalconixEmbed = new EmbedBuilder()
        .setAuthor({
          name: "𝐏𝐎𝐑𝐓𝐄 𝐌𝐎𝐍𝐍𝐀𝐈𝐄",
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setThumbnail("https://i.postimg.cc/wjbvW906/Monnaie-Falconix.png")
        .addFields(
          { name: `\u200B`, value: `\u200B`, inline: true },
          { name: `**Tu as** \`${formattedFalconix}\` **Falconix.**`, value: `\u200B`, inline: true},
        )
        const message = await interaction.reply({ embeds: [FalconixEmbed], fetchReply: true });
        setTimeout(() => {
          message.delete().catch(console.error);
        }, 15000);
    }

    //Bouton lancer une recherche Apex Legends
    if (interaction.customId === "SEARCHMATE_APEX_BUTTON") {

      const existingMessage = await SearchMateMessage.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
      if (existingMessage) {
          return interaction.reply({ content: 'Doucement, attends tranquillement ! Prends toi un coca et respire.', ephemeral: true });
      }
  
      const apexRole = interaction.guild.roles.cache.find(role => role.name === "Apex Legends");
      const embed = new EmbedBuilder()
          .setTitle('𝐑𝐄𝐂𝐇𝐄𝐑𝐂𝐇𝐄 𝐃𝐄 𝐌𝐀𝐓𝐄 !')
          .setDescription(`${apexRole}\n\`${interaction.user.username}\` recherche son mate pour **Apex Legends** !`)
          .setColor('Red')
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
  
      const sentMessageResponse = await interaction.reply({embeds: [embed]});
      const sentMessage = sentMessageResponse instanceof require('discord.js').Message ? 
                          sentMessageResponse : 
                          await interaction.fetchReply();
  
      const sentMessageId = sentMessage.id;
      
      const newSearchMessage = new SearchMateMessage({
          userId: interaction.user.id,
          guildId: interaction.guild.id,
          channelId: interaction.channel.id,
          messageId: sentMessageId,
      });
      await newSearchMessage.save();
  
      let timeLeft = 30 * 60;
  
      const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
    
        if (minutes === 0) return '𝐐uelques secondes...';
    
        return `${minutes.toString().padStart(2, '0')} minute${minutes > 1 ? 's' : ''}`;
    };
  
      const timerId = setInterval(async () => {
          timeLeft -= 60;
  
          embed.setFooter({
              text: `Temps restant : ${formatTime(timeLeft)}`,
              iconURL: interaction.guild.iconURL(),
          });
          await sentMessage.edit({ embeds: [embed] });
  
          if (timeLeft <= 0) {
              clearInterval(timerId);
              try {
                  await sentMessage.delete();
                  await SearchMateMessage.deleteOne({ _id: newSearchMessage._id });
              } catch (error) {
                  console.error('[APEX SEARCH] Erreur lors de la suppression du message :', error);
              }
          }
      }, 60000);
    }

    //Bouton lancer une recherche Call of Duty
    if (interaction.customId === "SEARCHMATE_COD_BUTTON") {

      const existingMessage = await SearchMateMessage.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
      if (existingMessage) {
          return interaction.reply({ content: 'Doucement, attends tranquillement ! Prends toi un coca et respire.', ephemeral: true });
      }
  
      const codRole = interaction.guild.roles.cache.find(role => role.name === "Call of Duty");
      const embed = new EmbedBuilder()
          .setTitle('𝐑𝐄𝐂𝐇𝐄𝐑𝐂𝐇𝐄 𝐃𝐄 𝐌𝐀𝐓𝐄 !')
          .setDescription(`${codRole}\n\`${interaction.user.username}\` recherche son mate pour **Call of Duty** !`)
          .setColor('Red')
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
  
      const sentMessageResponse = await interaction.reply({embeds: [embed]});
      const sentMessage = sentMessageResponse instanceof require('discord.js').Message ? 
                          sentMessageResponse : 
                          await interaction.fetchReply();
  
      const sentMessageId = sentMessage.id;
      
      const newSearchMessage = new SearchMateMessage({
          userId: interaction.user.id,
          guildId: interaction.guild.id,
          channelId: interaction.channel.id,
          messageId: sentMessageId,
      });
      await newSearchMessage.save();
  
      let timeLeft = 30 * 60;
  
      const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
    
        if (minutes === 0) return '𝐐uelques secondes...';
    
        return `${minutes.toString().padStart(2, '0')} minute${minutes > 1 ? 's' : ''}`;
    };
  
      const timerId = setInterval(async () => {
          timeLeft -= 60;
  
          embed.setFooter({
              text: `Temps restant : ${formatTime(timeLeft)}`,
              iconURL: interaction.guild.iconURL(),
          });
          await sentMessage.edit({ embeds: [embed] });
  
          if (timeLeft <= 0) {
              clearInterval(timerId);
              try {
                  await sentMessage.delete();
                  await SearchMateMessage.deleteOne({ _id: newSearchMessage._id });
              } catch (error) {
                  console.error('[COD SEARCH] Erreur lors de la suppression du message :', error);
              }
          }
      }, 60000);
    }

    //Bouton pour crée un vocal pour Apex Legends
    if (interaction.customId === "OPENVOC_APEX_BUTTON") {
      const parentChannel = interaction.channel;
    
      const existingChannel = await VocalChannel.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });

      if (existingChannel) {
        return await interaction.reply({
          content: "Toi.. t'es un sacré coquin ! Tu as déjà un salon d'ouvert non ?",
          ephemeral: true,
        });
      }
    
      const apexRole = interaction.guild.roles.cache.find(role => role.name === "Apex Legends");
    
      let permissionOverwrites = [
          {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Connect],
          },
          {
              id: apexRole.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Connect],
          }
      ];
    
      try {
          let channel = await interaction.guild.channels.create({
              name: `丨${interaction.user.username}ᴷᴼᴿᴾ`,
              parent: parentChannel.parentId,
              type: ChannelType.GuildVoice,
              userLimit: 3,
              permissionOverwrites: permissionOverwrites,
          });
    
          const newVocalChannel = new VocalChannel({
              userId: interaction.user.id,
              guildId: interaction.guild.id,
              channelId: channel.id
          });
          await newVocalChannel.save();
    
          await interaction.reply({ content: 'Ton salon vocal **Apex Legends** a été créé avec succès !', ephemeral: true });
      } catch (error) {
          console.error('[APEX VOCAL] Erreur lors de la création du canal pour Apex Legends:', error);
          await interaction.reply({ content: '**Erreur lors de la création du canal. __Merci__ de patienter...**', ephemeral: true });
      }
    }
    //Bouton pour crée un vocal pour Call of Duty
    if (interaction.customId === "OPENVOC_COD_BUTTON") {
      const parentChannel = interaction.channel;
      const existingChannel = await VocalChannel.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });

      if (existingChannel) {
        return await interaction.reply({
          content: "Toi.. t'es un sacré coquin ! Tu as déjà un salon d'ouvert non ?",
          ephemeral: true,
        });
      }
    
      const codRole = interaction.guild.roles.cache.find(role => role.name === "Call of Duty");
      let permissionOverwrites = [
          {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Connect],
          },
          {
              id: codRole.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Connect],
          }
      ];
    
      try {
          let channel = await interaction.guild.channels.create({
              name: `丨${interaction.user.username}ᴷᴼᴿᴾ`,
              parent: parentChannel.parentId,
              type: ChannelType.GuildVoice,
              userLimit: 6,
              permissionOverwrites: permissionOverwrites,
          });
    
          const newVocalChannel = new VocalChannel({
              userId: interaction.user.id,
              guildId: interaction.guild.id,
              channelId: channel.id
          });
          await newVocalChannel.save();
    
          await interaction.reply({ content: 'Ton salon vocal **Call of Duty** a été créé avec succès !', ephemeral: true });
      } catch (error) {
          console.error('[COD VOCAL] Erreur lors de la création du canal pour Call of Duty:', error);
          await interaction.reply({ content: '**Erreur lors de la création du canal. __Merci__ de patienter...**', ephemeral: true });
      }
    }

    // Bouton statistique d'Apex Legends
    if (interaction.customId === 'STATS_APEX_BUTTON') {
      try {
          const discordId = interaction.user.id;
          let user = await ApexStats.findOne({ discordId: discordId });
  
          if (!user) {
              await interaction.reply({ content: "Veuillez fournir votre plateforme et identifiant de jeu...", ephemeral: true });
              const filter = m => m.author.id === discordId;
              const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });
  
              collector.on('collect', async (message) => {
                  const [platform, gameUsername] = message.content.split(',').map(item => item.trim());
                  if (!platform || !gameUsername) {
                      return interaction.followUp({ content: 'Les données fournies sont incorrectes. Assurez-vous de fournir la plateforme et l’identifiant de jeu.', ephemeral: true });
                  }
  
                  const server = message.guild.name;
                  user = new ApexStats({ discordId, username: interaction.user.username, server, platform, gameUsername });
                  await user.save();
  
                  interaction.followUp({ content: `Vos informations ont été enregistrées ! Plateforme: ${platform}, Identifiant de jeu: ${gameUsername}` });
              });
  
              collector.on('end', (collected) => {
                  if (collected.size === 0) {
                      interaction.followUp({ content: 'Ehhh le temps est écoulé. Clique à nouveau sur le bouton pour réessayer.', ephemeral: true });
                  }
              });
          } else {
              const APEX_API_KEY = config.apex_api;
              const API_URL = `https://api.mozambiquehe.re/bridge?auth=${APEX_API_KEY}&player=${user.gameUsername}&platform=${user.platform}`;
              const response = await axios.get(API_URL);
              const stats = response.data;
  
              const playerName = stats.global.name;
              const level = stats.global.level;
              const selected_legend = stats.legends.selected.LegendName;
              const rank_name = stats.global.rank.rankName;
              const rank_div = stats.global.rank.rankDiv;
              const rank_score = stats.global.rank.rankScore;
              const legend_banner = stats.legends.selected.ImgAssets.banner;
              const rankThumbnail = getRankThumbnail(rank_name);
              const prestigeLevel = stats.global.levelPrestige;
              let levelWithStars = `${level}`;
  
              if (prestigeLevel > 0) {
                  const stars = '⭐'.repeat(prestigeLevel);
                  levelWithStars = `${level} ${stars}`;
              }
  
              let selectedLegendName = stats.legends.selected.LegendName;
  
              if (stats.legends.all[selectedLegendName]) {
                  const trackers = stats.legends.all[selectedLegendName].data;
  
                  if (trackers && trackers.length > 0) {
                      let trackerInfo = "";
                      for (let i = 0; i < trackers.length && i < 3; i++) {
                          let tracker = trackers[i];
                          if (tracker && tracker.name && tracker.value) {
                              let formattedValue = formatNumberWithSpaces(tracker.value);
                              let stylizedName = stylizeFirstLetter(tracker.name);
                              trackerInfo += `**${stylizedName}** : \`${formattedValue}\`\n`;
                          }
                      }
  
                      const Stats_Apex_Embed = new EmbedBuilder()
                          .setTitle(`◟**${playerName}**`)
                          .setDescription(`\n\n**𝐍iveaux** : \`${levelWithStars}\`\n**𝐏ersonnage** : **\`${selected_legend}\`**\n\n${trackerInfo}\n**𝐑ang** : \`${rank_name} ${rank_div}\`\n**𝐒core** : \`${rank_score} / 1000 LP\``)
                          .setImage(legend_banner)
                          .setThumbnail(rankThumbnail)
                          .setColor('Red')
                          .setFooter({
                              text: `Enregistre tes stats sur apexlegendsstatus.com`,
                              iconURL: `https://1000logos.net/wp-content/uploads/2021/06/logo-Apex-Legends.png`,
                          });
                      await interaction.reply({ embeds: [Stats_Apex_Embed], ephemeral: true });
                  } else {
                      await interaction.reply({ content: "**Nous n'avons pas pu trouver les trackers pour ta légende. Rajoute des trackers ou choisis une autre légende.**", ephemeral: true });
                  }
              } else {
                  await interaction.reply({ content: "**La légende sélectionnée n'est pas présente dans les données. Rajoute des trackers ou choisis une autre légende.**", ephemeral: true });
              }
          }
      } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          await interaction.reply({ content: "**Pour l'instant, je rencontre des erreurs lors de la récupération de vos informations. Réessaye plus tard... Ou demain.**", ephemeral: true });
      }
    }
    function formatNumberWithSpaces(num) {
      return num.toLocaleString('fr-FR');
    }
    function stylizeFirstLetter(text) {
      const alphabet = {
          'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 
          'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 
          'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 
          'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙'
      };
  
      const firstLetter = text.charAt(0).toUpperCase();
      if (alphabet[firstLetter]) {
          return text.replace(firstLetter, alphabet[firstLetter]);
      }
      return text;
    }
    function getRankThumbnail(rankName) {
      switch (rankName.toLowerCase()) {
          case 'rookie':
              return 'https://i0.wp.com/www.alphr.com/wp-content/uploads/2022/02/BR_Unranked.png?resize=425%2C425&ssl=1';
          case 'bronze':
              return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_bronze_rs15.png';
          case 'silver':
              return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_silver_rs7.png';
          case 'gold':
              return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_gold_rs7.png';
          case 'platinium':
              return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_platinum_rs7.png';
          case 'diamond':
              return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_diamond_rs7.png';
          case 'master':
              return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_master_rs7.png';
          case 'predator':
              return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_apex_predator_rs7.png';
      }
    }
    // Bouton statistique Call of Duty
    if (interaction.customId === 'STATS_COD_BUTTON') {
      await interaction.reply({ content: "Ceci n'est malheuresement pas encore disponible.", ephemeral: true });
    }

    if (interaction.channel === null) return;
    if (!interaction.isCommand()) return;
    if (!bot.commands.has(interaction.commandName)) return;

    let timeoutFlag = false;
    let timeout = setTimeout(function () {
      timeoutFlag = true;
      interaction.reply({
        content:
          "**L'exécution de la commande prend plus de temps que prévu. __Merci__ de patienter...**",
        ephemeral: true,
      });
    }, 5000);

    try {
      await bot.commands.get(interaction.commandName).execute(interaction, bot);
      clearTimeout(timeout);
    } catch (error) {
      console.error(error);
      if (typeof interaction.reply === "function") {
        interaction.reply({
          content:
            "**Une erreur est survenue lors de l'exécution de la commande -> contact mon créateur `tbmpqf`.**",
          ephemeral: true,
        });
      } else {
        interaction.channel.send({
          content:
            "**Une erreur est survenue lors de l'exécution de la commande -> contact mon créateur `tbmpqf`.**",
        });
      }
    }
    if (timeoutFlag) {
      // En cas de dépassement du temps, vous pouvez ajouter une action supplémentaire ici
      console.error(
        `Command ${interaction.commandName} trop longue a executé.`
      );
      // Si vous avez un système de surveillance externe, vous pouvez envoyer une notification à ce système.
      interaction.followUp({
        content:
          "**La commande a pris trop de temps à répondre et a été annulée. Veuillez réessayer plus tard.**",
        ephemeral: true,
      });
    }
  }
  },
};

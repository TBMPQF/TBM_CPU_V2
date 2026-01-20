const {
  ActionRowBuilder,
  AttachmentBuilder,
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
const ApexStats = require('../models/apexStats')
const ServerRoleMenu = require('../models/serverRoleMenu')
const Warning = require('../models/warns')
const { unmuteRequests } = require('../models/shared');
const { intervalleAleatoire } = require('../bingoFunctions');
const Suggestion = require('../models/suggestion');
const TwitchStreamers = require("../models/TwitchStreamers")
const messagesRandom = require('../models/messageRandom');
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { updateConfigEmbed } = require("../utils/updateconfigEmbed");

const ETAT_DB = {
  ACTIF: '𝐀𝐂𝐓𝐈𝐅',
  INACTIF: '𝐈𝐍𝐀𝐂𝐓𝐈𝐅',
};

mongoose.connect(config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = {
  name: "interactionCreate",
  async execute(interaction, bot) {

    async function getLogChannel(interaction) {
      const conf = await ServerConfig.findOne({ serverID: interaction.guild.id });
      if (!conf?.logChannelID) return null;
      return interaction.client.channels.cache.get(conf.logChannelID)
          || await interaction.client.channels.fetch(conf.logChannelID).catch(() => null);
    }

    // Fonction pour le bingo
    const VISUAL_STATUS = {
      ACTIF: '𝐀𝐂𝐓𝐈𝐅',
      INACTIF: '𝐈𝐍𝐀𝐂𝐓𝐈𝐅',
    };
    function replaceLine(desc, label, lineValue) {
      const lines = (desc || "").split("\n");
      const idx = lines.findIndex(l => l.trim().toLowerCase().startsWith(label.toLowerCase() + " :"));
      const newLine = `${label} : ${lineValue}`;
      if (idx >= 0) {
        lines[idx] = newLine;
      } else {
        lines.push(newLine);
      }
      return lines.join("\n");
    }
    async function resolveBingoChannel(interaction) {
      const cfg = await ServerConfig.findOne({ serverID: interaction.guild.id });
      const byId = cfg?.bingoChannelID;
      const byName = (await Bingo.findOne({ serverID: interaction.guild.id }))?.bingoChannelName;

      let channel = null;
      // 1) guild cache
      if (byId) channel = interaction.guild.channels.cache.get(byId) || null;
      // 2) guild fetch
      if (!channel && byId) channel = await interaction.guild.channels.fetch(byId).catch(() => null);
      // 3) client fetch (au cas où)
      if (!channel && byId) channel = await interaction.client.channels.fetch(byId).catch(() => null);
      // 4) fallback par nom
      if (!channel && byName) {
        channel = interaction.guild.channels.cache.find(c => c.name === byName) || null;
        if (!channel) {
          const all = await interaction.guild.channels.fetch().catch(() => null);
          if (all) channel = [...all.values()].find(c => c.name === byName) || null;
        }
        // si on l'a trouvé par nom, réécrire l'ID en BDD
        if (channel) {
          await ServerConfig.updateOne(
            { serverID: interaction.guild.id },
            { $set: { bingoChannelID: channel.id, bingoChannelName: channel.name } },
            { upsert: true }
          );
          await Bingo.updateOne(
            { serverID: interaction.guild.id },
            { $set: { bingoChannelName: channel.name, serverName: interaction.guild.name } },
            { upsert: true }
          );
        }
      }

      return channel; // peut être null
    }
    function removeLineByLabel(desc, label) {
      return (desc || "").split("\n")
        .filter(l => !l.trim().toLowerCase().startsWith(label.toLowerCase() + " :"))
        .join("\n");
    }
    function setStatusLine(desc, statusText) {
      const lines = (desc || "").split("\n");
      const filtered = lines.filter(l => !/^\s*(ACTIF|INACTIF|𝐀𝐂𝐓𝐈𝐅|𝐈𝐍𝐀𝐂𝐓𝐈𝐅)\s*$/u.test(l));

      while (filtered.length && filtered[filtered.length - 1].trim() === "") filtered.pop();

      filtered.push("");
      filtered.push(statusText);

      return filtered.join("\n");
    }
    function applyNextBingoFooterNoTs(embed, bingoDoc, guild) {
      const ETAT_DB_LOCAL = (typeof ETAT_DB !== "undefined")
        ? ETAT_DB
        : { ACTIF: '𝐀𝐂𝐓𝐈𝐅', INACTIF: '𝐈𝐍𝐀𝐂𝐓𝐈𝐅' };

      const actif = ((bingoDoc?.etat || '').trim() === ETAT_DB_LOCAL.ACTIF);

      if (actif && bingoDoc?.nextBingoTime) {
        const d = new Date(bingoDoc.nextBingoTime);
        const when = new Intl.DateTimeFormat('fr-FR', {
          weekday: 'short', day: '2-digit', month: 'long',
          hour: '2-digit', minute: '2-digit',
          timeZone: 'Europe/Paris',
        }).format(d);

        return embed
          .setFooter({
            text: `◟𝐏rochain bingo : ${when}`,
          })
      }

      return embed
    }

    // Gestion des suggestions
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
    }
    // Gestion rôles des niveaux
    const LEVELS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const ensurePrestigeMap = async (server, key) => {
      if (!server[key] || typeof server[key].get !== "function") {
        server[key] = new Map();
        server.markModified(key);
        await server.save();
      }
      return server[key];
    };
    const normalizeValue = (val) => {
      // Retourne { id, name } depuis divers formats (string, [id], [id,name])
      if (!val) return { id: undefined, name: undefined };
      if (Array.isArray(val)) {
        const id = val[0];
        const name = val[1];
        return { id, name };
      }
      if (typeof val === "string") return { id: val, name: undefined };
      return { id: undefined, name: undefined };
    };
    const getRoleInfo = (guild, prestigeRoles, lvl) => {
      const stored = normalizeValue(prestigeRoles.get(String(lvl)));
      const role = stored.id ? guild.roles.cache.get(stored.id) : null;
      return { id: stored.id, storedName: stored.name, role };
    };

    if (
    interaction.isStringSelectMenu() &&
    interaction.customId.startsWith("ROLE_MODIFY_SELECT_")
  ) {
    const selectedPrestige = interaction.customId.slice("ROLE_MODIFY_SELECT_".length);
    const selectedValue = interaction.values[0];
    const levelMatch = /^LEVEL_(\d+)$/.exec(selectedValue);
    const isBulk = selectedValue === "ADD_BULK";

    const server = await ServerRole.findOne({ serverID: interaction.guild.id });
    if (!server) {
      return interaction.reply({ content: "❌丨Serveur introuvable.", ephemeral: true });
    }

    const prestigeRoles = await ensurePrestigeMap(server, selectedPrestige);
    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

    const sendUpdatedEmbed = async () => {
      const roleListText = LEVELS.map((level) => {
        const { role, storedName } = getRoleInfo(interaction.guild, prestigeRoles, level);
        return `𝐍iveau **${level}** ◟ ${role ? role.toString() : (storedName ? `*${storedName}*` : "*Aucun rôle défini.*")}`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🧩丨Rôles mis à jour")
        .setDescription(roleListText)
        .setColor("#88c9f9");

      const modifyButton = new ButtonBuilder()
        .setCustomId(`MODIFY_${selectedPrestige}`)
        .setLabel("Modifier les rôles")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🖌️");

      const rowButton = new ActionRowBuilder().addComponents(modifyButton);

      await interaction.followUp({ embeds: [embed], components: [rowButton], ephemeral: true });
    };

    if (isBulk) {
      await interaction.deferUpdate();
      const promptMsg = await interaction.channel.send(
        `📝丨Mentionne maintenant **jusqu'à 12 rôles** à assigner aux niveaux suivants :\n\`${LEVELS.join(", ")}\`\nFormat : @Rôle1 @Rôle2...`
      );

      const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        max: 1,
        time: 60_000,
      });

      collector.on("collect", async (msg) => {
        const roles = msg.mentions.roles;

        if (roles.size === 0 || roles.size > 12) {
          await interaction.followUp({ content: "❌丨Mentionne entre 1 et 12 rôles maximum.", ephemeral: true });
          return;
        }

        const invalid = roles.some((role) => role.position >= botMember.roles.highest.position);
        if (invalid) {
          await interaction.followUp({ content: "🚫丨Certains rôles sont au-dessus de mes permissions.", ephemeral: true });
          return;
        }

        const roleArray = Array.from(roles.values()).slice(0, 12);
        roleArray.forEach((role, i) => {
          const lvl = LEVELS[i];
          if (lvl) prestigeRoles.set(String(lvl), [role.id, role.name]);
        });

        server.markModified(selectedPrestige);
        await server.save();

        await sendUpdatedEmbed();
        await interaction.followUp({ content: "✅丨Rôles mis à jour avec succès !", ephemeral: true });

        msg.delete().catch(() => {});
        promptMsg.delete().catch(() => {});
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time") {
          await interaction.followUp({ content: "⏳丨Temps écoulé. Recommence l’action.", ephemeral: true });
          promptMsg.delete().catch(() => {});
        }
      });

      return;
    }

    if (levelMatch) {
      const level = levelMatch[1];

      await interaction.deferUpdate();
      const promptMsg = await interaction.channel.send(
        `📝丨Mentionne maintenant le rôle à assigner pour le niveau **${level}**.`
      );

      const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        max: 1,
        time: 60_000,
      });

      collector.on("collect", async (msg) => {
        const role = msg.mentions.roles.first();
        if (!role) {
          await interaction.followUp({ content: "❌丨Tu dois mentionner un rôle valide.", ephemeral: true });
          return;
        }

        if (role.position >= botMember.roles.highest.position) {
          await interaction.followUp({ content: "🚫丨Ce rôle est au-dessus de mes permissions.", ephemeral: true });
          return;
        }

        prestigeRoles.set(String(level), [role.id, role.name]);
        server.markModified(selectedPrestige);
        await server.save();

        await sendUpdatedEmbed();
        await interaction.followUp({ content: `✅丨Le rôle du niveau **${level}** a été mis à jour !`, ephemeral: true });

        msg.delete().catch(() => {});
        promptMsg.delete().catch(() => {});
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time") {
          await interaction.followUp({ content: "⏳丨Temps écoulé. Recommence.", ephemeral: true });
          promptMsg.delete().catch(() => {});
        }
      });
    }
  }
    if (interaction.isButton() && interaction.customId.startsWith("MODIFY_")) {
      const selectedPrestige = interaction.customId.slice("MODIFY_".length);

      let server = await ServerRole.findOne({ serverID: interaction.guild.id });
      if (!server) {
        server = new ServerRole({ serverID: interaction.guild.id, serverName: interaction.guild.name });
        await server.save();
      }

      await ensurePrestigeMap(server, selectedPrestige);
      const prestigeRoles = server[selectedPrestige]; 

      if (typeof prestigeRoles?.forEach === "function") {
        let touched = false;
        prestigeRoles.forEach((val, key) => {
          const { id, name } = normalizeValue(val);
          if (id && (!name || name === "")) {
            const r = interaction.guild.roles.cache.get(id);
            prestigeRoles.set(String(key), [id, r?.name ?? ""]);
            touched = true;
          }
        });
        if (touched) {
          server.markModified(selectedPrestige);
          await server.save();
        }
      }

      const roleOptions = LEVELS.map((level) => {
        const { role, storedName } = getRoleInfo(interaction.guild, prestigeRoles, level);
        return {
          label: `◟𝐍iveau ${level}`,
          value: `LEVEL_${level}`,
          description: role ? `𝐀ctuel : ${role.name}` : (storedName ? `𝐀ctuel : ${storedName}` : "Aucun rôle défini."),
        };
      })

      const modifySelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`ROLE_MODIFY_SELECT_${selectedPrestige}`)
        .setPlaceholder("Sélectionne un niveau à modifier")
        .addOptions(roleOptions);

      const rowSelect = new ActionRowBuilder().addComponents(modifySelectMenu);

      const badgeMap = { 1: "🥉", 2: "🥈", 3: "🥇", 4: "🏅", 5: "🎖️", 6: "🔰", 7: "💎", 8: "👑", 9: "⚜️", 10: "💠" };
      const prestigeOptions = Array.from({ length: 11 }, (_, i) => ({
        label: i === 0 ? "🎓丨Niveau Standard" : `${badgeMap[i] || "🏆"}丨Prestige ${i}`,
        value: `prestige${i}Roles`,
        description: i === 0 ? "Configurer les rôles standard" : `Configurer les rôles pour le Prestige ${i}`,
      }));

      const selectPrestige = new StringSelectMenuBuilder()
        .setCustomId("SELECT_PRESTIGE_ROLE")
        .setPlaceholder("丨𝐒électionne un prestige à consulter ou modifier")
        .addOptions(prestigeOptions);

      const rowPrestige = new ActionRowBuilder().addComponents(selectPrestige);

      await interaction.update({
        components: [rowPrestige, rowSelect],
      });
    }

      else {
      
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
      let lostBefore = 0; // on mémorise l'ancienne série si on la perd

      if (lastClaim && now.getTime() - lastClaim.getTime() < msIn47Hours) {
        // Fenêtre de 47h toujours valable → on vérifie le cooldown 23h
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
            timeRemainingMessage += `\`${hoursRemaining} heure${hoursRemaining > 1 ? "s" : ""}\`, `;
            timeRemainingMessage += `\`${minutesRemaining.toString().padStart(2, "0")} minute${minutesRemaining > 1 ? "s" : ""}\` et `;
          } else if (minutesRemaining > 0) {
            timeRemainingMessage += `\`${minutesRemaining.toString().padStart(2, "0")} minute${minutesRemaining > 1 ? "s" : ""}\` et `;
          }
          timeRemainingMessage += `\`${secondsRemaining.toString().padStart(2, "0")} seconde${secondsRemaining > 1 ? "s" : ""}\``;

          return interaction.reply({
            content: `丨𝐓u dois attendre encore **${timeRemainingMessage}** avant de pouvoir récupérer ton \`𝐃aily\` !`,
            ephemeral: true,
          });
        }

        // Ok pour claim dans la même “fenêtre”
        user.consecutiveDaily += 1;
      } else {
        // Série perdue (hors fenêtre 47h)
        lostBefore = user.consecutiveDaily || 0;           // ancienne série
        user.lostConsecutiveDaily = lostBefore;
        resetConsecutiveDaily = true;
        user.consecutiveDaily = 1;                         // on repart à 1
      }

      // Maj record si besoin
      if (user.consecutiveDaily > user.maxDaily) {
        user.maxDaily = user.consecutiveDaily;
      }

      // Message spécial toutes les 50 flammes (inchangé)
      const SPECIAL_DAILY_STREAK = 50;
      const selectedMessage = messagesRandom.DailyStreak[
        Math.floor(Math.random() * messagesRandom.DailyStreak.length)
      ]
        .replace("<USER_NAME>", interaction.user.username)
        .replace("<STREAK>", user.consecutiveDaily);

      if (user.consecutiveDaily % SPECIAL_DAILY_STREAK === 0) {
        const specialChannel = interaction.guild.channels.cache.get("717144491525406791");
        if (specialChannel) {
          specialChannel
            .send(selectedMessage)
            .then((message) => {
              const reactions = ["🇱", "🇴", "🇸", "🇪", "🇷"];
              reactions.forEach((reaction) => message.react(reaction));
            })
            .catch(console.error);
        }
      }

      // Calcul du gain XP + malus
      const baseXP = 200;
      const weeksConsecutive = Math.floor(user.consecutiveDaily / daysInWeek);
      const bonusXP = baseXP * 0.02 * weeksConsecutive;
      let totalXP = baseXP + bonusXP;

      if (user.malusDuration > 0) {
        if (user.malusDaily > totalXP) user.malusDaily = totalXP;
        totalXP -= user.malusDaily;
        user.malusDuration -= 1;
        if (user.malusDuration === 0) user.malusDaily = 0;
      }

      user.xp += totalXP;
      const currentCareer = Number.isFinite(user.careerXP)
        ? Number(user.careerXP)
        : computeCareerFromUser(user);

      user.careerXP = currentCareer + totalXP;
      user.lastDaily = now;
      await user.save();

      // Level up/down avec l'XP fraîche
      levelUp(interaction, user, user.xp).catch(() => {});

      // ====== Embed + texte ======
      let messageText = "";
      let footerText = "";

      if (lastClaim == null) {
        messageText = `✨丨𝐁onus quotidien activé ! Tu gagnes \`+${totalXP} 𝐗P\` 🎉`;
      } else if (resetConsecutiveDaily && lostBefore >= 2) {
        // On ne parle de perte que si l'ancienne série >= 2
        messageText =
          `🎁丨𝐁onus récupéré ! Tu gagnes \`+${totalXP} 𝐗P\` 🧩\n` +
          `𝐌ais tu as __perdu__ ta série de flammes.. 🧯`;
        footerText = `🔥 𝐀ncienne série : ${lostBefore} jour${lostBefore > 1 ? "s" : ""}`;
      } else if (user.consecutiveDaily === 1 && !resetConsecutiveDaily) {
        messageText = `🎉丨𝐁onus quotidien du jour : \`+${totalXP} 𝐗P\` 🧩`;
      } else {
        messageText =
          `丨𝐁onus récupéré ! 𝐓u gagnes \`+${totalXP} 𝐗P\` 🧩\n` +
          `𝐒érie actuelle : \`${user.consecutiveDaily}\` jour${user.consecutiveDaily > 1 ? "s" : ""} 🔥`;
        footerText = `🏆 𝐑ecord : ${user.maxDaily} jour${user.maxDaily > 1 ? "s" : ""}`;
      }

      const dailyEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(messageText)
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      if (footerText) dailyEmbed.setFooter({ text: footerText });

      // Bouton de rattrapage → seulement si vraie perte (ancienne série ≥ 2)
      const components = [];
      if (resetConsecutiveDaily && lastClaim != null && lostBefore >= 2) {
        const recoverRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("RECUPDAILY_BUTTON")
            .setEmoji("💨")
            .setLabel("丨𝐑attraper mon 𝐃aily")
            .setStyle(ButtonStyle.Primary)
        );
        components.push(recoverRow);
      }

      await interaction.reply({
        embeds: [dailyEmbed],
        components,
        ephemeral: true,
      });

      // 📋 LOG DAILY (fix: on log seulement si on a bien un channel)
      const serverInfo = await ServerConfig.findOne({ serverID: interaction.guild.id });
      if (serverInfo && serverInfo.logChannelID) {
        const XPLOG = new EmbedBuilder()
          .setColor("Orange")
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTitle("丨𝐕ient de récupérer son bonus quotidien. 💸")
          .setTimestamp();

        if (resetConsecutiveDaily && lastClaim && lostBefore >= 2) {
          XPLOG.setFooter({
            text: `⚠️ 𝐏𝐄𝐑𝐓𝐄 𝐃𝐄 𝐒𝐄𝐑𝐈𝐄 ◟ 𝐀ncienne série : ${lostBefore} jour${lostBefore > 1 ? "s" : ""}`,
          });
        } else {
          XPLOG.setFooter({
            text: `🔥 𝐒érie actuelle : ${user.consecutiveDaily} jour${user.consecutiveDaily > 1 ? "s" : ""}`,
          });
        }

        const logChannel = bot.channels.cache.get(serverInfo.logChannelID);
        if (logChannel) logChannel.send({ embeds: [XPLOG] }).catch(() => {});
      }
    }

    const FALCON_BG_URL = "https://i.postimg.cc/Zn88HV3f/Falcon23.png";
    const FALCONIX_EMOJI_URL = "https://cdn.discordapp.com/emojis/1186719745106513971.png?size=64&quality=lossless";
    const FLAME_PNG = "https://twemoji.maxcdn.com/v/latest/72x72/1f525.png";

    const XP_BLOCK = Math.pow(51 / 0.1, 2);
    const pf = (p) => 1 + 0.15 * Math.max(0, p || 0);
    const levelFrom = (xp, p) =>
      Math.min(50, Math.floor(0.1 * Math.sqrt(Math.max(0, xp) / pf(p))));

    function rebuildFromCareer(careerXP) {
      let rem = Math.max(0, Number(careerXP) || 0);
      let p = 0;
      while (rem >= pf(p) * XP_BLOCK) { rem -= pf(p) * XP_BLOCK; p++; }
      const level = levelFrom(rem, p);
      return { prestige: p, level, xp: Math.round(rem) };
    }
    function computeCareerFromUser(user) {
      const p = Math.max(0, Number(user.prestige) || 0);
      let career = Math.max(0, Number(user.xp) || 0);
      for (let i = 0; i < p; i++) career += pf(i) * XP_BLOCK;
      return Math.round(career);
    }
    const BASE_COST_PER_DAY = 400;
    function softDaysEquivalent(streak) {
      const n = Math.max(0, Number(streak) || 0);
      const first = Math.min(n, 30);
      const rest  = Math.max(0, n - 30);
      return first + Math.sqrt(rest) * 5;
    }
    function costMultiplier(prestige = 0, level = 0) {
      const p = Math.max(0, Number(prestige) || 0);
      const L = Math.max(0, Number(level) || 0);
      const pfactor = 1 + 0.15 * p;
      const lfactor = 1 + Math.min(L, 50) / 50;
      return pfactor * lfactor;
    }
    function xpToNextPrestige(prestige = 0) {
      const pfac = 1 + 0.15 * Math.max(0, Number(prestige) || 0);
      const XP_BLOCK = Math.pow(51 / 0.1, 2);
      return XP_BLOCK * pfac;
    }
    function costFromStreakMiss(streak, prestige = 0, level = 0) {
      const base = BASE_COST_PER_DAY * softDaysEquivalent(streak) * costMultiplier(prestige, level);
      const cap  = 0.35 * xpToNextPrestige(prestige);
      return Math.round(Math.min(base, cap));
    }
    function malusFromStreakMiss(n) {
      const m = Math.max(0, Number(n) || 0);
      return m < 7 ? 50 : 75;
    }
    function malusDaysFromStreakMiss(n) {
      const m = Math.max(0, Number(n) || 0);
      return Math.max(1, Math.floor(m / 7));
    }
    function rrPath(ctx, x, y, w, h, r = 0) {
      const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
    function computeFlameSizeForValue(ctx, rawNum, {
      base = 36, step = 3, min = 45, max = 70, ratio = 0.70, fontScale = 0.38,
    } = {}) {
      const num = Math.max(0, Number(rawNum) || 0);
      const label = num.toLocaleString("fr-FR");
      const digits = String(Math.floor(num)).length;

      let size = Math.min(max, Math.max(min, base + step * Math.max(0, digits - 1)));
      let fontSize = Math.round(size * fontScale);
      const fits = () => ctx.measureText(label).width <= size * ratio;

      ctx.font = `800 ${fontSize}px FalconMath, Inter, Segoe UI, Arial, sans-serif`;
      while (!fits() && size < max) {
        size += 2;
        fontSize = Math.round(size * fontScale);
        ctx.font = `800 ${fontSize}px FalconMath, Inter, Segoe UI, Arial, sans-serif`;
      }
      while (!fits() && fontSize > 9) {
        fontSize -= 1;
        ctx.font = `800 ${fontSize}px FalconMath, Inter, Segoe UI, Arial, sans-serif`;
      }
      return { size, fontSize, label };
    }
    const member = interaction.member;
    const highestRoleColor =
      member?.roles?.cache
        ?.filter(r => r.color !== 0 && !r.managed)
        ?.sort((a, b) => b.position - a.position)
        ?.first()?.hexColor || "#ffffffff";

    async function renderDailyRecoveryCardRankStyle({
      avatarURL,
      username,
      prestige,
      level,
      roleColor,
      streak,
      costCareer,
      balanceCareer,
      balanceFalconix,
      preview,
    }) {
      const W = 920;
      const H = 260;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0c0f14");
      bg.addColorStop(1, "#141a23");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      rrPath(ctx, 14, 14, W - 28, H - 28, 22);
      ctx.fillStyle = "#1c2330";
      ctx.fill();

      try {
        const falcon = await loadImage(FALCON_BG_URL);

        const fw = Math.min(W * 0.55, falcon.width);
        const fh = fw * (falcon.height / falcon.width);

        ctx.save();
        rrPath(ctx, 14, 14, W - 28, H - 28, 22);
        ctx.clip();

        ctx.globalAlpha = 0.12;
        ctx.drawImage(
          falcon,
          W - fw - 40,
          (H - fh) / 2,
          fw,
          fh
        );

        ctx.globalAlpha = 1;
        ctx.restore();
      } catch {}

      const AVA = 56;
      const ax = 36;
      const ay = 30;

      try {
        const avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(ax + AVA / 2, ay + AVA / 2, AVA / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, ax, ay, AVA, AVA);
        ctx.restore();

        ctx.lineWidth = 3;
        ctx.strokeStyle = roleColor;
        ctx.beginPath();
        ctx.arc(ax + AVA / 2, ay + AVA / 2, AVA / 2 + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      } catch {}

      const textX = ax + AVA + 18;

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 22px FalconMath, Inter, Arial";
      ctx.fillText(username, textX, ay + 24);

      ctx.font = "500 15px FalconMath, Inter, Arial";
      ctx.fillStyle = "#c9d2e3";
      ctx.fillText(
        prestige > 0
          ? `Prestige ${prestige} • Niveau ${level}`
          : `Niveau ${level}`,
        textX,
        ay + 44
      );

      const { size: flameSize, fontSize, label } =
        computeFlameSizeForValue(ctx, streak, {
          base: 36,
          step: 4,
          min: 48,
          max: 74,
          ratio: 0.72,
          fontScale: 0.4,
        });

      const fx = W - 36 - flameSize;
      const fy = 26;

      try {
        const flame = await loadImage(FLAME_PNG);
        ctx.drawImage(flame, fx, fy, flameSize, flameSize);
      } catch {}

      const cx = fx + flameSize / 2;
      const cy = fy + flameSize * 0.65;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${fontSize}px FalconMath, Inter, Arial`;
      ctx.lineWidth = Math.max(2, fontSize / 7);
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.strokeText(label, cx, cy);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, cx, cy);

      ctx.textAlign = "left";
      ctx.font = "500 14px FalconMath";
      ctx.fillStyle = "#c9d2e3";
      ctx.fillText("Série perdue", fx - 6, fy + flameSize + 18);

      const midY = 120;

      ctx.font = "600 18px FalconMath";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Conséquences du rattrapage", 36, midY);

      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(36, midY + 8, W - 72, 1);

      const statY = midY + 36;

      function stat(label, value, x) {
        ctx.font = "500 14px FalconMath";
        ctx.fillStyle = "#9aa4b2";
        ctx.fillText(label, x, statY);

        ctx.font = "700 18px FalconMath";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(value, x, statY + 22);
      }

      stat("Coût XP", `-${costCareer.toLocaleString("fr-FR")} XP`, 36);
      stat("XP disponible", balanceCareer.toLocaleString("fr-FR"), 260);
      stat("Falconix", balanceFalconix.toString(), 520);

      if (preview) {
        ctx.font = "600 16px FalconMath";
        ctx.fillStyle = "#F5C243";
        ctx.fillText(
          `Après paiement → Prestige ${preview.prestige} • Niveau ${preview.level}`,
          36,
          H - 42
        );
      }

      return canvas.toBuffer("image/png");
    }
    function normalizeStored(val) {
      if (!val) return { id: undefined, name: undefined };
      if (Array.isArray(val)) return { id: val[0], name: val[1] };
      if (typeof val === "string") return { id: val, name: undefined };
      return { id: undefined, name: undefined };
    }
    async function fetchRoleRewardsByPrestige(serverID) {
      const doc = await ServerRole.findOne({ serverID });
      const out = {}; for (let i = 0; i <= 10; i++) out[i] = [];
      if (!doc) return out;
      for (let i = 0; i <= 10; i++) {
        const data = doc[`prestige${i}Roles`];
        if (data && typeof data.get === "function") {
          data.forEach((rawVal, lvlKey) => {
            const { id, name } = normalizeStored(rawVal);
            const lvl = Number(lvlKey);
            if (Number.isFinite(lvl) && id) out[i].push({ level: lvl, roleId: id, roleName: name || "" });
          });
        } else if (data && typeof data === "object" && !Array.isArray(data)) {
          Object.entries(data).forEach(([lvlKey, rawVal]) => {
            const { id, name } = normalizeStored(rawVal);
            const lvl = Number(lvlKey);
            if (Number.isFinite(lvl) && id) out[i].push({ level: lvl, roleId: id, roleName: name || "" });
          });
        }
        out[i].sort((a, b) => a.level - b.level);
      }
      return out;
    }
    function pickRewardForLevel(rewards, level) {
      let chosen = null;
      for (const r of rewards) { if (r.level <= level) chosen = r; else break; }
      return chosen;
    }
    async function applyPrestigeRole(member, rewards, chosen) {
      const allRoleIds = rewards.map(r => r.roleId).filter(Boolean);
      const cache = member.roles.cache;
      const toRemove = allRoleIds.filter(id => (!chosen || id !== chosen.roleId) && cache.has(id));
      if (toRemove.length) await member.roles.remove(toRemove).catch(() => {});
      if (chosen && !cache.has(chosen.roleId)) {
        const roleObj = member.guild.roles.cache.get(chosen.roleId) || await member.guild.roles.fetch(chosen.roleId).catch(() => null);
        if (roleObj) await member.roles.add(roleObj).catch(() => {});
      }
    }
    async function syncRolesAfterStateChange(guild, member, prevPrestige, newPrestige, newLevel) {
      try {
        const rewardsByPrestige = await fetchRoleRewardsByPrestige(guild.id);
        if (newPrestige !== prevPrestige) {
          const prevIds = (rewardsByPrestige[prevPrestige] || []).map(r => r.roleId).filter(Boolean);
          if (prevIds.length) await member.roles.remove(prevIds).catch(() => {});
        }
        const newRewards = rewardsByPrestige[newPrestige] || [];
        const chosen = pickRewardForLevel(newRewards, newLevel || 1);
        await applyPrestigeRole(member, newRewards, chosen);
      } catch (e) {
        console.warn("[daily-syncRoles] échec sync rôles:", e?.message);
      }
    }
    if (interaction.customId === "RECUPDAILY_BUTTON") {
      const user = await User.findOne({ serverID: interaction.guild.id, userID: interaction.user.id });
      if (!user) return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });

      const streakMiss = Number(user.lostConsecutiveDaily) || 0;
      if (streakMiss <= 0) return interaction.reply({ content: "𝐓u n'as aucun Daily manqué à récupérer.", ephemeral: true });

      const costXP = costFromStreakMiss(streakMiss, user.prestige, user.level);
      const currentCareer = Number.isFinite(user.careerXP) ? Number(user.careerXP) : computeCareerFromUser(user);
      const canPayCareer  = currentCareer >= costXP;
      const canPayFalconix = (Number(user.falconix) || 0) >= 1;
      const preview       = canPayCareer ? rebuildFromCareer(currentCareer - costXP) : null;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("CONFIRM_RECUPDAILY_CAREER").setLabel(`Payer ${costXP.toLocaleString("fr-FR")} XP`).setStyle(ButtonStyle.Primary).setDisabled(!canPayCareer),
        new ButtonBuilder().setCustomId("CONFIRM_RECUPDAILY_FALCONIX").setLabel("Payer 1 Falconix").setStyle(ButtonStyle.Secondary).setDisabled(!canPayFalconix),
        new ButtonBuilder().setCustomId("CANCEL_RECUPDAILY_BUTTON").setLabel("Annuler").setStyle(ButtonStyle.Danger),
      );

      // Répond vite -> defer + edit (téléchargement images)
      await interaction.deferReply({ ephemeral: true });

      const buffer = await renderDailyRecoveryCardRankStyle({
        avatarURL: interaction.user.displayAvatarURL({
          extension: "png",
          size: 128,
          forceStatic: true
        }),
        username: interaction.user.username,
        prestige: user.prestige,
        level: user.level,
        roleColor: highestRoleColor,
        streak: streakMiss,
        costCareer: costXP,
        balanceCareer: currentCareer,
        balanceFalconix: Number(user.falconix) || 0,
        preview
      });

      const file = new AttachmentBuilder(buffer, { name: "recupdaily.png" });
      return interaction.editReply({ files: [file], components: [row] });
    }
    if (interaction.customId === "CONFIRM_RECUPDAILY_CAREER") {
      const user = await User.findOne({ serverID: interaction.guild.id, userID: interaction.user.id });
      if (!user) return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });

      const streakMiss = Number(user.lostConsecutiveDaily) || 0;
      if (streakMiss <= 0) return interaction.reply({ content: "𝐓on Daily a déjà été récupéré ou tu n'en as pas manqué récemment.", ephemeral: true });

      const costXP = costFromStreakMiss(streakMiss);
      const malus = malusFromStreakMiss(streakMiss);
      const malusDuration = malusDaysFromStreakMiss(streakMiss);

      const currentCareer = Number.isFinite(user.careerXP) ? Number(user.careerXP) : computeCareerFromUser(user);
      if (currentCareer < costXP) {
        return interaction.reply({
          content: `Solde insuffisant : il faut \`${costXP.toLocaleString("fr-FR")} XP\`. Solde actuel: \`${currentCareer.toLocaleString("fr-FR")}\`.`,
          ephemeral: true,
        });
      }

      // Débit + rebuild
      const newCareer = currentCareer - costXP;
      const state = rebuildFromCareer(newCareer);

      const prevPrestige = user.prestige || 0;
      user.careerXP = newCareer;
      user.prestige = state.prestige;
      user.level    = state.level;
      user.xp       = state.xp;

      user.consecutiveDaily     = streakMiss;
      user.lostConsecutiveDaily = 0;
      user.malusDaily           = malus;
      user.malusDuration        = malusDuration;
      user.lastDaily            = new Date();

      await user.save();
      await syncRolesAfterStateChange(interaction.guild, interaction.member, prevPrestige, state.prestige, state.level);

      try {
      const logChannel = await getLogChannel(interaction);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor("Orange")
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTitle("Rattrapage du Daily en XP")
          .addFields(
            { name: "Série manquée", value: `\`${streakMiss}\` jour${streakMiss > 1 ? "s" : ""} 🔥`, inline: true },
            { name: "Coût", value: `\`${costXP.toLocaleString("fr-FR")} XP\``, inline: true },
            { name: "XP disponible", value: `\`${currentCareer.toLocaleString("fr-FR")} → ${newCareer.toLocaleString("fr-FR")}\``, inline: true },
            { name: "Nouveau statut", value: `Prestige \`${state.prestige}\` • Niveau \`${state.level}\``, inline: true },
            { name: "Malus", value: `\`${malus}\` XP pendant \`${malusDuration}\` jour${malusDuration > 1 ? "s" : ""}`, inline: true },
          )
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch {}
      return interaction.reply({
        content:
          `✅ Daily récupéré en **XP** !\n` +
          `• Débit: \`-${costXP.toLocaleString("fr-FR")} XP\` → Solde: \`${newCareer.toLocaleString("fr-FR")}\`\n` +
          `• Nouveau statut: Prestige \`${state.prestige}\`, Niveau \`${state.level}\`\n` +
          `• Malus: \`${malus}\` XP pendant \`${malusDuration}\` jour(s).`,
        ephemeral: true,
      });
      
    }
    if (interaction.customId === "CONFIRM_RECUPDAILY_FALCONIX") {
      const user = await User.findOne({ serverID: interaction.guild.id, userID: interaction.user.id });
      if (!user) return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });

      const streakMiss = Number(user.lostConsecutiveDaily) || 0;
      if (streakMiss <= 0) return interaction.reply({ content: "𝐓on Daily a déjà été récupéré ou tu n'en as pas manqué récemment.", ephemeral: true });
      if ((Number(user.falconix) || 0) < 1) return interaction.reply({ content: "Il faut **1 Falconix** pour payer cette récupération.", ephemeral: true });

      const malus = malusFromStreakMiss(streakMiss);
      const malusDuration = malusDaysFromStreakMiss(streakMiss);

      user.falconix = (Number(user.falconix) || 0) - 1;
      user.consecutiveDaily     = streakMiss;
      user.lostConsecutiveDaily = 0;
      user.malusDaily           = malus;
      user.malusDuration        = malusDuration;
      user.lastDaily            = new Date();
      await user.save();

      try {
        const logChannel = await getLogChannel(interaction);
        if (logChannel) {
          const falcBefore = (Number(user.falconix) || 0) + 1;
          const falcAfter  = Number(user.falconix) || 0;

          const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({
              name: interaction.user.tag,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Rattrapage du Daily en Falconix")
            .addFields(
              { name: "Série manquée", value: `\`${streakMiss}\` jour${streakMiss > 1 ? "s" : ""} 🔥`, inline: true },
              { name: "Coût", value: "`1 Falconix`", inline: true },
              { name: "Solde Falconix", value: `\`${falcBefore} → ${falcAfter}\``, inline: true },
              { name: "Statut", value: `Prestige \`${user.prestige}\` • Niveau \`${user.level}\``, inline: true },
              { name: "Malus", value: `\`${malus}\` XP pendant \`${malusDuration}\` jour${malusDuration > 1 ? "s" : ""}`, inline: true },
            )
            .setTimestamp();

          await logChannel.send({ embeds: [embed] });
        }
      } catch {
        console.error("Erreur lors de l'envoi du log", interaction);
      }

      return interaction.reply({
        content:
          `✅ Daily récupéré en dépensant **1 Falconix**.\n` +
          `• Falconix restant: \`${user.falconix}\`\n` +
          `• Malus: \`${malus}\` XP pendant \`${malusDuration}\` jour(s).`,
        ephemeral: true,
      });
    }
    if (interaction.customId === "CANCEL_RECUPDAILY_BUTTON") {
      const filter = { userID: interaction.user.id, serverID: interaction.guild.id };
      const updated = await User.findOneAndUpdate(filter, { $set: { lostConsecutiveDaily: 0 } }, { new: true });
      if (!updated) {
        console.error("Utilisateur non trouvé pour CANCEL_RECUPDAILY_BUTTON", filter);
        return interaction.reply({ content: "Utilisateur introuvable.", ephemeral: true });
      }
      return interaction.reply({
        content: "丨𝐓u as décidé de ne pas récupérer ton __𝐃aily__. 𝐐uelle audace ! 😅",
        ephemeral: true,
      });
    }

    // SelectMenu pour le channel rôle, sélecteur de jeux.
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

    // Unmute quelqu'un avec le bouton sur le message des logs
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
              console.error('[UNMUTE] Erreur lors de la mise à jour du message :', error);
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
          content: `丨𝐓on rôle \`${roleName}\` a été supprimé.`,
        });
      } else {
        await member.roles.add(roleID);
        interaction.editReply({
          content: `丨𝐓u as récupéré le rôle \`${roleName}\`.`,
        });
      }
    }

    // Validation règlement avec rôle
    

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

    function disableComponents(components) {
      return components.map(row => {
        const newRow = ActionRowBuilder.from(row);
        newRow.components = row.components.map(c =>
          c.data
            ? ButtonBuilder.from(c).setDisabled(true)
            : StringSelectMenuBuilder.from(c).setDisabled(true)
        );
        return newRow;
      });
    }

    //Gestion du SetConfig
    if (interaction.customId === "LOG_BUTTON") { // Bouton pour ajouter/modifier le salon des logs
      const textChannels = interaction.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildText)
        .map(c => ({
          label: c.name,
          value: c.id
        }))
        .slice(0, 25);

      if (!textChannels.length) return;

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("LOG_SELECT_CHANNEL")
        .setPlaceholder("丨𝐒électionne le salon des logs")
        .addOptions(textChannels);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const disabledRows = disableComponents(interaction.message.components);
      const buttonsRow = disabledRows[0];

      await interaction.update({
        components: [buttonsRow, selectRow]
      });
    }
    if (interaction.customId === "LOG_DESAC") { // Bouton pour réinitialiser le salon des logs
      function buildBaseSelectMenuRow() {
        return new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("setConfigCustomID")
            .setPlaceholder("𝐐ue veux-tu configurer d'autre ?")
            .addOptions(
              { label: "丨𝐋og", emoji: "📝", value: "LOG" },
              { label: "丨𝐓witch", emoji: "🎥", value: "TWITCH" },
              { label: "丨𝐑èglement", emoji: "📜", value: "REGLEMENT" },
              { label: "丨𝐑ôles 𝐌enu", emoji: "🎭", value: "ROLECHANNEL" },
              { label: "丨𝐖elcome", emoji: "👋", value: "WELCOME" },
              { label: "丨𝐈mplications", emoji: "🏆", value: "IMPLICATION" },
              { label: "丨𝐒uggestions", emoji: "💡", value: "SUGGESTION" },
              { label: "丨𝐃aily", emoji: "💵", value: "DAILY" },
              { label: "丨𝐑ôles des 𝐍iveaux", emoji: "🧪", value: "ROLES" },
              { label: "丨𝐓icket", emoji: "🎫", value: "TICKET" },
              { label: "丨𝐁ingo", emoji: "🎱", value: "BINGO" }
            )
        );
      }
      function buildConfigComponents(hasLogChannel = false) {
        const logButton = new ButtonBuilder()
          .setCustomId("LOG_BUTTON")
          .setEmoji(hasLogChannel ? "📝" : "➕")
          .setLabel(hasLogChannel ? "𝐌odifier 𝐒alon" : "𝐀jouter 𝐒alon")
          .setStyle(hasLogChannel ? ButtonStyle.Primary : ButtonStyle.Primary);

        const resetButton = new ButtonBuilder()
          .setCustomId("LOG_DESAC")
          .setEmoji("❌")
          .setLabel("𝐑éinitialiser")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!hasLogChannel);

        const buttonsRow = new ActionRowBuilder().addComponents(
          logButton,
          resetButton
        );

        const mainSelectMenuRow = buildBaseSelectMenuRow();

        return [buttonsRow, mainSelectMenuRow];
      }
      await ServerConfig.findOneAndUpdate(
        { serverID: interaction.guild.id },
        {
          logChannelID: null,
          logChannelName: "𝐍on défini"
        }
      );

      await updateConfigEmbed(interaction, "𝐒alon actuel", "𝐍on défini");

      await interaction.update({
        components: buildConfigComponents(false)
      });
    }
    if (interaction.customId === "LOG_SELECT_CHANNEL") { // Sélection du salon des logs dans le menu déroulant
      function buildBaseSelectMenuRow() {
        return new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("setConfigCustomID")
            .setPlaceholder("丨𝐐ue veux-tu configurer d'autre ?")
            .addOptions(
              { label: "丨𝐋og", emoji: "📝", value: "LOG" },
              { label: "丨𝐓witch", emoji: "🎥", value: "TWITCH" },
              { label: "丨𝐑èglement", emoji: "📜", value: "REGLEMENT" },
              { label: "丨𝐑ôles 𝐌enu", emoji: "🎭", value: "ROLECHANNEL" },
              { label: "丨𝐖elcome", emoji: "👋", value: "WELCOME" },
              { label: "丨𝐈mplications", emoji: "🏆", value: "IMPLICATION" },
              { label: "丨𝐒uggestions", emoji: "💡", value: "SUGGESTION" },
              { label: "丨𝐃aily", emoji: "💵", value: "DAILY" },
              { label: "丨𝐑ôles des 𝐍iveaux", emoji: "🧪", value: "ROLES" },
              { label: "丨𝐓icket", emoji: "🎫", value: "TICKET" },
              { label: "丨𝐁ingo", emoji: "🎱", value: "BINGO" }
            )
        );
      }
      function buildConfigComponents(hasLogChannel = false) {
        const logButton = new ButtonBuilder()
          .setCustomId("LOG_BUTTON")
          .setEmoji(hasLogChannel ? "📝" : "➕")
          .setLabel(hasLogChannel ? "丨𝐌odifier 𝐒alon" : "丨𝐀jouter 𝐒alon")
          .setStyle(hasLogChannel ? ButtonStyle.Primary : ButtonStyle.Primary);

        const resetButton = new ButtonBuilder()
          .setCustomId("LOG_DESAC")
          .setEmoji("❌")
          .setLabel("丨𝐑éinitialiser")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!hasLogChannel);

        const buttonsRow = new ActionRowBuilder().addComponents(
          logButton,
          resetButton
        );

        const mainSelectMenuRow = buildBaseSelectMenuRow();

        return [buttonsRow, mainSelectMenuRow];
      }
      const channelId = interaction.values[0];
      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel) return;

      await ServerConfig.findOneAndUpdate(
        { serverID: interaction.guild.id },
        {
          logChannelID: channelId,
          logChannelName: channel.name
        },
        { upsert: true }
      );

      await updateConfigEmbed(interaction, "𝐒alon actuel", channel.name);

      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id
      });

      await interaction.update({
        components: buildConfigComponents(!!serverConfig?.logChannelID)
      });
    }

    if (interaction.customId === "REGL_BUTTON") { // Bouton pour ajouter/modifier le salon du règlement
      const textChannels = interaction.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildText)
        .map(c => ({
          label: c.name,
          value: c.id
        }))
        .slice(0, 25);

      if (!textChannels.length) return;

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("REGL_SELECT_CHANNEL")
        .setPlaceholder("丨𝐒électionne le salon du règlement")
        .addOptions(textChannels);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const disabledRows = disableComponents(interaction.message.components);
      const buttonsRow = disabledRows[0];

      await interaction.update({
        components: [buttonsRow, selectRow]
      });
    }
    if (interaction.customId === "REGL_SELECT_CHANNEL") { // Sélection du salon du règlement
      function buildBaseSelectMenuRow() {
        return new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("setConfigCustomID")
            .setPlaceholder("丨𝐐ue veux-tu configurer d'autre ?")
            .addOptions(
              { label: "丨𝐋og", emoji: "📝", value: "LOG" },
              { label: "丨𝐓witch", emoji: "🎥", value: "TWITCH" },
              { label: "丨𝐑èglement", emoji: "📜", value: "REGLEMENT" },
              { label: "丨𝐑ôles 𝐌enu", emoji: "🎭", value: "ROLECHANNEL" },
              { label: "丨𝐖elcome", emoji: "👋", value: "WELCOME" },
              { label: "丨𝐈mplications", emoji: "🏆", value: "IMPLICATION" },
              { label: "丨𝐒uggestions", emoji: "💡", value: "SUGGESTION" },
              { label: "丨𝐃aily", emoji: "💵", value: "DAILY" },
              { label: "丨𝐑ôles des 𝐍iveaux", emoji: "🧪", value: "ROLES" },
              { label: "丨𝐓icket", emoji: "🎫", value: "TICKET" },
              { label: "丨𝐁ingo", emoji: "🎱", value: "BINGO" }
            )
        );
      }
      function buildConfigComponents(hasReglChannel = false) {
        const reglButton = new ButtonBuilder()
          .setCustomId("REGL_BUTTON")
          .setEmoji(hasReglChannel ? "📝" : "➕")
          .setLabel(hasReglChannel ? "丨𝐌odifier 𝐒alon" : "丨𝐀jouter 𝐒alon")
          .setStyle(ButtonStyle.Primary);

        const resetButton = new ButtonBuilder()
          .setCustomId("REGL_DESAC")
          .setEmoji("❌")
          .setLabel("丨𝐑éinitialiser")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!hasReglChannel);

        const buttonsRow = new ActionRowBuilder().addComponents(
          reglButton,
          resetButton
        );

        return [buttonsRow, buildBaseSelectMenuRow()];
      }

      const channelId = interaction.values[0];
      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel) return;

      await ServerConfig.findOneAndUpdate(
        { serverID: interaction.guild.id },
        {
          reglementChannelID: channelId,
          reglementChannelName: channel.name
        },
        { upsert: true }
      );

      await updateConfigEmbed(interaction, "𝐒alon actuel", channel.name);

      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id
      });

      await interaction.update({
        components: buildConfigComponents(!!serverConfig?.reglementChannelID)
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
    if (interaction.customId === "VALID_REGL") {
      const serverConfig = await ServerConfig.findOne({ serverID: interaction.guild.id });
      if (!serverConfig?.roleReglementID) {
        return interaction.reply({
          content: "Aucun **rôle règlement** n’est configuré. Configure-le d’abord dans `Modifier Salons/Rôles`.",
          ephemeral: true,
        });
      }

      const member = interaction.member;
      const role = interaction.guild.roles.cache.get(serverConfig.roleReglementID);
      if (!role) {
        return interaction.reply({ content: "Le rôle configuré n’existe plus.", ephemeral: true });
      }

      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ content: "Tu as déjà validé le règlement. Quelque chose à te reprocher ?", ephemeral: true });
      }

      await member.roles.add(role).catch(() => {});
      await interaction.reply({ content: "✅ Règlement validé. Bienvenue !", ephemeral: true });
    }
    if (interaction.customId === "REGL_DESAC") { // Bouton pour réinitialiser le règlement
      function buildBaseSelectMenuRow() {
        return new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("setConfigCustomID")
            .setPlaceholder("𝐐ue veux-tu configurer d'autre ?")
            .addOptions(
              { label: "丨𝐋og", emoji: "📝", value: "LOG" },
              { label: "丨𝐓witch", emoji: "🎥", value: "TWITCH" },
              { label: "丨𝐑èglement", emoji: "📜", value: "REGLEMENT" },
              { label: "丨𝐑ôles 𝐌enu", emoji: "🎭", value: "ROLECHANNEL" },
              { label: "丨𝐖elcome", emoji: "👋", value: "WELCOME" },
              { label: "丨𝐈mplications", emoji: "🏆", value: "IMPLICATION" },
              { label: "丨𝐒uggestions", emoji: "💡", value: "SUGGESTION" },
              { label: "丨𝐃aily", emoji: "💵", value: "DAILY" },
              { label: "丨𝐑ôles des 𝐍iveaux", emoji: "🧪", value: "ROLES" },
              { label: "丨𝐓icket", emoji: "🎫", value: "TICKET" },
              { label: "丨𝐁ingo", emoji: "🎱", value: "BINGO" }
            )
        );
      }

      function buildConfigComponents(hasReglChannel = false) {
        const reglButton = new ButtonBuilder()
          .setCustomId("REGL_BUTTON")
          .setEmoji(hasReglChannel ? "📝" : "➕")
          .setLabel(hasReglChannel ? "丨𝐌odifier 𝐒alon" : "丨𝐀jouter 𝐒alon")
          .setStyle(ButtonStyle.Primary);

        const resetButton = new ButtonBuilder()
          .setCustomId("REGL_DESAC")
          .setEmoji("❌")
          .setLabel("丨𝐑éinitialiser")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!hasReglChannel);

        const buttonsRow = new ActionRowBuilder().addComponents(
          reglButton,
          resetButton
        );

        return [buttonsRow, buildBaseSelectMenuRow()];
      }

      await ServerConfig.findOneAndUpdate(
        { serverID: interaction.guild.id },
        {
          reglementChannelID: null,
          reglementChannelName: "𝐍on défini",
          roleReglementID: null,
          roleReglementName: null
        }
      );

      await updateConfigEmbed(interaction, "𝐒alon actuel", "𝐍on défini");

      await interaction.update({
        components: buildConfigComponents(false)
      });
    }




    if (interaction.customId === "ROLE_LISTE") {
      const badgeMap = { 1: "🥉", 2: "🥈", 3: "🥇", 4: "🏅", 5: "🎖️", 6: "🔰", 7: "💎", 8: "👑", 9: "⚜️", 10: "💠" };

      const prestigeOptions = Array.from({ length: 11 }, (_, i) => ({
        label: i === 0 ? "🎓丨𝐍iveau 𝐒tandard" : `${badgeMap[i] || "🏆"}丨𝐏restige ${i}`,
        value: `prestige${i}Roles`,
        description: i === 0 ? "𝐂onfigurer les rôles standard" : `𝐂onfigurer les rôles pour le Prestige ${i}`,
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("SELECT_PRESTIGE_ROLE")
        .setPlaceholder("丨𝐒électionne un prestige à consulter ou modifier")
        .addOptions(prestigeOptions);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: "🎯丨𝐒électionne un prestige pour voir ou modifier ses rôles :",
        components: [selectRow],
        ephemeral: true,
      });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === "SELECT_PRESTIGE_ROLE") {
      const selectedPrestige = interaction.values[0]; // ex: prestige3Roles
      const prestigeNumber = parseInt(selectedPrestige.replace("prestige", "").replace("Roles", ""), 10);

      const badgeMap = { 1: "🥉", 2: "🥈", 3: "🥇", 4: "🏅", 5: "🎖️", 6: "🔰", 7: "💎", 8: "👑", 9: "⚜️", 10: "💠" };
      const prestigeLabel = Number.isFinite(prestigeNumber) && prestigeNumber === 0
        ? "🎓 Niveau Standard"
        : `${badgeMap[prestigeNumber] || "🏆"} Prestige ${prestigeNumber}`;

      let server = await ServerRole.findOne({ serverID: interaction.guild.id });
      if (!server) {
        server = new ServerRole({ serverID: interaction.guild.id, serverName: interaction.guild.name });
        await server.save();
      }

      const ensureAndMigrate = async () => {
        await ensurePrestigeMap(server, selectedPrestige);
        let prestigeRoles = server[selectedPrestige];

        if (Array.isArray(prestigeRoles)) {
          const m = new Map();
          LEVELS.forEach((lvl, i) => {
            const roleId = prestigeRoles[i];
            if (roleId) {
              const role = interaction.guild.roles.cache.get(roleId);
              m.set(String(lvl), [roleId, role?.name ?? ""]);
            }
          });
          server[selectedPrestige] = m;
          prestigeRoles = m;
          server.markModified(selectedPrestige);
          await server.save();
        } else if (prestigeRoles && typeof prestigeRoles === "object" && typeof prestigeRoles.get !== "function") {
          const m = new Map();
          for (const [k, v] of Object.entries(prestigeRoles)) {
            if (Array.isArray(v)) {
              const id = v[0];
              const role = id ? interaction.guild.roles.cache.get(id) : null;
              m.set(String(k), [id, role?.name ?? v[1] ?? ""]);
            }
          }
          server[selectedPrestige] = m;
          prestigeRoles = m;
          server.markModified(selectedPrestige);
          await server.save();
        }

        if (typeof prestigeRoles?.forEach === "function") {
          let touched = false;
          prestigeRoles.forEach((val, key) => {
            const { id, name } = normalizeValue(val);
            if (id && (!name || name === "")) {
              const r = interaction.guild.roles.cache.get(id);
              prestigeRoles.set(String(key), [id, r?.name ?? ""]);
              touched = true;
            }
          });
          if (touched) {
            server.markModified(selectedPrestige);
            await server.save();
          }
        }

        return server[selectedPrestige];
      };

      const prestigeRoles = await ensureAndMigrate();

      const roleListText = LEVELS.map((level) => {
        const { role, storedName } = getRoleInfo(interaction.guild, prestigeRoles, level);
        return `𝐍iveau **${level}** ◟ ${role ? role.toString() : (storedName ? `*${storedName}*` : "*Aucun rôle défini.*")}`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`🧩丨𝐑ôles pour ${prestigeLabel}`)
        .setDescription(roleListText)
        .setColor("#88c9f9");

      const modifySelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`ROLE_MODIFY_SELECT_${selectedPrestige}`)
        .setPlaceholder("𝐒électionne un niveau à modifier")
        .addOptions(
          LEVELS.map((level) => {
            const { role, storedName } = getRoleInfo(interaction.guild, prestigeRoles, level);
            return {
              label: `◟𝐍iveau ${level}`,
              value: `LEVEL_${level}`,
              description: role ? `𝐀ctuel : ${role.name}` : (storedName ? `𝐀ctuel : ${storedName}` : "Aucun rôle défini."),
            };
          })
        );

      const rowSelect = new ActionRowBuilder().addComponents(modifySelectMenu);

      const prestigeOptions = Array.from({ length: 11 }, (_, i) => ({
        label: i === 0 ? "🎓丨Niveau Standard" : `${badgeMap[i] || "🏆"}丨Prestige ${i}`,
        value: `prestige${i}Roles`,
        description: i === 0 ? "Configurer les rôles standard" : `Configurer les rôles pour le Prestige ${i}`,
      }));

      const selectPrestige = new StringSelectMenuBuilder()
        .setCustomId("SELECT_PRESTIGE_ROLE")
        .setPlaceholder("丨𝐒électionne un prestige à consulter ou modifier")
        .addOptions(prestigeOptions);

      const rowPrestige = new ActionRowBuilder().addComponents(selectPrestige);

      await interaction.update({
        content: "🎯丨𝐒électionne un prestige pour voir ou modifier ses rôles :",
        embeds: [embed],
        components: [rowPrestige, rowSelect],
        ephemeral: true,
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
              content: "Aucun salon pour le 𝐃aily n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salon`.",
              ephemeral: true,
          });
      }

      const randomDescriptionDailyEmbed = messagesRandom.DailyEmbed[Math.floor(Math.random() * messagesRandom.DailyEmbed.length)];
  
      const DailyEmbed = new EmbedBuilder()
          .setColor("Orange")
          .setTitle(`――――――∈ 𝐑écompense journalière ! ∋――――――`)
          .setDescription(randomDescriptionDailyEmbed)
          .setThumbnail(interaction.guild.iconURL())
          .setFooter({
              text: `𝐂ordialement l'équipe ${interaction.guild.name}`,
              iconURL: interaction.guild.iconURL(),
          });
  
      const rowPushDaily = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
              .setCustomId("DAILYXP")
              .setLabel("💸丨𝐑écupérer l'𝐗𝐏.")
              .setStyle(ButtonStyle.Success)
      );
  
      const dailyChannel = bot.channels.cache.get(serverConfig.dailyChannelID);
      if (dailyChannel) {
          dailyChannel.send({
              embeds: [DailyEmbed],
              components: [rowPushDaily],
          }).catch(console.error);
      }
  
      await interaction.reply({
          content: "丨𝐋e message pour récupérer l'𝐗𝐏 journalier a été envoyé dans le salon configuré.",
          ephemeral: true,
      });
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
  
      const MenuRoleSelect = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
              .setCustomId('Role_Menu')
              .setPlaceholder('丨𝐒éléctionne un rôle. 🎭')
              .addOptions(menuOptions)
      );
  
      const randomDescriptionRoleMenu = messagesRandom.rolesMenu[Math.floor(Math.random() * messagesRandom.rolesMenu.length)];

      const RoleEmbed = new EmbedBuilder()
          .setColor("#b3c7ff")
          .setTitle(`丨𝐂hoisis tes rôles 🏷️`)
          .setDescription(randomDescriptionRoleMenu)
          .setFooter({
              text: `𝐂ordialement, l'équipe ${interaction.guild.name}`,
              iconURL: interaction.guild.iconURL(),
          });

      await roleChannel.send({ embeds: [RoleEmbed], components: [MenuRoleSelect] });
      await interaction.reply({ content: "丨𝐋e menu des rôles a été envoyé dans le salon de rôles configuré.", ephemeral: true });
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
        return interaction.reply({
          content: "Cette commande ne peut être utilisée que dans un serveur.",
          ephemeral: true
        });
      }

      const botMember = await interaction.guild.members
        .fetch(interaction.client.user.id)
        .catch(() => null);

      if (!botMember) {
        return interaction.reply({
          content: "Erreur : Impossible de récupérer les informations du bot dans le serveur.",
          ephemeral: true
        });
      }

      let secondsRemaining = 60;
      const originalContent =
        "🙏🏻丨𝐌erci de répondre le rôle et de fournir un nom pour le menu. (**exemple : @MONROLE NomDeMonRôle**). ~~Possibilité de mettre un emoji devant le nom.~~";

      const initialReply = await interaction.reply({
        content: `${originalContent} ***${secondsRemaining}s***`,
        fetchReply: true
      });

      let messageDeleted = false;

      const interval = setInterval(async () => {
        if (secondsRemaining <= 0) {
          clearInterval(interval);
          return;
        }

        secondsRemaining--;

        if (initialReply && !messageDeleted) {
          try {
            await initialReply.edit(
              `${originalContent} ***${secondsRemaining}s***`
            );
          } catch (error) {
            if (error.code === 10008) {
              messageDeleted = true;
              clearInterval(interval);
            }
          }
        }
      }, 1000);

      const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        time: 60000,
        max: 1
      });

      collector.on("collect", async (m) => {
        clearInterval(interval);
        await deleteMessage(m);

        const role = m.mentions.roles.first();
        if (!role) {
          await interaction.followUp({
            content: "😵丨𝐑ôle invalide/inexistant. 𝐍'oublie pas l'arobase (*@*).",
            ephemeral: true
          });
          return deleteMessage(initialReply);
        }

        const displayName = m.content.replace(`<@&${role.id}>`, "").trim();

        if (role.position >= botMember.roles.highest.position) {
          await interaction.followUp({
            content: "↘️丨𝐋e rôle doit être inférieur à mon rôle le plus élevé.",
            ephemeral: true
          });
          return deleteMessage(initialReply);
        }

        let serverRoleMenu = await ServerRoleMenu.findOne({
          serverID: interaction.guild.id
        });

        // 🆕 Création du document s'il n'existe pas
        if (!serverRoleMenu) {
          serverRoleMenu = await ServerRoleMenu.create({
            serverID: interaction.guild.id,
            serverName: interaction.guild.name,
            menus: []
          });
        }

        // 🆕 Création automatique du menu DefaultMenu
        let menu = serverRoleMenu.menus.find(
          (m) => m.menuName === 'DefaultMenu'
        );

        if (!menu) {
          menu = {
            menuName: 'DefaultMenu',
            roles: []
          };
          serverRoleMenu.menus.push(menu);
        }

        const roleExists = menu.roles.find(
          (r) => r.roleId === role.id
        );

        if (roleExists) {
          await interaction.followUp({
            content: "⚠️丨𝐂e rôle est déjà ajouté.",
            ephemeral: true
          });
          return deleteMessage(initialReply);
        }

        menu.roles.push({
          roleName: role.name,
          roleId: role.id,
          displayName: displayName || role.name
        });

        await serverRoleMenu.save();

        await interaction.followUp({
          content: `🤘丨𝐋e rôle a été ajouté avec succès : **${role.name}** sous le nom **${displayName || role.name}**.`,
          ephemeral: true
        });

        await deleteMessage(initialReply);
      });

      collector.on("end", async (_, reason) => {
        clearInterval(interval);

        if (reason === "time" && !messageDeleted) {
          await interaction.followUp({
            content:
              "⏳丨𝐓emps écoulé pour la réponse. 𝐌ême la confiture prend moins de temps à se figer.",
            ephemeral: true
          });
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
    // DESACTIVATION BOUTON 
    if (interaction.customId === 'ROLECHANNEL_REMOVE') {
      const serverRoleMenus = await ServerRoleMenu.findOne({
        serverID: interaction.guild.id
      });

      if (!serverRoleMenus || !serverRoleMenus.menus?.length) {
        return interaction.update({
          content: "丨𝐈l n'y a aucun rôle disponible pour la suppression sur ton serveur.",
          components: interaction.message.components
        });
      }

      const roleOptions = serverRoleMenus.menus.flatMap(menu =>
        menu.roles
          .map(role => {
            const roleObject = interaction.guild.roles.cache.get(role.roleId);
            return roleObject
              ? { label: roleObject.name, value: roleObject.id }
              : null;
          })
          .filter(Boolean)
      );

      if (!roleOptions.length) {
        return interaction.update({
          content: "丨𝐈l n'y a aucun rôle disponible pour la suppression sur ton serveur.",
          components: interaction.message.components
        });
      }

      const roleSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('ROLECHANNEL_SELECT_REMOVE')
        .setPlaceholder('丨𝐐uel rôle supprimer ?')
        .addOptions(roleOptions);

      const roleSelectRow = new ActionRowBuilder().addComponents(roleSelectMenu);

      await interaction.update({
        components: [...interaction.message.components, roleSelectRow]
      });
    }
    if (interaction.customId === 'ROLECHANNEL_SELECT_REMOVE') {
      const selectedRoleId = interaction.values[0];

      const serverRoleMenus = await ServerRoleMenu.findOne({
        serverID: interaction.guild.id
      });
      if (!serverRoleMenus) return;

      // 🧹 Suppression du rôle
      serverRoleMenus.menus.forEach(menu => {
        menu.roles = menu.roles.filter(r => r.roleId !== selectedRoleId);
      });

      // 🧼 Nettoyage des menus vides
      serverRoleMenus.menus = serverRoleMenus.menus.filter(
        menu => menu.roles.length > 0
      );

      if (serverRoleMenus.menus.length === 0) {
        await ServerRoleMenu.deleteOne({ serverID: interaction.guild.id });
      } else {
        await serverRoleMenus.save();
      }

      /* ============================
        🔄 REBUILD DE L’EMBED
        ============================ */

      const baseEmbed = interaction.message.embeds[0];
      const newEmbed = EmbedBuilder.from(baseEmbed);

      const allRoles = serverRoleMenus.menus.flatMap(menu => menu.roles);

      if (!allRoles.length) {
        newEmbed.setDescription("📭丨𝐀ucun rôle configuré actuellement.");
      } else {
        const rolesText = allRoles
          .map(r => {
            const roleObj = interaction.guild.roles.cache.get(r.roleId);
            return roleObj ? `• ${roleObj.name}` : null;
          })
          .filter(Boolean)
          .join('\n');

        newEmbed.setDescription(`📜丨𝐑ôles configurés :\n${rolesText}`);
      }

      // 👉 On retire le menu et on revient à l’état initial
      await interaction.update({
        embeds: [newEmbed],
        components: interaction.message.components.slice(0, 1) // boutons uniquement
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
    if (interaction.customId === "BINGO_BUTTON") {
      await interaction.deferUpdate();

      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐑éponds avec **l’ID** du salon pour le 𝐁ingo (clic droit → Copier l'identifiant).";
      const promptMsg = await interaction.channel.send(`${originalContent} ***${secondsRemaining}s***`);

      const timer = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining > 0) promptMsg.edit(`${originalContent} ***${secondsRemaining}s***`).catch(() => {});
        else clearInterval(timer);
      }, 1000);

      const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        time: 60000,
        max: 1,
      });

      collector.on('collect', async (m) => {
        clearInterval(timer);
        const channelId = m.content.trim();
        let channel = interaction.guild.channels.cache.get(channelId)
          || await interaction.guild.channels.fetch(channelId).catch(() => null)
          || await interaction.client.channels.fetch(channelId).catch(() => null);

        if (!channel) {
          await interaction.followUp({ content: "😵丨𝐒alon invalide.", ephemeral: true });
          return;
        }

        await ServerConfig.updateOne(
          { serverID: interaction.guild.id },
          { $set: { bingoChannelID: channel.id, bingoChannelName: channel.name } },
          { upsert: true }
        );
        await Bingo.updateOne(
          { serverID: interaction.guild.id },
          {
            $set: { serverName: interaction.guild.name, bingoChannelName: channel.name },
            $setOnInsert: { lastBingoTime: null, nextBingoTime: null, etat: ETAT_DB.INACTIF }
          },
          { upsert: true }
        );

        const baseEmbed = interaction.message.embeds?.[0];
        const prev = baseEmbed?.data || {};
        const newDesc = replaceLine(prev.description || "", "𝐒alon actuel", `\`${channel.name}\``);
        const newEmbed = new EmbedBuilder(prev).setDescription(newDesc);

        const bingoDoc = await Bingo.findOne({ serverID: interaction.guild.id }).lean();
        const isActive = ((bingoDoc?.etat || '').trim()) === ETAT_DB.ACTIF;

        const primaryBtn = new ButtonBuilder()
          .setCustomId(isActive ? 'BINGO_DISABLE' : 'BINGO_PUSH')
          .setLabel(isActive ? '𝐃ésactiver' : '𝐀ctiver')
          .setStyle(isActive ? ButtonStyle.Danger : ButtonStyle.Primary);

        if (!isActive) primaryBtn.setEmoji('✔️');

        const row = new ActionRowBuilder().addComponents(
          primaryBtn,
          new ButtonBuilder()
            .setCustomId('BINGO_BUTTON')
            .setEmoji("📝")
            .setLabel('𝐌odifier 𝐒alon')
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.message.edit({ embeds: [newEmbed], components: [row] }).catch(() => {});
        await interaction.followUp({ content: `🤘丨𝐒alon mis à jour : **${channel.name}**.`, ephemeral: true });

        m.delete().catch(() => {});
        promptMsg.delete().catch(() => {});
      });

      collector.on('end', async (_c, reason) => {
        if (reason === 'time') await interaction.followUp({ content: '⏳ | Temps écoulé pour la réponse.', ephemeral: true });
        clearInterval(timer);
        promptMsg.delete().catch(() => {});
      });
    }
    if (interaction.customId === "BINGO_PUSH") {
      const channel = await resolveBingoChannel(interaction);
      if (!channel) {
        return interaction.reply({
          content: "Salon non enregistré. Clique d’abord sur **Modifier le salon** et choisis un salon valide.",
          ephemeral: true
        });
      }

      let bingoDoc = await Bingo.findOneAndUpdate(
        { serverID: interaction.guild.id },
        {
          $set: {
            serverName: interaction.guild.name,
            bingoChannelName: channel.name,
            etat: ETAT_DB.ACTIF
          },
          $setOnInsert: { lastBingoTime: null, nextBingoTime: null }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const now = Date.now();
      const nextTs = bingoDoc.nextBingoTime ? new Date(bingoDoc.nextBingoTime).getTime() : 0;
      if (!nextTs || nextTs <= now) {
        const delay = intervalleAleatoire(2, 5);
        const next = new Date(now + delay);
        bingoDoc.nextBingoTime = next;
        await bingoDoc.save();
      }

      const baseEmbed = interaction.message.embeds?.[0];

      const VISUAL_STATUS_LOCAL = (typeof VISUAL_STATUS !== "undefined")
        ? VISUAL_STATUS
        : { ACTIF: '𝐀𝐂𝐓𝐈𝐅', INACTIF: '𝐈𝐍𝐀𝐂𝐓𝐈𝐅' };

      let desc = baseEmbed?.description || "";
      desc = setStatusLine(desc, VISUAL_STATUS_LOCAL.ACTIF);
      desc = removeLineByLabel(desc, "◟𝐏rochain bingo");
      desc = replaceLine(desc, "𝐒alon actuel", `\`${channel.name}\``);

      let newEmbed = new EmbedBuilder(baseEmbed?.data || {}).setDescription(desc);
      newEmbed = applyNextBingoFooterNoTs(newEmbed, bingoDoc, interaction.guild);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('BINGO_DISABLE').setLabel('𝐃ésactiver').setStyle(ButtonStyle.Danger),        // pas d’emoji
        new ButtonBuilder().setCustomId('BINGO_BUTTON').setEmoji("📝").setLabel('𝐌odifier 𝐒alon').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('BINGO_DESAC').setEmoji("❌").setLabel('𝐑éinitialiser').setStyle(ButtonStyle.Danger)
      );

      await interaction.update({ embeds: [newEmbed], components: [row] });
    }
    if (interaction.customId === "BINGO_DISABLE") {
      const bingoDoc = await Bingo.findOneAndUpdate(
        { serverID: interaction.guild.id },
        { $set: { etat: ETAT_DB.INACTIF, nextBingoTime: null, serverName: interaction.guild.name } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const baseEmbed = interaction.message.embeds?.[0];
      const prev = baseEmbed?.data || {};
      let desc = baseEmbed?.description || "";
      desc = setStatusLine(desc, VISUAL_STATUS.INACTIF);
      desc = removeLineByLabel(desc, "◟𝐏rochain bingo");

      let newEmbed = new EmbedBuilder(prev).setDescription(desc);
      newEmbed = newEmbed.setFooter(null).setTimestamp(null);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('BINGO_PUSH').setEmoji("✔️").setLabel('𝐀ctiver').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('BINGO_BUTTON').setEmoji("📝").setLabel('𝐌odifier 𝐒alons').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('BINGO_DESAC').setEmoji("❌").setLabel('𝐑éinitialiser').setStyle(ButtonStyle.Danger)
      );

      await interaction.update({ embeds: [newEmbed], components: [row] });
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
    if (interaction.customId === "TWITCH_ROLE") {
      if (!interaction.guild) {
          return interaction.reply({ content: "Cette commande ne peut être utilisée que dans une guilde.", ephemeral: true });
      }
  
      const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(console.error);
      if (!botMember) {
          return interaction.reply({ content: "Erreur : Impossible de récupérer les informations du bot dans la guilde.", ephemeral: true });
      }
  
      let secondsRemaining = 60;
      const originalContent = "🙏🏻丨𝐌erci de répondre en faisant un tag (@votre_rôle) pour le rôle `𝐓witch` de ton serveur.";
  
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
          await deleteMessage(m);
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
              { TwitchRoleID: role.id, TwitchRoleName: role.name },
              { upsert: true, new: true }
          );
  
          const successMsg = await interaction.followUp({ content: `🤘丨𝐋e rôle pour \`𝐓witch\` a été mis à jour avec succès : **${role.name}**.`, ephemeral: true });
          followUpMessages.push(successMsg);
      });
  
      collector.on("end", async (collected, reason) => {
          if (reason === "time") {
              const timeoutMsg = await interaction.followUp({ content: "⏳丨𝐓emps écoulé pour la réponse, j'ai eu le temps de changer de carrière et d'avoir une promotion.", ephemeral: true });
              followUpMessages.push(timeoutMsg);
          }
          replyMessage.delete().catch(error => {
              if (error.code === 10008) {
                  // Ignorer si le message a déjà été supprimé
              } else {
                  console.error('Erreur lors de la suppression du message initial :', error);
              }
          });
          setTimeout(() => {
              followUpMessages.forEach(msg => {
                  msg.delete().catch(error => {
                      if (error.code === 10008) {
                          // Ignorer si le message a déjà été supprimé
                      } else {
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

    // Gestion de la recherche de mate
    const SEARCH_DURATION_MS = 30 * 60 * 1000;
    const CANCEL_PREFIX = 'CANCEL_SEARCH_';
    async function getOrCleanExisting(interaction) {
      const existing = await SearchMateMessage.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
      if (!existing) return null;

      const expired = existing.createdAt && (Date.now() - new Date(existing.createdAt).getTime() > SEARCH_DURATION_MS);
      if (expired) {
        await SearchMateMessage.deleteOne({ _id: existing._id }).catch(() => {});
        return null;
      }

      try {
        const ch = await interaction.client.channels.fetch(existing.channelId).catch(() => null);
        const msg = ch ? await ch.messages.fetch(existing.messageId).catch(() => null) : null;
        if (!msg) {
          await SearchMateMessage.deleteOne({ _id: existing._id }).catch(() => {});
          return null;
        }
      } catch {
        await SearchMateMessage.deleteOne({ _id: existing._id }).catch(() => {});
        return null;
      }
      return existing;
    }
    async function launchSearch(interaction, { roleName, gameLabel }) {
      const existing = await getOrCleanExisting(interaction);
      if (existing) {
        return interaction.reply({ content: "Doucement, attends tranquillement ! Prends toi un coca et respire.", ephemeral: true });
      }

      const role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (!role) {
        return interaction.reply({ content: `Je ne trouve pas le rôle **${roleName}**.`, ephemeral: true });
      }

      const expiresAt = new Date(Date.now() + SEARCH_DURATION_MS);
      const expiresUnix = Math.floor(expiresAt.getTime() / 1000);

      const embed = new EmbedBuilder()
        .setTitle('𝐑𝐄𝐂𝐇𝐄𝐑𝐂𝐇𝐄 𝐃𝐄 𝐌𝐀𝐓𝐄 !')
        .setDescription(
          `${role}\n\`${interaction.user.username}\` recherche son mate pour **${gameLabel}** !\n\n` +
          `⏳ **Expire** <t:${expiresUnix}:R>`
        )
        .setColor('Red')
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

      const cancelBtn = new ButtonBuilder()
        .setCustomId(`${CANCEL_PREFIX}${interaction.user.id}`)
        .setLabel("Annuler ma recherche")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(cancelBtn);

      const sent = await interaction.reply({
        embeds: [embed],
        components: [row],
        allowedMentions: { roles: [role.id], users: [] }
      }).then(() => interaction.fetchReply());

      await new SearchMateMessage({
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        messageId: sent.id,
        createdAt: new Date()
      }).save().catch(() => {});

      setTimeout(async () => {
        try {
          const ch = await interaction.client.channels.fetch(sent.channelId).catch(() => null);
          const msg = ch ? await ch.messages.fetch(sent.id).catch(() => null) : null;
          if (msg) await msg.delete().catch(() => {});
        } finally {
          await SearchMateMessage.deleteOne({ userId: interaction.user.id, guildId: interaction.guild.id }).catch(() => {});
        }
      }, SEARCH_DURATION_MS).unref();
    }
    async function handleCancelSearch(interaction) {
      if (!interaction.customId?.startsWith(CANCEL_PREFIX)) return false;

      const authorId = interaction.customId.slice(CANCEL_PREFIX.length);
      const isAuthor = authorId === interaction.user.id;
      const isStaff  = interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages);

      if (!isAuthor && !isStaff) {
        await interaction.deferUpdate().catch(() => {});
        return true;
      }

      await interaction.deferUpdate().catch(() => {});

      try { await interaction.message.delete().catch(() => {}); } catch {}

      await SearchMateMessage.deleteOne({ messageId: interaction.message.id }).catch(() => {});
      await SearchMateMessage.deleteOne({ userId: authorId, guildId: interaction.guild.id }).catch(() => {});

      return true;
    }
    if (interaction.customId === "SEARCHMATE_APEX_BUTTON") {
      await launchSearch(interaction, { roleName: "Apex Legends", gameLabel: "Apex Legends" });
    }
    if (interaction.customId === "SEARCHMATE_COD_BUTTON") {
      await launchSearch(interaction, { roleName: "Call of Duty", gameLabel: "Call of Duty" });
    }
    if (interaction.isButton() && interaction.customId.startsWith(CANCEL_PREFIX)) {
      await handleCancelSearch(interaction);
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
    const STATS_BTN_ID    = 'STATS_APEX_BUTTON';
    const MODAL_CUSTOMID = 'APEX_REGISTER_MODAL';
    const INPUT_PLATFORM = 'platform';
    const INPUT_USERNAME = 'gameUsername';
    const imageCache = new Map();

    const CUSTOM_LEGEND_BACKGROUNDS = {
      Alter: "https://i.postimg.cc/WbFwxWb2/602037c32b79-alter-is-already-causing-chaos-in-apex-legends.jpg",
      Conduit: "https://i.postimg.cc/FsdVwWsK/Conduit-Apex-Legends-2.jpg",
      Ballistic: "https://i.postimg.cc/BQLBRYQ6/1312497.jpg",
      Catalyst: "https://i.postimg.cc/yYgy2QY1/images.jpg",
      Sparrow: "https://i.postimg.cc/SN2fHTNx/120932295.avif"
    };

    function getRankColor(rank) {
      switch ((rank || '').toLowerCase()) {
        case 'bronze': return '#cd7f32';
        case 'silver': return '#bdc3c7';
        case 'gold': return '#f1c40f';
        case 'platinum': return '#1abc9c';
        case 'diamond': return '#3498db';
        case 'master': return '#9b59b6';
        case 'predator': return '#e74c3c';
        default: return '#95a5a6';
      }
    }
    function normalizePlatform(raw) {
      const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
      if (['pc', 'steam', 'origin'].includes(s)) return 'PC';
      if (['ps', 'psn', 'ps4', 'ps5', 'playstation'].includes(s)) return 'PS4';
      if (['xbox', 'xb', 'xone', 'x1', 'xseries', 'seriesx', 'seriesxs'].includes(s)) return 'X1';
      if (['switch', 'ns', 'nintendo', 'nsw'].includes(s)) return 'SWITCH';
      return null;
    }
    function getRankThumbnail(rankName = '') {
      switch (rankName.toLowerCase()) {
        case 'bronze':   return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_bronze_rs15.png';
        case 'silver':   return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_silver_rs7.png';
        case 'gold':     return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_gold_rs7.png';
        case 'platinum': return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_platinum_rs7.png';
        case 'diamond':  return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_diamond_rs7.png';
        case 'master':   return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_master_rs7.png';
        case 'predator': return 'https://apexlegendsstatus.com/assets/badges/badges_new/you_re_tiering_me_apart_apex_predator_rs7.png';
        default: return null;
      }
    }
    function stylizeFirstLetter(text = '') {
      const map = { A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙' };
      if (!text) return text;
      return map[text[0].toUpperCase()]
        ? map[text[0].toUpperCase()] + text.slice(1)
        : text;
    }
    async function loadCachedImage(url) {
      if (!url) return null;
      if (imageCache.has(url)) return imageCache.get(url);

      try {
        const img = await loadImage(url);
        imageCache.set(url, img);
        return img;
      } catch {
        return null;
      }
    }
    const ROMAN_DIV = {
      1: "I",
      2: "II",
      3: "III",
      4: "IV"
    };
    function drawStaticLightning(ctx, x, y, height, baseColor) {
      function lightenColor(hex, percent = 60) {
        const num = parseInt(hex.replace("#", ""), 16);
        let r = (num >> 16) + percent;
        let g = ((num >> 8) & 0xff) + percent;
        let b = (num & 0xff) + percent;

        r = Math.min(255, r);
        g = Math.min(255, g);
        b = Math.min(255, b);

        return `rgb(${r},${g},${b})`;
      }

      const color = baseColor.startsWith("#")
        ? lightenColor(baseColor)
        : baseColor;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4 + Math.random() * 0.6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      ctx.beginPath();

      let cx = x;
      let cy = y;
      ctx.moveTo(cx, cy);

      const segments = 6 + Math.floor(Math.random() * 3);
      const maxOffset = 12;

      for (let i = 0; i < segments; i++) {
        cx += (Math.random() - 0.5) * maxOffset;
        cy += height / segments;
        ctx.lineTo(cx, cy);
      }

      ctx.stroke();

      ctx.shadowBlur = 0;
    }
    async function getLegendBackground(data) {
      const assets = data?.legends?.selected?.ImgAssets || {};
      const legendName = data?.legends?.selected?.LegendName;

      const apiUrl =
        assets.banner ||
        assets.background ||
        assets.card ||
        assets.icon ||
        null;

      if (apiUrl) {
        const img = await loadCachedImage(apiUrl);
        if (img) return img;
      }

      if (legendName && CUSTOM_LEGEND_BACKGROUNDS[legendName]) {
        const img = await loadCachedImage(
          CUSTOM_LEGEND_BACKGROUNDS[legendName]
        );
        if (img) return img;
      }

      if (CUSTOM_LEGEND_BACKGROUNDS.default) {
        return await loadCachedImage(CUSTOM_LEGEND_BACKGROUNDS.default);
      }

      return null;
    }
    if (interaction.isButton() && interaction.customId === STATS_BTN_ID) {
      const discordId = interaction.user.id;
      const user = await ApexStats.findOne({ discordId });

      if (!user) {
        const modal = new ModalBuilder()
          .setCustomId(MODAL_CUSTOMID)
          .setTitle('Apex Legends — Enregistrement');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(INPUT_PLATFORM)
              .setLabel('Plateforme (PC / PS / XBOX / SWITCH)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(INPUT_USERNAME)
              .setLabel('Identifiant en jeu')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

        return interaction.showModal(modal);
      }

      await fetchAndReplyApexStats(interaction, user);
    }

    if (interaction.isModalSubmit() && interaction.customId === MODAL_CUSTOMID) {
      const platform = normalizePlatform(
        interaction.fields.getTextInputValue(INPUT_PLATFORM)
      );

      if (!platform) {
        return interaction.reply({
          content: "Plateforme invalide (**PC / PS / XBOX / SWITCH**)",
          ephemeral: true
        });
      }

      const user = await ApexStats.findOneAndUpdate(
        { discordId: interaction.user.id },
        {
          $set: {
            discordId: interaction.user.id,
            username: interaction.user.username,
            platform,
            gameUsername: interaction.fields.getTextInputValue(INPUT_USERNAME)
          }
        },
        { upsert: true, new: true }
      );
      await fetchAndReplyApexStats(interaction, user);
    }
    async function fetchAndReplyApexStats(interaction, user) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }

      try {
        const { data } = await axios.get(
          "https://api.mozambiquehe.re/bridge",
          {
            params: {
              auth: config.apex_api,
              player: user.gameUsername,
              platform: user.platform
            },
            timeout: 12000
          }
        );

        const rankData = data?.global?.rank || {};
        const currentRp = Number(rankData.rankScore) || 0;
        const rankName  = rankData.rankName || "Unranked";
        const rankDiv   = Number(rankData.rankDiv) || null;
        const legend    = data?.legends?.selected?.LegendName ?? "—";
        const legendImg = await getLegendBackground(data);

        const avatarURL = interaction.user.displayAvatarURL({ extension: "png", size: 64 });
        const avatarImg = await loadCachedImage(avatarURL);

        const now = new Date();

        let diff = 0;
        if (typeof user.lastRankScore === "number") {
          diff = currentRp - user.lastRankScore;
          if (Math.abs(diff) > 3000) diff = 0;
        }

        if (diff !== 0) {
          user.dailyRpGained  += diff;
          user.weeklyRpGained += diff;
        }

        user.lastRankScore  = currentRp;
        user.lastActivityAt = now;
        user.server ||= interaction.guild?.name || "Unknown";
        await user.save();

        const RANK_TABLE = {
          Rookie:   { base: 0,    step: 250 },
          Bronze:   { base: 1000, step: 500 },
          Silver:   { base: 3250, step: [500, 500, 500, 750] },
          Gold:     { base: 5500, step: 750 },
          Platinum: { base: 8500, step: [750, 750, 1000, 1000] },
          Diamond:  { base: 12000,step: 1000 },
          Master:   { base: 16000,step: null }
        };

        let divisionBase = 0;
        let divisionSize = 1;
        const rankCfg = RANK_TABLE[rankName];

        if (rankCfg && rankDiv) {
          if (Array.isArray(rankCfg.step)) {
            divisionBase = rankCfg.base;
            for (let i = 4; i > rankDiv; i--) {
              divisionBase += rankCfg.step[4 - i];
            }
            divisionSize = rankCfg.step[4 - rankDiv];
          } else {
            divisionBase = rankCfg.base + (4 - rankDiv) * rankCfg.step;
            divisionSize = rankCfg.step;
          }
        }

        const rpInDiv  = Math.max(0, currentRp - divisionBase);
        const progress = Math.min(rpInDiv / divisionSize, 1);

        const badgeImg = await loadCachedImage(getRankThumbnail(rankName));
        const rankColor = getRankColor(rankName);

        const canvas = createCanvas(1100, 280);
        const ctx = canvas.getContext("2d");

        if (legendImg) {
          ctx.filter = "blur(4px)";
          ctx.drawImage(legendImg, 0, 0, 1100, 280);
          ctx.filter = "none";
        } else {
          ctx.fillStyle = "#0e1116";
          ctx.fillRect(0, 0, 1100, 280);
        }

        const vignette = ctx.createRadialGradient(550, 140, 180, 550, 140, 520);
        vignette.addColorStop(0, "rgba(0,0,0,0.25)");
        vignette.addColorStop(1, "rgba(0,0,0,0.75)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1100, 280);

        const avatarSize = 32;
        const avatarX = 50;
        const avatarY = 30;

        if (avatarImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();

          ctx.strokeStyle = rankColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.font = "bold 36px FalconMath";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(stylizeFirstLetter(user.gameUsername), avatarX + avatarSize + 14, 55);

        ctx.font = "22px FalconMath";
        ctx.fillStyle = "#e0e6f0";
        ctx.fillText(`𝐋égende : ${stylizeFirstLetter(legend)}`, 50, 100);

        ctx.font = "bold 26px FalconMath";
        ctx.fillStyle = rankColor;
        ctx.fillText(
          `${rankName}${rankDiv ? ` ${ROMAN_DIV[rankDiv]}` : ""}`,
          50,
          138
        );

        ctx.font = "20px FalconMath";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`RP : ${currentRp.toLocaleString("fr-FR")}`, 50, 170);

        if (user.dailyRpGained !== 0) {
          ctx.fillStyle = user.dailyRpGained > 0 ? "#2ecc71" : "#e74c3c";
          ctx.fillText(
            `${user.dailyRpGained > 0 ? "+" : ""}${user.dailyRpGained.toLocaleString("fr-FR")} RP aujourd’hui`,
            50,
            200
          );
        }

        const barX = 50, barY = 230, barW = 520, barH = 22;

        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, barH / 2);
        ctx.fill();

        if (progress > 0) {
          const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
          grad.addColorStop(0, rankColor);
          grad.addColorStop(1, "rgba(255,255,255,0.85)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(barX, barY, Math.max(barH, barW * progress), barH, barH / 2);
          ctx.fill();
        }

        if (rpInDiv > 0 && progress > 0) {
          const count = Math.min(10, Math.max(1, Math.ceil(progress * 10)));
          const usable = barW * progress;

          for (let i = 0; i < count; i++) {
            const x = barX + 10 + Math.random() * (usable - 20);
            drawStaticLightning(ctx, x, barY + 3, barH - 6, rankColor);
          }
        }

        ctx.font = "16px FalconMath";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(
          `${rpInDiv.toLocaleString("fr-FR")} / ${divisionSize.toLocaleString("fr-FR")} RP`,
          barX + barW - 12,
          barY + barH / 2
        );
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";

        if (badgeImg) {
          ctx.save();
          ctx.shadowColor = rankColor;
          ctx.shadowBlur = 28;
          ctx.drawImage(badgeImg, 920, 42, 140, 140);
          ctx.restore();
        }

        if (user.weeklyRpGained !== 0) {
          ctx.font = "18px FalconMath";
          ctx.fillStyle = user.weeklyRpGained > 0 ? "#2ecc71" : "#e74c3c";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 6;
          ctx.fillText(
            `${user.weeklyRpGained > 0 ? "+" : ""}${user.weeklyRpGained.toLocaleString("fr-FR")} RP semaine`,
            990,
            205
          );
          ctx.shadowBlur = 0;
          ctx.textAlign = "left";
        }

        await interaction.editReply({
          files: [{ attachment: canvas.toBuffer("image/png"), name: "apex-rank.png" }]
        });

      } catch (err) {
        console.error("[APEX PNG]", err);
        await interaction.editReply({
          content: "❌ Erreur lors de la récupération des stats Apex."
        });
      }
    }

    // Bouton statistique Call of Duty
    if (interaction.customId === 'STATS_COD_BUTTON') {
      await interaction.reply({ content: "Ceci n'est malheuresement pas encore disponible.", ephemeral: true });
    }

    if (interaction.channel === null) return;
    if (!interaction.isCommand()) return;
    if (!bot.commands.has(interaction.commandName)) return;

    const TIMEOUT_MS = 5000;
    const timeout = setTimeout(async () => {
      if (interaction.deferred || interaction.replied) return;

      try {
        await interaction.reply({
          content: "**L'exécution de la commande prend plus de temps que prévu. Merci de patienter...**",
          ephemeral: true,
        });
      } catch (_) {}
    }, TIMEOUT_MS);

    try {
      await bot.commands.get(interaction.commandName).execute(interaction, bot);
    } catch (error) {
      console.error(error);
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: "**Une erreur est survenue lors de l'exécution de la commande -> contacte `tbmpqf`.**",
            ephemeral: true,
          });
        } else {
          await interaction.followUp({
            content: "**Une erreur est survenue lors de l'exécution de la commande -> contacte `tbmpqf`.**",
            ephemeral: true,
          });
        }
      } catch (_) {}
    } finally {
      clearTimeout(timeout);
    }
  }
  },
};

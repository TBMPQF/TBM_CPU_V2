const {
  ActionRowBuilder,
  PermissionsBitField,
  ButtonBuilder,
  EmbedBuilder,
  ChannelType,
  ButtonStyle,
  Embed, Discord
} = require("discord.js");
const mongoose = require("mongoose");
const config = require("../config");
const User = require("../models/experience");
const levelUp = require("../models/levelUp");
const interactionSetConfig = require("./interactionsetconfig");
const ServerRole = require("../models/serverRole");
const axios = require('axios');
const {
  logRequestMessageIds,
  welcomeRequestMessageIds,
  reglementRequestMessageIds,
  RolereglementRequestMessageIds,
  RoleWelcomeRequestMessageIds,
  implicationRequestMessageIds,
  dailyRequestMessageIds,
  suggestionsRequestMessageIds,
  roleChannelRequestMessageIds,
  ticketRequestMessageIds,
  RoleAdminRequestMessageIds,
} = require("../models/shared");
const ServerConfig = require("../models/serverConfig");
const ytdl = require("ytdl-core");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
} = require("@discordjs/voice");
const { queue } = require("../models/queue");
const SearchMateMessage = require('../models/apexSearchMate');
const VocalChannel = require('../models/apexVocal');
const ApexStats = require('../models/apexStats');
const Music = require("../models/music")

mongoose.connect(config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const usersVoted = new Map();

module.exports = {
  name: "interactionCreate",
  async execute(interaction, bot) {
    // Bouton Daily, pour récupérer son bonus quotidien.
    if (interaction.customId === "DAILYXP") {
      const user = await User.findOne({
        serverID: interaction.guild.id,
        userID: interaction.user.id,
      });

      if (!user) {
        return interaction.reply({
          content:
            "Avant de vouloir récupérer ton bonus, ne veux-tu pas d'abord faire un peu connaissance avec tes nouveaux camarades ?",
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
      if (user.consecutiveDaily % SPECIAL_DAILY_STREAK === 0) {
          const specialChannel = interaction.guild.channels.cache.get('717144491525406791');
          if (specialChannel) {
              specialChannel.send(`𝐅élicitations à **${interaction.user.username}** pour avoir atteint \`${user.consecutiveDaily}\` jours __consécutifs__ de bonus quotidien ! 🎉`)
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
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !`;
      } else if (resetConsecutiveDaily) {
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !\n\n 𝐌ais tu as __perdu__ toute tes flammes \`1\`. :fire:\n 𝐓on ancien record est de \`${user.maxDaily}\`.`;
      } else if (user.consecutiveDaily === 1) {
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !`;
      } else {
        dailyMessage = `丨𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !\n\n 𝐓u es en **feu** \`${user.consecutiveDaily}\`. :fire:\n 𝐓on record est de \`${user.maxDaily}\`.`;
      }

      user.lastDaily = now;

      const dailyEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(dailyMessage)
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setFooter({
          text: `丨`
        })
        .setTimestamp();

      let components = [];

      if (resetConsecutiveDaily == true && lastClaim != null) {
        const RécupDailyrow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("RECUPDAILY_BUTTON")
            .setEmoji("💨")
            .setLabel("丨Rattraper mon 𝐃aily")
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

      const costXP = calculateCostXP(user.lostConsecutiveDaily);
      const malus = calculateMalus(user.lostConsecutiveDaily);
      const malusDuration = calculateMalusDuration(user.lostConsecutiveDaily);

      if (user.xp >= costXP) {
        const confirmMessage = `丨𝐓u veux vraiment récupérer ton __𝐃aily__ ? Tu avais une série de \`${
          user.lostConsecutiveDaily
        }.\`\n Ça te coutera \`${costXP.toLocaleString()}\` 𝐗p et tu auras un malus de \`${malus}\` 𝐗p pour \`${malusDuration}\` jour(s) sur tes prochains __𝐃aily__.`;

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
          content: `丨𝐓u n'as pas assez d'𝐗p pour rattraper ton __bonus quotidien__. Tu as besoin de \`${costXP.toLocaleString()}\` 𝐗p minimum et tu as uniquement \`${user.xp.toLocaleString()}\` 𝐗p disponible.`,
          ephemeral: true,
        });
      }
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

      const storedConsecutiveDaily = user.lostConsecutiveDaily || 0;
      const costXP = calculateCostXP(storedConsecutiveDaily);
      const malus = calculateMalus(storedConsecutiveDaily);
      const malusDuration = calculateMalusDuration(storedConsecutiveDaily);

      if (user.xp >= costXP) {
        user.xp -= costXP;
        user.consecutiveDaily = user.lostConsecutiveDaily;
        user.lostConsecutiveDaily = 0;
        user.malusDaily = malus;
        user.malusDuration = malusDuration;
        user.lastDaily = new Date(Date.now());
        await user.save();

        await interaction.reply({
          content: `丨𝐓u as rattrapé ton __𝐃aily__ pour seulement \`${costXP.toLocaleString()}\` 𝐗p. Tes copains ne diront plus que tu es un rat ! Par contre.. __Un malus__ de \`${malus}\` a été appliqué pour \`${malusDuration} jour(s)\`.`,
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
      return interaction.reply({
        content:
          "丨𝐓u as décidé de ne pas récupérer ton __𝐃aily__. Quelle audace ! N'oublie pas -> **ce qui ne te tue pas, te rend plus fort**... ou pas ! 😅",
        ephemeral: true,
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
          } else if (choice == "FOREST") {
            const roleID = "1078754580113920020";
            handleRole(interaction, member, roleID, "Sons of The Forest");
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

    // Gestion de la musique
    let connections = {};
    let playerIdleHandlerAttached = false;
    const player = createAudioPlayer();
    let updateInterval;
    async function handleVoiceChannel(interaction, notInChannelMessage) {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        await sendAndDeleteMessage(interaction, notInChannelMessage, 5000);
        return null;
      }
      return voiceChannel;
    }
    if (interaction.customId === "PLAY_MUSIC") {
      const voiceChannel = await handleVoiceChannel(
        interaction,
        ":microphone2:丨𝐓u dois être dans un salon vocal pour lancer la playlist !"
      );
      if (!voiceChannel) return;

      const serverId = interaction.guild.id;

      if (!queue[serverId] || queue[serverId].length === 0) {
        await sendAndDeleteMessage(
          interaction,
          ":snowflake:丨𝐋a playlist est actuellement vide.",
          5000
        );
        return;
      }

      connections[serverId] = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      await playNextSong(interaction, serverId, player, queue);

      await sendAndDeleteMessage(
        interaction,
        ":saxophone:丨𝐉e lance la musique poulet !",
        5000
      );
    }
    async function playNextSong(interaction, serverId, player, queue) {
      if (!queue[serverId] || queue[serverId].length === 0) {
          if (connections[serverId]) {
              connections[serverId].destroy();
              delete connections[serverId];
          }
          return;
      }
      const song = queue[serverId][0];
      queue[serverId].startTime = Date.now();
      try {
          const stream = ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio' });
          stream.on('error', error => {
              console.error(`Erreur lors de la lecture de la musique : ${error.message}`);
              queue[serverId].shift();
              playNextSong(interaction, serverId, player, queue);
          });
  
          const resource = createAudioResource(stream);
          player.play(resource);
          connections[serverId].subscribe(player);
  
      } catch (error) {
          console.error(`Erreur lors de la création du flux de musique : ${error.message}`);
          queue[serverId].shift();
          playNextSong(interaction, serverId, player, queue);
      }
      if (!playerIdleHandlerAttached) {
        player.on('idle', async () => { 
          clearInterval(updateInterval);
            if (queue[serverId] && queue[serverId].length > 0) {
                queue[serverId].shift(); 
                await updateMusicEmbed(interaction, serverId, queue);
                playNextSong(interaction, serverId, player, queue);
            } else {
                if (connections[serverId]) {
                    connections[serverId].destroy();
                    delete connections[serverId];
                }
            }
        });
        playerIdleHandlerAttached = true;
    
      }
      if (updateInterval) clearInterval(updateInterval);
      updateInterval = setInterval(async () => {
          await updateMusicEmbed(interaction, serverId, queue);
      }, 10000);
    }
    async function updateMusicEmbed(interaction, serverId, queue) {
      try {
        const musicEntry = await Music.findOne({ serverId });
        if (!musicEntry) {
          console.error('Music entry not found in the database');
          return;
        }
        const messageId = musicEntry.messageId;
        await updateEmbedMessage(interaction, serverId, queue, messageId);
      } catch (error) {
        console.error('Error in updateMusicEmbed:', error);
      }
    }
    async function updateEmbedMessage(interaction, serverId, queue, messageId) {
      try {
        const musicEntry = await Music.findOne({ serverId });
        if (!musicEntry || !musicEntry.channelId) {
          console.error('Entrée musicale ou channelId non trouvée dans la base de données pour le serveur:', serverId);
          return;
        }
    
        const channel = await interaction.guild.channels.fetch(musicEntry.channelId);
        const message = await channel.messages.fetch(messageId).catch(console.error);
    
        if (!message) {
          console.error("Le message à mettre à jour n'a pas été trouvé ou une erreur s'est produite lors de la récupération:", messageId);
          return;
        }
    
        let playlistText = "";
        for (let i = 0; i < queue[serverId].length; i++) {
          let title = queue[serverId][i].title;
          title = title.replace(/ *\([^)]*\) */g, "");
          title = title.replace(/ *\[[^\]]*] */g, "");
          const song = queue[serverId][i];
          if (i === 0) {
            playlistText += `\`${i + 1}\`丨**${song.title}**\n`;
          } else {
            playlistText += `\`${i + 1}\`丨${song.title}\n`;
          }
        }
        if (playlistText.length > 4096) playlistText = playlistText.substring(0, 4093) + '...';
        const currentTime = Date.now();
        const elapsedTime = currentTime - queue[serverId].startTime;
        const song = queue[serverId][0];
        const progress = Math.min(elapsedTime / song.duration, 1);
        const progressBar = generateProgressBar(progress, 10);
        const newFooterText = `Progression : [${progressBar}] - ${bot.guilds.cache.get(serverId).name}`;
    
        const newEmbed = new EmbedBuilder()
          .setColor("Purple")
          .setTitle(`――――――――∈ \`MUSIQUES\` ∋――――――――`)
          .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
          .setDescription(playlistText.length === 0 ? "**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouté dans la playlist." : playlistText)
          .setFooter({
            text: newFooterText,
            iconURL: bot.guilds.cache.get(serverId).iconURL(),
          });

        await message.edit({ embeds: [newEmbed] });
      } catch (error) {
        console.error('Erreur dans la fonction updateEmbedMessage:', error);
      }
    }
    function generateProgressBar(progress, length) {
      const position = Math.round(length * progress);
      let bar = '';
      for (let i = 0; i < length; i++) {
          bar += i === position ? '🔘' : '━';
      }
      return bar;
    }
    async function sendAndDeleteMessage(interaction, description, delay) {
      try {
        const msg = await interaction.reply({
          embeds: [{ description, color: 0x800080 }],
          fetchReply: true,
        });
        setTimeout(() => msg.delete().catch(console.error), delay);
      } catch (error) {
        console.error('Erreur dans la fonction sendAndDeleteMessage :', error);
      }
    }
    //Arrêter la musique
    if (interaction.customId === "STOP_MUSIC") {
      const serverId = interaction.guild.id;
  
      // Arrêter le lecteur audio si la file d'attente existe
      if (queue[serverId] && queue[serverId].length > 0) {
          player.stop();
      }
  
      // Vider la file d'attente
      queue[serverId] = [];
  
      // Détruire la connexion si elle existe
      if (connections[serverId]) {
          connections[serverId].destroy();
          delete connections[serverId];
      }
  
      // Mettre à jour l'embed pour refléter que la playlist est vide
      await updateMusicEmbed(interaction, serverId, queue);
  
      // Envoyer une réponse pour confirmer l'arrêt de la musique
      const stopMsg = await interaction.reply({
          embeds: [{
              description: ":no_entry_sign:丨La musique a été arrêtée et la playlist est vide.",
              color: 0x800080,
          }],
      });
      setTimeout(() => stopMsg.delete(), 5000);
    }
    // Passe à la musique suivante de la playlist
    if (interaction.customId === "NEXT_MUSIC") {
      const voiceChannel = await handleVoiceChannel(
        interaction,
        ":microphone2:丨𝐓u dois être dans un salon vocal pour passer à la prochaine musique !"
      );
      if (!voiceChannel) return;

      const serverId = interaction.guild.id;

      if (!queue[serverId] || queue[serverId].length === 0) {
        sendAndDeleteMessage(
          interaction,
          ":snowflake:丨𝐈l n'y a pas d'autre chanson dans la playlist après celle-là.",
          5000
        );
        return;
      }

      if (!connections[serverId]) {
        sendAndDeleteMessage(
          interaction,
          ":x:丨𝐉e ne suis pas connecté à un salon vocal.",
          5000
        );
        return;
      }

      const player = createAudioPlayer();
      playNextSong(interaction, serverId, player, queue);

      sendAndDeleteMessage(
        interaction,
        ":next_track:丨𝐉'ai passé à la prochaine musique !",
        5000
      );
    }

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
              "Tu as déjà validé le règlement, quelque chose à te reprocher peut-être ?? :thinking:",
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

      let permissionOverwrites = [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user,
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
          "⚠丨__**Attention**__丨Le rôle d'administrateur __n'est pas__ défini pour la gestion des tickets. Un modérateur vient d'être contacté pour traité le problème dans les plus bref délais, désolé de l'attente."
        );
      }

      await interaction.editReply({
        content: "Ticket créé avec succès !",
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

    // Boutton suggestion
    if (interaction.customId === "ACCEPTSUGG") {
      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });

      if (!serverConfig || !serverConfig.logChannelID) {
        return;
      }

      const messageVotes = usersVoted.get(interaction.message.id) || new Map();

      if (messageVotes.has(interaction.user.id)) {
        const previousVote = messageVotes.get(interaction.user.id);
        const alreadyVotedMessage =
          previousVote === "ACCEPTSUGG"
            ? "Eh non! Tu as déjà voté `POUR` à cette suggestion !"
            : "Eh non! Tu as déjà voté `CONTRE` à cette suggestion !";

        await interaction.reply({
          content: alreadyVotedMessage,
          ephemeral: true,
        });
        return;
      }

      messageVotes.set(interaction.user.id, interaction.customId);
      usersVoted.set(interaction.message.id, messageVotes);

      const embed = interaction.message.embeds[0];
      const indexToUpdate = interaction.customId === "ACCEPTSUGG" ? 1 : 2;

      const newFieldValue = parseInt(embed.fields[indexToUpdate].value) + 1;
      embed.fields[indexToUpdate].value = newFieldValue.toString();

      const updatedEmbed = new EmbedBuilder()
        .setColor(embed.color)
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(embed.fields);

      await interaction.message.edit({ embeds: [updatedEmbed] });

      await interaction.reply({
        content: `**Merci. Ton vote à bien été pris en compte. N'hésite surtout pas à commenter ton choix dans le __fil__ de la suggestion. :bulb:**`,
        ephemeral: true,
      });

      const ACCEPTSUGGLOG = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(
          `:ok:丨𝐕ient de réagir __positivement__ à la suggestion :\n\n\`"${embed.description}"\`.`
        )
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      const logChannel = bot.channels.cache.get(serverConfig.logChannelID);
      logChannel.send({ embeds: [ACCEPTSUGGLOG] });
    }
    if (interaction.customId === "NOPSUGG") {
      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });

      if (!serverConfig || !serverConfig.logChannelID) {
        return;
      }

      const messageVotes = usersVoted.get(interaction.message.id) || new Map();

      if (messageVotes.has(interaction.user.id)) {
        const previousVote = messageVotes.get(interaction.user.id);
        const alreadyVotedMessage =
          previousVote === "ACCEPTSUGG"
            ? "Eh non! Tu as déjà voté `POUR` à cette suggestion !"
            : "Eh non! Tu as déjà voté `CONTRE` à cette suggestion !";

        await interaction.reply({
          content: alreadyVotedMessage,
          ephemeral: true,
        });
        return;
      }

      messageVotes.set(interaction.user.id, interaction.customId);
      usersVoted.set(interaction.message.id, messageVotes);

      const embed = interaction.message.embeds[0];
      const indexToUpdate = interaction.customId === "ACCEPTSUGG" ? 1 : 2;

      const newFieldValue = parseInt(embed.fields[indexToUpdate].value) + 1;
      embed.fields[indexToUpdate].value = newFieldValue.toString();

      const updatedEmbed = new EmbedBuilder()
        .setColor(embed.color)
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(embed.fields);

      await interaction.message.edit({ embeds: [updatedEmbed] });

      await interaction.reply({
        content: `**Merci. Ton vote à bien été pris en compte. N'hésite surtout pas à commenter ton choix dans le __fil__ de la suggestion. :bulb:**`,
        ephemeral: true,
      });

      const NOPSUGGLOG = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(
          `:x:丨𝐕ient de réagir __négativement__ à la suggestion :\n\n\`"${embed.description}"\`.`
        )
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      const logChannel = bot.channels.cache.get(serverConfig.logChannelID);
      logChannel.send({ embeds: [NOPSUGGLOG] });
    }

    //Gestion du SetConfig
    if (interaction.customId === "LOG_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon de `𝐋og` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      logRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "ROLES_LISTE") {
      const serverRoles = await ServerRole.findOne({
        serverID: interaction.guild.id,
      });

      const rowRolesListe = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ROLES_PERSOLISTE")
          .setEmoji("🖌️")
          .setLabel("Modifié les rôles")
          .setStyle(ButtonStyle.Secondary)
      );

      if (!serverRoles) {
        return interaction.reply({
          content: "Il n'y a pas de rôles stockés pour ce serveur.",
          components: [rowRolesListe],
        });
      }

      const levels = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

      const prestige0Roles = serverRoles.prestige0Roles
        .map(
          (id, index) =>
            `Niveau ${levels[index]} | ${
              interaction.guild.roles.cache.get(id)?.toString() ||
              "Rôle inconnu"
            }`
        )
        .join("\n");
      const prestige1Roles = serverRoles.prestige1Roles
        .map(
          (id, index) =>
            `Niveau ${levels[index]} | ${
              interaction.guild.roles.cache.get(id)?.toString() ||
              "Rôle inconnu"
            }`
        )
        .join("\n");

      const roleEmbed = new EmbedBuilder()
        .setTitle("Liste des Rôles")
        .setColor("#b3c7ff")
        .setDescription(
          `__**Rôles Prestige 0 :**__\n ${prestige0Roles}\n\n__**Rôles Prestige 1 :**__\n ${prestige1Roles}`
        );

      interaction.reply({ embeds: [roleEmbed], components: [rowRolesListe] });
    }
    if (interaction.customId === "ROLES_PERSOLISTE") {
      let currentPrestige = "prestige0Roles";
      await interaction.reply(
        "Veuillez **répondre** avec les rôles personnalisés pour le prestige `0` (Niveau avant le prestige `1`). Vous pouvez entrer jusqu'à 12 rôles, séparés par des virgules. (123456789, 123456789 etc ... )"
      );

      const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        time: 60000,
      });

      collector.on("collect", async (m) => {
        const roles = m.content.split(",").map((role) => role.trim());

        if (roles.length > 12) {
          interaction.followUp(
            "Vous avez entré trop de rôles. Veuillez entrer jusqu'à 12 rôles __maximum__."
          );
          return;
        }

        const rolesInGuild = interaction.guild.roles.cache.map(
          (role) => role.id
        );
        const rolesExist = roles.every((role) => rolesInGuild.includes(role));

        if (!rolesExist) {
          interaction.followUp(
            "Un ou plusieurs rôles que vous avez entrés n'existent pas sur ce serveur. Veuillez vérifier les ID's des rôles et réessayer."
          );
          return;
        }

        let server = await ServerRole.findOne({
          serverID: interaction.guild.id,
        });

        if (!server) {
          server = new ServerRole({
            serverID: interaction.guild.id,
            serverName: interaction.guild.name,
            prestige0Roles: [],
            prestige1Roles: [],
          });
        }
        server[currentPrestige] = roles;
        await server.save();

        if (currentPrestige === "prestige0Roles") {
          interaction.followUp(
            "Rôles pour le prestige `0` enregistrés avec succès ! Veuillez maintenant entrer les rôles pour le prestige `1`. N'oubliez pas, vous pouvez entrer jusqu'à 12 rôles, séparés par des virgules."
          );
          currentPrestige = "prestige1Roles";
        } else {
          interaction.followUp(
            "**Tous les rôles ont été enregistrés avec succès !**"
          );
          collector.stop();
        }
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          interaction.followUp(
            "__**Le temps pour entrer les rôles est écoulé. Veuillez réessayer.**__"
          );
        }
      });
    }
    if (interaction.customId === "WELCOME_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon de `𝐁ienvenue` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      welcomeRequestMessageIds[serverId] = message.id;
    }
    if (interaction.customId === "REGL_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de répondre avec le nom __exact__ ou l'ID du salon de `𝐑èglement` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      reglementRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "REGL_PUSH") {
      let serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
      if (!serverConfig || !serverConfig.reglementChannelID) {
        return interaction.reply({
          content:
            "Aucun salon de 𝐑èglement n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salon`.",
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
          text: `Cordialement l'équipe ${interaction.guild.name}`,
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
    if (interaction.customId === "REGL_ROLE") {
      const message = await interaction.reply({
        content:
          "\n__**N'OUBLIE PAS DE ME METTRE TOUT EN HAUT DANS LA LISTE DE TES RÖLES.**__\n\nMerci de **répondre** en faisant un tag (@votre_rôle) pour donner le rôle lorsque votre utilisateur validera le `𝐑èglement`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      RolereglementRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "WELCOME_ROLE") {
      const message = await interaction.reply({
        content:
          "\n__**N'OUBLIE PAS DE ME METTRE TOUT EN HAUT DANS LA LISTE DE TES RÖLES.**__\n\nMerci de **répondre** en faisant un tag (@votre_rôle) pour donner le rôle lorsque votre utilisateur validera le `𝐑èglement`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      RoleWelcomeRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "IMPLICATION_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon pour `𝐈mplications` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      implicationRequestMessageIds[serverId] = message.id;
    }
    if (interaction.customId === "DAILY_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon pour le `𝐃aily` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      dailyRequestMessageIds[serverId] = message.id;
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
    if (interaction.customId === "SUGG_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon pour les `𝐒uggestions` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      suggestionsRequestMessageIds[serverId] = message.id;
    }
    if (interaction.customId === "ROLECHANNEL_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de répondre avec le nom __exact__ ou l'ID du salon pour les `𝐑oles`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      roleChannelRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "TICKET_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de répondre avec le nom __exact__ ou l'ID du salon pour les `𝐓ickets`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      ticketRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
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
    if (interaction.customId === "TICKET_ROLE") {
      const message = await interaction.reply({
        content:
          "\n__**N'OUBLIE PAS DE ME METTRE TOUT EN HAUT DANS LA LISTE DE TES RÖLES.**__\n\nMerci de **répondre** en faisant un tag (@votre_rôle) pour rentrer le rôle d'administration de votre serveur.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      RoleAdminRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }

    //Bouton suppresion de données dans la bdd pour la réinitialisé
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
      const serverConfig = await ServerConfig.findOne({ serverID: serverID });
    
      if (!serverConfig) {
        console.error('ServerConfig not found for server ID:', serverID);
        return;
      }
    
      serverConfig.roleChannelID = null;
      serverConfig.roleChannelName = null;
    
      try {
        await serverConfig.save();
        await interaction.reply('Le __salon__ des 𝐑ôles a été réinitialisé avec succès !');
      } catch (error) {
        console.error('Error updating ServerConfig:', error);
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

    //Bouton supprimé suggestion
    if (interaction.customId === "SUPPSUGG") {
      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });

      if (!serverConfig || !serverConfig.ticketAdminRoleID) {
        return interaction.reply({
          content:
            "**Action impossible car la configuration du rôle administrateur n'a pas été défini dans le `/setconfig`.**",
          ephemeral: true,
        });
      }

      const member = interaction.guild.members.cache.get(interaction.user.id);
      const adminRole = interaction.guild.roles.cache.get(
        serverConfig.ticketAdminRoleID
      );

      if (!adminRole || !member.roles.cache.has(adminRole.id)) {
        return interaction.reply({
          content:
            "Désolé, mais tu n'as pas la permission d'utiliser ce bouton.",
          ephemeral: true,
        });
      }
      const thread = channel.threads.cache.find((x) => x.name === "food-talk");

      if (interaction.channel.thread) {
        await thread.delete();
      } else {
        await interaction.message.delete();
      }

      return interaction.reply({
        content: "La suggestion et le thread associé ont été supprimés.",
        ephemeral: true,
      });
    }

    //Bouton Classement Général
    if (interaction.customId === "LADDER_BUTTON") {
      const guild = interaction.guild;
      const topUsers = await User.find({ serverID: guild.id })
        .sort({ prestige: -1, xp: -1 })
        .limit(10);

      const leaderboardEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(`Classement du serveur ${guild.name}`)
        .setDescription(
          topUsers
            .map((user, index) => {
              let positionSuffix = "ᵉᵐᵉ";
              let medalEmoji = "";

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

              return `\n**${index + 1}${positionSuffix} ${medalEmoji}** __**${
                bot.users.cache.get(user.userID)?.username ||
                "Utilisateur inconnu"
              }**__ 丨 Prestige: **\`${
                user.prestige
              }\`** - XP: **\`${user.xp.toLocaleString()}\`**`;
            })
            .join("\n")
        )
        .setThumbnail(guild.iconURL({ dynamic: true }));

      await interaction.reply({ embeds: [leaderboardEmbed] });
      setTimeout(async () => {
        const message = await interaction.fetchReply();
        message.delete();
      }, 15000);
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
  },
};

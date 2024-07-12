const {
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonBuilder,
} = require("discord.js");
const User = require("../models/experience");
const levelUp = require("../models/levelUp");
const ServerConfig = require("../models/serverConfig");
const yts = require("yt-search");
const { queue } = require("../models/queue");
const Music = require("../models/music");
const { filterMessage } = require('../automod');
const ytdl = require('ytdl-core');

module.exports = {
  name: "messageCreate",
  async execute(message, bot) {
    if (message.author.bot) return;
    await filterMessage(message);

    //Gestion des messages pour la musique dans le salon musique
    function formatDuration(seconds) {
      const date = new Date(0);
      date.setSeconds(seconds);
      const timeString = date.toISOString().substr(11, 8);
      return timeString.startsWith("00:") ? timeString.substr(3) : timeString;
    }
    if (message.channel.id === "1136327173343559810") {
      const { videos } = await yts.search(message.content);
      if (videos.length == 0) {
        const noResultEmbed = new EmbedBuilder()
          .setColor("Purple")
          .setDescription("Aucun résultat trouvé");
        return message.channel.send({ embeds: [noResultEmbed] }).then((msg) => {
          setTimeout(() => msg.delete(), 5000);
        });
      }

      const songUrl = videos[0].url;
      const videoInfo = await ytdl.getInfo(songUrl);
      const duration = formatDuration(videoInfo.videoDetails.lengthSeconds);
      const serverId2 = message.guild.id;
      if (!queue[serverId2]) {
        queue[serverId2] = [];
      }
      const formattedTitle = videos[0].title.replace(/ *\([^)]*\) */g, "").replace(/ *\[[^\]]*] */g, "");
      queue[serverId2].push({
          url: songUrl,
          title: formattedTitle,
          duration: duration
      });

      const musicEntry = await Music.findOne({ serverId: serverId2 });

      let messageEntry;

      if (musicEntry && musicEntry.messageId) {
        messageEntry = await message.channel.messages.fetch(
          musicEntry.messageId
        );
      }

      const songAddedEmbed = new EmbedBuilder()
        .setColor("Purple")
        .setDescription(
          `"${videos[0].title}" a été ajouté à la liste de lecture.`
        );

      if (messageEntry) {
        const oldEmbed = messageEntry.embeds[0];

        let playlistText = "";
        for (let i = 0; i < queue[serverId2].length; i++) {
          const song = queue[serverId2][i];
          let title = queue[serverId2][i].title;
          const duration = song.duration;
          title = title.replace(/ *\([^)]*\) */g, "");
          title = title.replace(/ *\[[^\]]*] */g, "");

          if (i === 0) {
            playlistText += `\`${i + 1}\`丨**${title}** - \`${duration}\`\n`;
          } else {
            playlistText += `\`${i + 1}\`丨${title}\n`;
          }
        }

        const newEmbed = new EmbedBuilder()
          .setColor("Purple")
          .setTitle(`――――――――∈ \`MUSIQUES\` ∋――――――――`)
          .setThumbnail(
            "https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj"
          )
          .setDescription(playlistText)
          .setFooter({
            text: `Cordialement, l'équipe${message.guild.name}`,
            iconURL: message.guild.iconURL(),
          });

        await messageEntry.edit({ embeds: [newEmbed] });
      } else {
        messageEntry = await message.channel.send({ embeds: [songAddedEmbed] });

        if (musicEntry) {
          musicEntry.messageId = messageEntry.id;
          await musicEntry.save();
        } else {
          await Music.create({
            serverId: serverId2,
            messageId: messageEntry.id,
          });
        }
      }

      message.delete();
    }

    // Expérience pour chaque message
    const now = new Date();

    const userData = {
      userID: message.author.id,
      username: message.author.username,
      serverID: message.guild.id,
      serverName: message.guild.name,
      lastMessageDate: now,
    };

    const member = message.guild.members.cache.get(message.author.id);
    const rolesToCheck = {
      "✨丨𝐄lite 𝐒ecrète": 1.05,
      "🧪丨Twitch Sub T1": 1.1,
      "🧪丨Twitch Sub T2": 1.2,
      "🧪丨Twitch Sub T3": 1.3,
    };

    let rolePercentage = 1;
    let weekendPercentage = 1;

    for (const role of Array.from(member.roles.cache.values())) {
      if (rolesToCheck[role.name]) {
        rolePercentage *= rolesToCheck[role.name];
      }
    }

    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
      weekendPercentage = 1.1;
    }

    let user = await User.findOne({
      userID: message.author.id,
      serverID: message.guild.id,
    });

    if (!user) {
      user = new User(userData);
      
      let initialXP = Math.floor(Math.random() * 50) + 1;
      initialXP *= rolePercentage;
      initialXP *= weekendPercentage;
      initialXP = Math.round(initialXP);
      user.xp = initialXP;
      
      await levelUp(message, user, user.xp);
    } else {
      if (message.guild.name !== user.serverName) {
        user.serverName = message.guild.name;
      }
    }

    const lastMessageDate = user.lastMessageDate || now;
    const timeDifference = (now.getTime() - lastMessageDate.getTime()) / 1000;

    user.messageCount = (user.messageCount || 0) + 1;

    if (timeDifference >= 10) {
      let randomXP = Math.floor(Math.random() * 50) + 1;
      randomXP *= rolePercentage;
      randomXP *= weekendPercentage;

      randomXP = Math.round(randomXP);
      user.xp = (user.xp || 0) + randomXP;

      await levelUp(message, user, user.xp);
    } else {
      user.lastMessageDate = now;
      await user.save();
    }

    user.lastMessageDate = now;

    await user.save();

    //Gestion des suggestions
    const serverConfig = await ServerConfig.findOne({
      serverID: message.guild.id,
    });
    if (!serverConfig || !serverConfig.suggestionsChannelID) {
      return;
    }

    if (message.channel.id !== serverConfig.suggestionsChannelID) {
      return;
    }

    let suggEmbed = new EmbedBuilder()
      .setColor("DarkVividPink")
      .setTitle("丨𝐒uggestion")
      .setDescription(`${message.content}`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields([
        {
          name: "𝐏roposé par :",
          value: message.author ? message.author.toString() : "Auteur inconnu",
          inline: true,
        },
        { name: "𝐏our", value: "0", inline: true },
        { name: "𝐂ontre", value: "0", inline: true },
      ]);

    const buttonY = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("ACCEPTSUGG")
          .setEmoji("✔️")
          .setStyle(ButtonStyle.Success)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("NOPSUGG")
          .setEmoji("✖️")
          .setStyle(ButtonStyle.Danger)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("SUPPSUGG")
          .setEmoji("♻")
          .setStyle(ButtonStyle.Secondary)
      );

    bot.channels.cache
      .get(serverConfig.suggestionsChannelID)
      .send({ embeds: [suggEmbed], components: [buttonY] })
      .then((msg) => {
        msg.startThread({ name: `𝐒uggestion de ${message.author.username}` });
      });

    await message.delete();
  },
};

const {
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonBuilder,
} = require("discord.js");
const User = require("../models/experience");
const levelUp = require("../models/levelUp")

module.exports = {
  name: "messageCreate",
  async execute(message, bot) {
    if (message.author.bot) return;

    const user = await User.findOne({ userID: message.author.id });

    const now = new Date();
    const lastMessageDate = user ? user.lastMessageDate : now;
    const timeDifference = (now.getTime() - lastMessageDate.getTime()) / 1000;

    if (!user) {
      const newUser = new User({
        userID: message.author.id,
        username: message.author.username,
      });

      await newUser.save();
    } else {
      user.messageCount += 1;

      if (timeDifference >= 10) {
        const randomXP = Math.floor(Math.random() * 50) + 1;
        user.xp += randomXP;
        user.lastMessageDate = now;

        await levelUp(message, user, user.xp);
      }

      await user.save();
    }

    const YouTube = require('youtube-sr').default;
    const Queue = require('../models/queue');

    //Gestion des musiques
    if (message.channel.name === "🎶丨𝐌usiques") {
      const songName = message.content;
      const guildId = message.guild.id;
      const queue = Queue.get(guildId) || [];

      YouTube.search(songName, { limit: 1 })
        .then(async results => {
          const song = results[0];
          if (!song || !song.url) {
            return message.reply(`Je ne trouve pas la chanson "${songName}" !`);
          }

          const songUrl = song.url;

          let cleanedTitle = song.title
            .replace(/\[.*?\]/g, '')
            .replace(/\(.*?\)/g, '')
            .trim();

          queue.push({ title: cleanedTitle, url: songUrl });
          Queue.set(guildId, queue);

          message.reply(`La chanson "${cleanedTitle}" a été ajoutée à la file d'attente !`);

          // Récupérer le message de musique
          const musicMessage = await message.channel.messages.fetch(global.musicMessageId);

          // Récupérer l'embed de musique
          const oldEmbed = musicMessage.embeds[0];
          const newEmbed = new EmbedBuilder(oldEmbed);

          // Créer une liste de chansons pour la description
          const songList = queue.map((song, index) => `${index + 1} - ${song.title}`).join("\n");

          // Mettre à jour la description de l'embed avec la nouvelle chanson
          newEmbed.setDescription(`Playlist:\n${songList}`);

          // Mettre à jour le message de musique avec le nouvel embed
          await musicMessage.edit({ embeds: [newEmbed] });
        })
        .catch(console.error);
    }

    //Salon suggestion qui se tranforme à chaque message en embed préparé.
    if (message.channel.id === "1045073140948152371") {
      let suggEmbed = new EmbedBuilder()
        .setColor("DarkVividPink")
        .setTitle("丨𝐒uggestion")
        .setDescription(`${message.content}`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields([
          {
            name: "𝐏roposé par :",
            value: message.author
              ? message.author.toString()
              : "Auteur inconnu",
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
        );

      bot.channels.cache
        .get("1045073140948152371")
        .send({ embeds: [suggEmbed], components: [buttonY] })
        .then((msg) => {
          msg.startThread({ name: `𝐒uggestion de ${message.author.username}` });
        });
      await message.delete();
    }
  },
};
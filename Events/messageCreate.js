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

    const now = new Date();

const userData = {
  userID: message.author.id,
  username: message.author.username,
  serverID: message.guild.id,
  serverName: message.guild.name,
  lastMessageDate: now
};

let user = await User.findOne(
  { userID: message.author.id, serverID: message.guild.id } // conditions
);

if (!user) {
  user = new User(userData);
} else {
  if (message.guild.name !== user.serverName) {
    user.serverName = message.guild.name;
  }
}

const lastMessageDate = user.lastMessageDate || now;
const timeDifference = (now.getTime() - lastMessageDate.getTime()) / 1000;

user.messageCount = (user.messageCount || 0) + 1;

if (timeDifference >= 10) {
  const randomXP = Math.floor(Math.random() * 50) + 1;
  user.xp = (user.xp || 0) + randomXP;

  await levelUp(message, user, user.xp);
}

user.lastMessageDate = now;

await user.save();

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
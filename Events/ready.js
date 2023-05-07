const { ActivityType, EmbedBuilder } = require("discord.js");
const loadSlashCommands = require("../handlers/loaders/loadSlashCommands");
const fetch = require("node-fetch");
const config = require("../config.json")

const MINECRAFT_SERVER_IP = config.serveurMinecraftIP;
const MINECRAFT_SERVER_PORT = config.serveurMinecraftPORT;

const CHANNEL_NAME = "👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒";

module.exports = {
  name: "ready",
  execute(bot, member) {
    console.log(
      "\x1b[33m" + `${bot.user.username} connecté !\n` + "\x1b[33m" + ``
    );

    loadSlashCommands(bot);

    setInterval(async () => {
      const server = bot.guilds.cache.first();
      updateVoiceChannel(server);
    }, 60000);

    //Message de connexion du bot
    const channel = bot.channels.cache.get("838440585341566996");

    channel.messages.fetch({ limit: 100 }).then((messages) => {
      const connectMessages = messages.filter(
        (msg) =>
          msg.author.id === bot.user.id &&
          msg.embeds.length > 0 &&
          msg.embeds[0].description ===
            "**Je viens tout juste de me connecter.**"
      );

      if (connectMessages.size > 0) {
        channel.bulkDelete(connectMessages).then(() => {
          const ConnectOK = new EmbedBuilder()
            .setDescription(`**Je viens tout juste de me connecter.**`)
            .setColor("White")
            .setTimestamp();
          channel.send({ embeds: [ConnectOK] });
        });
      } else {
        const ConnectOK = new EmbedBuilder()
          .setDescription(`**Je viens tout juste de me connecter.**`)
          .setColor("White")
          .setTimestamp();
        channel.send({ embeds: [ConnectOK] });
      }
    });

    // Interval de messages pour le Daily.
    const channelDaily = bot.channels.cache.get("818640158693392405");
    setInterval(() => {
      const DailyInterval = new EmbedBuilder()
        .setDescription(`@here. N'oubliez pas de récupérer votre \`Daily\` ! `)
        .setColor("Red")
        .setFooter({
          text: `丨`,
          iconURL: `${member.user.displayAvatarURL({
            dynamic: true,
            size: 512,
          })}`,
        })
        .setTimestamp();
      channelDaily.send({ embeds: [DailyInterval] });
    }, 43201000);

    const channelId = "818640158693392405";
    const messageIdToKeep = "1087445497742114896";
    setInterval(async () => {
      const channel = await bot.channels.fetch(channelId);
      const messages = await channel.messages.fetch({ limit: 1 });
      messages.forEach(async (msg) => {
        if (msg.id !== messageIdToKeep) {
          await msg.delete();
        }
      });
    }, 43200000);

    //Activité du bot
    bot.user.setPresence({
      activities: [{ name: bot.config.activity, type: ActivityType.Playing }],
      status: "dnd",
    });
  },
};

async function updateVoiceChannel(server) {
  try {
    let channel = server.channels.cache.find((channel) =>
      channel.name.startsWith("👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒")
    );

    if (!channel) {
      channel = await server.channels.create(CHANNEL_NAME, {
        type: 2,
        permissionOverwrites: [
          {
            id: server.roles.everyone,
            deny: ["ViewChannel"],
          },
        ],
      });
    }

    fetch(
      `https://api.mcsrvstat.us/2/${MINECRAFT_SERVER_IP}:${MINECRAFT_SERVER_PORT}`
    )
      .then((response) => {
        if (response.headers.get('content-type') === 'application/json') {
          return response.json();
        } else {
          throw new Error('Invalid JSON response');
        }
      })
      .then((data) => {
        if (data.online) {
          channel.setName(
            `👥丨𝐉𝐎𝐔𝐄𝐔𝐑𝐒 ${data.players.online} / ${data.players.max}`
          );
        } else {
          channel.setName(`👥 Erreur de récupération`);
        }
      })
      .catch((error) => {
        console.error(error);
        channel.setName(`👥 Erreur de récupération`);
      });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du salon vocal:', error);
  }
}
const { EmbedBuilder } = require("discord.js");

module.exports = async (bot) => {
  player.on("error", (queue, error) => {
    console.log(`Erreur émise depuis la file d'attente : ${error.message}`);
  });

  player.on("connectionError", (queue, error) => {
    console.log(`Erreur émise par la connexion : ${error.message}`);
  });

  player.on("trackStart", (queue, track) => {
    if (!bot.config.opt.loopMessage && queue.repeatMode !== 0) return;

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `Musique en cours **\`${track.title}\`** dans **${queue.connection.channel.name}** 🎧`
      );

    queue.metadata.send({ embeds: [Good] }).then((message) => {
      setTimeout(() => message.delete(), 100500);
    });
  });

  player.on("trackAdd", (queue, track) => {
    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `Le titre **${track.title}** as été ajouté dans la file d'attente ✅`
      );

    queue.metadata.send({ embeds: [Good] }).then((message) => {
      setTimeout(() => message.delete(), 10000);
    });
  });

  player.on("botDisconnect", (queue) => {
    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        "J'ai été déconnecté manuellement du canal vocal, en supprimant la file d'attente... ❌"
      );

    queue.metadata.send({ embeds: [Good] }).then((message) => {
      setTimeout(() => message.delete(), 10000);
    });
  });

  player.on("channelEmpty", (queue) => {
    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        "Personne n'est dans le canal vocal, je quitte le canal vocal... ❌"
      );

    queue.metadata.send({ embeds: [Good] }).then((message) => {
      setTimeout(() => message.delete(), 10000);
    });
  });

  player.on("queueEnd", (queue) => {
    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        "J'ai fini de lire toute la file d'attente ✅ Je quitte le canal vocal..."
      );

    queue.metadata.send({ embeds: [Good] }).then((message) => {
      setTimeout(() => message.delete(), 10000);
    });
  });
};

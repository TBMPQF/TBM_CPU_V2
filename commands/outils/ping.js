const Discord = require("discord.js");

function getPingEmoji(ping) {
  if (ping <= 200) {
    return "🟢";
  } else if (ping <= 400) {
    return "🟠";
  } else {
    return "🔴";
  }
}

function getMockLocation() {
  const locations = [
    { city: "Paris", country: "France" },
    { city: "New York", country: "USA" },
    { city: "Tokyo", country: "Japan" },
    { city: "Berlin", country: "Germany" },
    { city: "Sydney", country: "Australia" }
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

module.exports = {
  name: "ping",
  description: "丨𝐀ffiche les latences.",
  longDescription: ` 🎯 **𝐓u as besoin de savoir si la connexion est rapide ?** \n𝐌esure la latence entre toi et notre cher bot, ainsi que le temps de réponse de l'API Discord ! \n\n⚡ **𝐏ourquoi est-ce important ?** Parce qu'un bot rapide, c'est comme un café le matin : ça te réveille et ça te met en forme ! \n\n🌍 **𝐁ien sûr, l'IP et la localisation affichées sont totalement fictives !** Elles ne servent qu'à pimenter l'expérience. \n\n🎉 𝐄lle te permet de vérifier si le bot répond aussi vite qu'un lapin sur un trampoline ! 🐇⛹️‍♂️`,
  dm: false,
  permission: "Aucune",

  async execute(interaction, bot) {
    const startTime = Date.now();
    const APIPing = bot.ws.ping;
    const APIemoji = getPingEmoji(APIPing);

    try {
      await interaction.reply({ content: 'Mesure en cours...', ephemeral: true });
      const userPing = Date.now() - startTime;
      const userEmoji = getPingEmoji(userPing);

      const userLocation = getMockLocation();

      const PingEmbed = new Discord.EmbedBuilder()
        .setColor("#b3c7ff")
        .setTitle("🔍 **𝐒tatistiques de Ping**")
        .addFields(
          { name: "🧑‍💻 𝐓on Ping :", value: `**${userPing} ms** ${userEmoji}`, inline: true },
          { name: "🤖 𝐏ing du Bot :", value: `**${APIPing} ms** ${APIemoji}`, inline: true },
          { name: "📍 𝐋ocalisation :", value: `**${userLocation.city}, ${userLocation.country}**`, inline: true },
          { name: "🔗 𝐀dresse IP :", value: `**192.168.0.${Math.floor(Math.random() * 255) + 1}**`, inline: true },
          { name: "🌐 𝐏rotocole :", value: `**IPv4**`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({
        embeds: [PingEmbed],
      });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande ping :", error);
      await interaction.followUp({ content: "Une erreur est survenue lors de l'exécution de la commande.", ephemeral: true });
    }
  },
};

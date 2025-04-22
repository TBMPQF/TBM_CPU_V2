const Discord = require("discord.js");

module.exports = {
  name: "setconfig",
  description: "丨𝐂onfiguration du Bot.",
  longDescription: ` 𝐂'est ici que tu peux configurer le bot. 𝐓u peux ainsi modifié les messages, les channels de certaines fonctionnalitées, et bien plus !\n𝐍'oublie pas, chaque réglage est crucial pour faire tourner la machine à café et s'assurer que tout fonctionne sans accroc. ☕️\n𝐃ans ce menu, tu trouveras tout ce dont tu as besoin !\n\n𝐁ref, c'est comme une boîte à outils, mais sans les boulons qui traînent partout. 🔧\n𝐐ue ce soit pour un petit ajustement ou une grande transformation, le pouvoir est entre tes mains ! 💪`,
  dm: false,
  permission: 8,

  async execute(interaction) {
    const guild = interaction.guild;

    const configEMBED = new Discord.EmbedBuilder()
      .setColor("#b3c7ff")
      .setTitle("`丨𝐂onfiguration TBM_CPU V2丨`")
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .setDescription(`𝐁ienvenue dans le centre de **configuration du bot** ! \n𝐈ci, tu as le pouvoir de personnaliser chaque détail : modifie les messages, modifie les rôles, choisis les salons pour chaque fonctionnalité, et bien plus ! ⚙️\n\n 𝐅ais-en un bot à ton image, prêt à briller et à rendre ton serveur unique ! 🚀`);

    const SelectMenu = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId("setConfigCustomID")
        .setPlaceholder("𝐐ue veux-tu configurer ?")
        .addOptions(
          {
            label: "丨𝐋og",
            emoji: "📝",
            value: "LOG",
          },
          {
            label: "丨𝐓witch",
            emoji: "🎥",
            value: "TWITCH",
          },
          {
            label: "丨𝐑èglement",
            emoji: "📜",
            value: "REGLEMENT",
          },
          {
            label: "丨𝐑ôles 𝐌enu",
            emoji: "🎭",
            value: "ROLECHANNEL",
          },
          {
            label: "丨𝐖elcome",
            emoji: "👋",
            value: "WELCOME",
          },
          {
            label: "丨𝐈mplications",
            emoji: "🏆",
            value: "IMPLICATION",
          },
          {
            label: "丨𝐒uggestions",
            emoji: "💡",
            value: "SUGGESTION",
          },
          {
            label: "丨𝐃aily",
            emoji: "💵",
            value: "DAILY",
          },
          {
            label: "丨𝐑ôles des 𝐍iveaux",
            emoji: "🧪",
            value: "ROLES",
          },
          {
            label: "丨𝐓icket",
            emoji: "🎫",
            value: "TICKET",
          },
          {
            label: "丨𝐁ingo",
            emoji: "🎱",
            value: "BINGO",
          }
        )
    );
    try {
      await interaction.reply({
        embeds: [configEMBED],
        components: [SelectMenu],
      });
    } catch (err) {
      console.error(err);
    }
  },
};

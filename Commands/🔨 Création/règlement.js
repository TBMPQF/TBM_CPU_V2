const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  name: "règlement",
  description: "丨𝐄nvoi l'embed du règlement.",
  permission: PermissionFlagsBits.ManageGuild,
  dm: false,
  category: "🔨 Création",

  async execute(bot, message, args) {
    const Ticketembed = new Discord.EmbedBuilder()
      .setColor("#b3c7ff")
      .setTitle(
        `*_~𝐑èglement de la ${message.guild.name} pour votre bonne formation~_*`
      )
      .setDescription(
        `\n**Merci de bien vouloir lire toute les règles ainsi que de les respecter !**\n\n:wave:\`丨𝐁ienvenue :\` \nTout d'abord bienvenue parmi nous. Tu peux à présent lire et valider le règlement puis choisir tes rôles dans le salon \`Rôles\`. Si tu es un streamer, tu peux obtenir le rôle \`Streamer\` pour avoir les notifications de TES lives sur notre serveur ! Pour toute demande, informations ou signalement, tu peux ouvrir un ticket dans le \`salon prévu à cet effet\`, un modérateur se fera un plaisir de te répondre.\n\n:rotating_light:\`丨𝐌entions :\`\n Évitez les mentions inutiles et \`réfléchissez\` avant de poser une question. Vous n'êtes pas seuls et les réponses ont souvent déjà été données. Il sera punissable d'une \`exclusion\` et/ou d'un \`bannissement\` avec sursis.\n\n:warning:\`丨𝐏ublicités :\`\n Toute publicité \`non autorisé\` par un membre du staff est \`strictement interdite\` sur le serveur mais également par message privé. Il sera punissable d'une \`exclusion\` et/ou d'un \`bannissement\` avec sursis.\n\n:underage:\`丨𝐍SFW :\`\nNSFW, NSFL et le contenu malsain n'est \`pas autorisé\` sur le serveur. Il sera punissable d'un \`bannissement\` !\n\n:flag_fr:\`丨𝐅rançais :\`\nLa structure est \`francophone\`, veuillez donc écrire français uniquement pour une compréhension facile de tous les membres de la communauté. Il sera punissable si les avertissements sont répétés et non écoutés.`
      )
      .setThumbnail(message.guild.iconURL())
      .setFooter({
        text: `Cordialement l'équipe ${message.guild.name}`,
        iconURL: message.guild.iconURL(),
      });

    const tb = new Discord.ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("VALID_CHARTE")
        .setLabel("📝丨𝐕alider le 𝐑èglement丨📝")
        .setStyle(ButtonStyle.Success)
    );
    message.reply({ embeds: [Ticketembed], components: [tb] });
  },
};

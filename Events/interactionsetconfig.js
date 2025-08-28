const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const ServerConfig = require("../models/serverConfig");
const Bingo = require("../models/bingo");

function buildBaseSelectMenuRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("setConfigCustomID")
      .setPlaceholder("𝐐ue veux-tu configurer ?")
      .addOptions(
        { label: "丨𝐋og",           emoji: "📝", value: "LOG" },
        { label: "丨𝐓witch",        emoji: "🎥", value: "TWITCH" },
        { label: "丨𝐑èglement",     emoji: "📜", value: "REGLEMENT" },
        { label: "丨𝐑ôles 𝐌enu",    emoji: "🎭", value: "ROLECHANNEL" },
        { label: "丨𝐖elcome",       emoji: "👋", value: "WELCOME" },
        { label: "丨𝐈mplications",  emoji: "🏆", value: "IMPLICATION" },
        { label: "丨𝐒uggestions",   emoji: "💡", value: "SUGGESTION" },
        { label: "丨𝐃aily",         emoji: "💵", value: "DAILY" },
        { label: "丨𝐑ôles des 𝐍iveaux", emoji: "🧪", value: "ROLES" },
        { label: "丨𝐓icket",        emoji: "🎫", value: "TICKET" },
        { label: "丨𝐁ingo",         emoji: "🎱", value: "BINGO" }
      )
  );
}
async function resetSelectToBase(interaction) {
  try {
    await interaction.update({ components: [buildBaseSelectMenuRow()] });
  } catch {
    try {
      await interaction.deferUpdate();
      await interaction.message.edit({ components: [buildBaseSelectMenuRow()] });
    } catch {}
  }
}
const ETAT_DB = { ACTIF: "𝐀𝐂𝐓𝐈𝐅", INACTIF: "𝐈𝐍𝐀𝐂𝐓𝐈𝐅" };
function buildBingoConfigDescription(serverConfig, bingoDoc) {
  const etatVisuel = ((bingoDoc?.etat || "").trim() === ETAT_DB.ACTIF) ? "𝐀𝐂𝐓𝐈𝐅" : "𝐈𝐍𝐀𝐂𝐓𝐈𝐅";
  const salonName = serverConfig?.bingoChannelName || "non défini";

  return [
    "🎲 𝐁ingo surprise : il pop au hasard tous les `2` à `5` jours.",
    "**𝐀ctiver** pour démarrer, **𝐃ésactiver** pour faire une pause, **𝐌odifier salon** pour déménager le show. 𝐏romis, pas de triche… sauf pour les maths.",
    "",
    `𝐒alon actuel : \`${salonName}\``,
    "",
    etatVisuel,
  ].join("\n");
}
function applyNextBingoFooter(embed, bingoDoc) {
  const actif = ((bingoDoc?.etat || "").trim() === ETAT_DB.ACTIF);
  if (actif && bingoDoc?.nextBingoTime) {
    const d = new Date(bingoDoc.nextBingoTime);
    const when = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short", day: "2-digit", month: "long",
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
    }).format(d);
    embed.setFooter({ text: `◟𝐏rochain bingo : ${when}` });
  }
  return embed;
}

module.exports = {
  name: "setConfigCustomID",
  async execute(interaction) {
    if (!interaction.isStringSelectMenu() || interaction.customId !== "setConfigCustomID") return;

    const serverID = interaction.guild.id;
    const serverConfig = await ServerConfig.findOne({ serverID });

    await resetSelectToBase(interaction);

    const reply = (payload) => interaction.followUp({ ephemeral: false, ...payload });

    const selectedOption = interaction.values[0];

    switch (selectedOption) {
      case "LOG": {
        const logEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐋og丨`")
          .setDescription(
            `📜 **𝐁ienvenue dans le journal des secrets bien gardés !**\n
- **𝐃aily ?** 𝐂'est ici qu'on les note ! 𝐑ien ne nous échappe, pas même les chasseurs d'𝐗𝐏 les plus fidèles !\n
- **𝐃éparts du serveur ?** 𝐎h, on s'en souvient bien ! 𝐋es log sont là pour leur dire au revoir… enfin, façon de parler ! 👋\n
- **𝐒uggestions ?** 𝐂e salon est comme un tableau de post-it : les idées fusent et les réponses aussi ! 💡\n
- **𝐒ilences forcés ?** 𝐐uand quelqu'un passe en mode "silence radio" (coucou les mutes), ce journal le note aussi. 𝐂huuut ! 🤫\n
⚙️ **𝐓u veux changer tout ça ?** 𝐌odifie le salon ou désactive-le si tu préfères que ces secrets restent dans l'ombre.\n\n
📌 **𝐒alon actuel** : \`${serverConfig.logChannelName}\``
          )
          .setThumbnail("https://images.emojiterra.com/google/android-12l/512px/1f4dd.png")
          .setColor("#b3c7ff");

        const rowLog = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("LOG_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("LOG_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [logEmbed], components: [rowLog] });
      }

      case "TWITCH": {
        const twitchEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐓witch丨`")
          .setDescription(
            `Configuration de twitch, permets à tes streamers d'augmenter leurs viewers en quelque seconde!\nConfigure le rôle donner lors de son live, ainsi que le salon ou le message apparaitra.\n\nModifie le salon ou carrément désactive les messages pour les Streamers de ton serveur.\n\n𝐒alon actuel : \`${serverConfig.TwitchChannelName}\`\n𝐑ole __Streamer__ actuel : \`${serverConfig.TwitchRoleName}\``
          )
          .setThumbnail("https://cdn.pixabay.com/photo/2021/12/10/16/38/twitch-6860918_1280.png")
          .setColor("#b3c7ff");

        const rowTwitch = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("TWITCH_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_LISTE").setEmoji("📅").setLabel("𝐋iste 𝐒treamers").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_ROLE").setEmoji("👮‍♂️").setLabel("𝐒treamer 𝐑ôle").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [twitchEmbed], components: [rowTwitch] });
      }

      case "ROLECHANNEL": {
        const roleChannelEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du salon 𝐑ôles丨`")
          .setDescription(
            `Salon ou tu permets à tes utilisateurs de prendre leurs rôles de jeu. Rajoute les rôles que tu veux directement en te rendant dans __Afficher Rôles__ puis __Ajouter Rôles__. Oublie pas de renseigner le salon adéquat et d'**envoyer** une fois terminer.\nModifie ou carrément désactive le salon des 𝐑ôles de ton serveur.\n\nSalon actuel : \`${serverConfig.roleChannelName}\``
          )
          .setThumbnail("https://www.numerama.com/wp-content/uploads/2020/03/role-playing-game-2536016_1920.jpg")
          .setColor("#b3c7ff");

        const rowroleChannel = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ROLECHANNEL_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("ROLECHANNEL_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ROLECHANNEL_LISTE").setEmoji("🕵").setLabel("𝐀fficher 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ROLECHANNEL_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [roleChannelEmbed], components: [rowroleChannel] });
      }

      case "REGLEMENT": {
        const reglementEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐑èglement丨`")
          .setDescription(
            `Le salon ou tu affiche le 𝐑èglement de ton serveur Discord.\n\nModifie le salon ou carrément désactive le 𝐑èglement de ton serveur.\nTu peux également modifié le rôle obtenu lors de la validation de ton 𝐑èglement.\n\n✔️ pour envoyé le 𝐑èglement dans ton salon !\n\nSalon actuel : \`${serverConfig.reglementChannelName}\`\nRôle actuel : \`${serverConfig.roleReglementName}\``
          )
          .setThumbnail("https://exalto-park.com/wp-content/uploads/2022/11/Reglement-interieur.png")
          .setColor("#b3c7ff");

        const rowReglement = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("REGL_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("REGL_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("REGL_ROLE").setEmoji("🕵").setLabel("𝐌odifier 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("REGL_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [reglementEmbed], components: [rowReglement] });
      }

      case "WELCOME": {
        const WELCOMEEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐖elcome丨`")
          .setDescription(
            `Message de bienvenue lorsque qu'un utilisateur rejoint ton serveur Discord.\n\nModifie le salon, le rôle attribué lors de l'arrivé du membre ou carrément désactive le message de bienvenue de ton serveur.\n\nSalon actuel : \`${serverConfig.welcomeChannelName}\`\nRôle actuel : \`${serverConfig.roleWelcomeName}\``
          )
          .setThumbnail("https://cdn.pixabay.com/photo/2016/03/31/21/33/greeting-1296493_1280.png")
          .setColor("#b3c7ff");

        const rowWelcome = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("WELCOME_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("WELCOME_ROLE").setEmoji("🕵").setLabel("𝐌odifier 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("WELCOME_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [WELCOMEEmbed], components: [rowWelcome] });
      }

      case "IMPLICATION": {
        const IMPLICATIONEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐈mplications丨`")
          .setDescription(
            `Message qui s'affiche dans le salon que tu veux pour avertir ta communauté qu'un de tes membres vient de prendre un niveau !\n\nModifie le salon ou carrément désactive les messages d'expérience de ton serveur.\nPour mieux faire, tu peux même désactiver les messages de bienvenue envoyer par Discord !\n\nSalon actuel : \`${serverConfig.implicationsChannelName}\``
          )
          .setThumbnail("https://supermonday.io/wp-content/uploads/2023/01/brain-g13f32aaed_1920.png")
          .setColor("#b3c7ff");

        const rowImplication = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("IMPLICATION_BUTTON").setEmoji("📝").setLabel("𝐌odifier Salons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("IMPLICATION_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [IMPLICATIONEmbed], components: [rowImplication] });
      }

      case "SUGGESTION": {
        const SUGGESTIONEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐒uggestions丨`")
          .setDescription(
            `Un salon qui peut permettre a ta communautée de proposer une amélioration à ton serveur.\n__Chaque personne qui envoie un simple message sera transformé directement en suggestion avec bouton pour pouvoir réagir__ !\n\nModifie le salon ou carrément désactive les 𝐒uggestions de ton serveur.\n\nSalon actuel : \`${serverConfig.suggestionsChannelName}\``
          )
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/2118/2118247.png")
          .setColor("#b3c7ff");

        const rowSugg = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("IDEE_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("SUGG_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [SUGGESTIONEmbed], components: [rowSugg] });
      }

      case "DAILY": {
        const DAILYEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du 𝐃aily丨`")
          .setDescription(
            `𝐏ermets à toute ta communauté de récupérer un bonus quotidien de **200 XP**, disponible une fois toutes les 23 heures. 𝐄n prime, un bonus cumulatif de **2%** s'applique après 7 jours consécutifs… de quoi booster la motivation ! 💪\n 𝐁esoin de changement ? 𝐌odifie le salon, désactive carrément le 𝐃aily, ou ajuste le message pour qu'il corresponde mieux à ton style. 𝐒i le message actuel ne te plaît pas, renvoie simplement pour le modifier ! 🎨\n\n✔️ 𝐂lique pour envoyer le message de récupération de 𝐃aily dans le salon configuré.\n\n◟𝐒alon actuel : \`${serverConfig.dailyChannelName}\``
          )
          .setThumbnail("https://papycha.fr/wp-content/uploads/2019/08/84863418061.png")
          .setColor("#b3c7ff");

        const rowDaily = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("DAILY_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("DAILY_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("DAILY_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [DAILYEmbed], components: [rowDaily] });
      }

      case "ROLES": {
        const ROLESEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration des 𝐑ôles pour niveaux丨`")
          .setDescription("𝐆estion des rôles de niveau, tu peux modifié les rôles donné lorsque un utilisateur passe niveau **1**, **2**, **5**, **10**, **15**, **20**, **25**, **30**, **35**, **40**, **45** et **50**.\n𝐓u peux faire cela sur le prestige 1 aussi.\n◟𝐈l te suffit juste de faire `Liste` et ensuite `Modifier les rôles`.")
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/33/33056.png")
          .setColor("#b3c7ff");

        const rowRoles = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ROLE_LISTE").setEmoji("📅").setLabel("𝐋iste").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("ROLES_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [ROLESEmbed], components: [rowRoles] });
      }

      case "TICKET": {
        const TICKETEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐓icket丨`")
          .setDescription(
            `𝐒ystème de 𝐓icket qui permettra à tous tes utilisateurs lors d'un problème d'ouvrir un salon disponible uniquement pour les modérateurs. 𝐀insi il pourra exposer son problème.\n\n𝐌odifie le salon ou carrément désactive les 𝐓ickets de ton serveur.\n\n✔️ pour envoyé le message initial des 𝐓ickets dans ton salon !\n\n𝐒alon actuel : \`${serverConfig.ticketChannelName}\`\n𝐑ole d'__admin__ actuel : \`${serverConfig.ticketAdminRoleName}\``
          )
          .setThumbnail("https://www.pngall.com/wp-content/uploads/12/Ticket-PNG-Free-Image.png")
          .setColor("#b3c7ff");

        const rowTicket = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("TICKET_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("TICKET_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TICKET_ROLE").setEmoji("👮‍♂️").setLabel("𝐀dministrateur 𝐑ôle").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TICKET_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [TICKETEmbed], components: [rowTicket] });
      }

      case "BINGO": {
        const guild = interaction.guild;
        const bingoDoc = await Bingo.findOne({ serverID }).lean();

        let BINGOEmbed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du 𝐁ingo丨`")
          .setDescription(buildBingoConfigDescription(serverConfig, bingoDoc))
          .setThumbnail("https://png.pngtree.com/png-clipart/20210311/original/pngtree-colorful-bingo-words-hand-drawing-png-image_6006005.png")
          .setColor("#b3c7ff");

        BINGOEmbed = applyNextBingoFooter(BINGOEmbed, bingoDoc);

        const isActive = ((bingoDoc?.etat || "").trim() === ETAT_DB.ACTIF);

        const primaryBtn = new ButtonBuilder()
          .setCustomId(isActive ? "BINGO_DISABLE" : "BINGO_PUSH")
          .setLabel(isActive ? "𝐃ésactiver" : "𝐀ctiver")
          .setStyle(isActive ? ButtonStyle.Danger : ButtonStyle.Primary);

        if (!isActive) primaryBtn.setEmoji("✔️");

        const rowBingo = new ActionRowBuilder().addComponents(
          primaryBtn,
          new ButtonBuilder().setCustomId("BINGO_BUTTON").setLabel("𝐌odifier 𝐒alon").setEmoji("📝").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("BINGO_DESAC").setLabel("𝐑éinitialiser").setEmoji("❌").setStyle(ButtonStyle.Danger),
        );

        return reply({ embeds: [BINGOEmbed], components: [rowBingo] });
      }

      default:
        return reply({ content: "Option invalide." });
    }
  },
};

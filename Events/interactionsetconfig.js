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
        { label: "丨𝐋og", emoji: "📝", value: "LOG" },
        { label: "丨𝐓witch", emoji: "🎥", value: "TWITCH" },
        { label: "丨𝐑èglement", emoji: "📜", value: "REGLEMENT" },
        { label: "丨𝐑ôles 𝐌enu", emoji: "🎭", value: "ROLECHANNEL" },
        { label: "丨𝐖elcome", emoji: "👋", value: "WELCOME" },
        { label: "丨𝐈mplications", emoji: "🏆", value: "IMPLICATION" },
        { label: "丨𝐒uggestions", emoji: "💡", value: "SUGGESTION" },
        { label: "丨𝐃aily", emoji: "💵", value: "DAILY" },
        { label: "丨𝐑ôles des 𝐍iveaux", emoji: "🧪", value: "ROLES" },
        { label: "丨𝐓icket", emoji: "🎫", value: "TICKET" },
        { label: "丨𝐁ingo", emoji: "🎱", value: "BINGO" }
      )
  );
}

const ETAT_DB = { ACTIF: "𝐀𝐂𝐓𝐈𝐅", INACTIF: "𝐈𝐍𝐀𝐂𝐓𝐈𝐅" };

function buildBingoConfigDescription(serverConfig, bingoDoc) {
  const etatVisuel =
    ((bingoDoc?.etat || "").trim() === ETAT_DB.ACTIF)
      ? "𝐀𝐂𝐓𝐈𝐅"
      : "𝐈𝐍𝐀𝐂𝐓𝐈𝐅";

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
      weekday: "short",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    }).format(d);

    embed.setFooter({ text: `◟𝐏rochain bingo : ${when}` });
  }
  return embed;
}

module.exports = {
  name: "setConfigCustomID",
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== "setConfigCustomID") return;

    const serverID = interaction.guild.id;
    const serverConfig = await ServerConfig.findOne({ serverID });
    const selectedOption = interaction.values[0];
    const baseMenu = buildBaseSelectMenuRow();

    function buildBaseSelectMenuRow(mode = "base") {
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("setConfigCustomID")
          .setPlaceholder(
            mode === "after"
              ? "𝐐ue veux-tu configurer d'autre ?"
              : "𝐐ue veux-tu configurer ?"
          )
          .addOptions(
            { label: "丨𝐋og", emoji: "📝", value: "LOG" },
            { label: "丨𝐓witch", emoji: "🎥", value: "TWITCH" },
            { label: "丨𝐑èglement", emoji: "📜", value: "REGLEMENT" },
            { label: "丨𝐑ôles 𝐌enu", emoji: "🎭", value: "ROLECHANNEL" },
            { label: "丨𝐖elcome", emoji: "👋", value: "WELCOME" },
            { label: "丨𝐈mplications", emoji: "🏆", value: "IMPLICATION" },
            { label: "丨𝐒uggestions", emoji: "💡", value: "SUGGESTION" },
            { label: "丨𝐃aily", emoji: "💵", value: "DAILY" },
            { label: "丨𝐑ôles des 𝐍iveaux", emoji: "🧪", value: "ROLES" },
            { label: "丨𝐓icket", emoji: "🎫", value: "TICKET" },
            { label: "丨𝐁ingo", emoji: "🎱", value: "BINGO" }
          )
      );
    }

    switch (selectedOption) {

      /* ========= LOG ========= */
      case "LOG": {
        const hasLogChannel =
          serverConfig.logChannelID &&
          serverConfig.logChannelName &&
          serverConfig.logChannelName !== "𝐍on défini";

        const embedLog = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐋og丨`")
          .setDescription(
            `📜丨**𝐁ienvenue dans le journal des secrets bien gardés !**

            - **𝐃aily ?** 𝐂'est ici qu'on les note !
            - **𝐃éparts du serveur ?** 𝐎h, on s'en souvient bien !
            - **𝐒uggestions ?** Tableau de post-it 💡
            - **𝐒ilences forcés ?** Tout est noté 🤫

            📌 **𝐒alon actuel** : \`${serverConfig.logChannelName || "𝐍on défini"}\``
          )
          .setThumbnail("https://i.postimg.cc/ZKGSMjhv/Capture.png")
          .setColor("#b3c7ff");

        const rowLog = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("LOG_BUTTON")
            .setEmoji(hasLogChannel ? "📝" : "➕")
            .setLabel(hasLogChannel ? "𝐌odifier 𝐒alon" : "𝐀jouter 𝐒alon")
            .setStyle(hasLogChannel ? ButtonStyle.Primary : ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("LOG_DESAC")
            .setEmoji("❌")
            .setLabel("𝐑éinitialiser")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!hasLogChannel)
        );

        return interaction.update({
          embeds: [embedLog],
          components: [rowLog, buildBaseSelectMenuRow("after")]
        });
      }

      /* ========= TWITCH ========= */
      case "TWITCH": {
        const embedTwitch = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐓witch丨`")
          .setDescription(
          `🎥丨**𝐋e projecteur braqué sur tes streamers !**

          - **𝐔n live ?** 𝐓out le serveur est prévenu 🔔
          - **𝐑ôle streamer ?** 𝐀ttribué automatiquement 🎮
          - **𝐏lus de viewers ?** 𝐂lairement oui 📈

          📌丨**𝐒alon actuel** : \`${serverConfig.TwitchChannelName}\`
          🎭丨**𝐑ôle streamer** : \`${serverConfig.TwitchRoleName}\``
          )
          .setThumbnail("https://i.postimg.cc/63xsHQJW/image-2026-01-04-221014147.png")
          .setColor("#b3c7ff");

        const rowTwitch = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("TWITCH_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_LISTE").setEmoji("📅").setLabel("𝐋iste 𝐒treamers").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_ROLE").setEmoji("👮‍♂️").setLabel("𝐒treamer 𝐑ôle").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedTwitch], components: [rowTwitch, buildBaseSelectMenuRow("after")] });
      }

      /* ========= REGLEMENT ========= */
      case "REGLEMENT": {
        const hasReglChannel =
          serverConfig.reglementChannelID &&
          serverConfig.reglementChannelName &&
          serverConfig.reglementChannelName !== "𝐍on défini";

        const embedReglement = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐑èglement丨`")
          .setDescription(
      `📜丨**𝐋a loi sacrée du serveur (promis, c’est pas si chiant)**

      - **𝐋es règles ?** 𝐏our que tout le monde joue fair-play ⚖️
      - **𝐔n clic, une validation** et c’est réglé ✔️
      - **𝐑ôle automatique ?** 𝐎ui, pour les bons élèves 😇

      📌丨**𝐒alon actuel** : \`${serverConfig.reglementChannelName ?? "𝐍on défini"}\`
      🎭丨**𝐑ôle donné** : \`${serverConfig.roleReglementName ?? "𝐍on défini"}\``
          )
          .setThumbnail("https://i.postimg.cc/c49Vphyw/Capture.png")
          .setColor("#b3c7ff");

        const rowReglement = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("REGL_PUSH")
            .setEmoji("✔️")
            .setLabel("𝐄nvoyer")
            .setStyle(ButtonStyle.Success)
            .setDisabled(!hasReglChannel),

          new ButtonBuilder()
            .setCustomId("REGL_BUTTON")
            .setEmoji(hasReglChannel ? "📝" : "➕")
            .setLabel(hasReglChannel ? "𝐌odifier 𝐒alon" : "𝐀jouter 𝐒alon")
            .setStyle(hasReglChannel ? ButtonStyle.Primary : ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("REGL_ROLE")
            .setEmoji("🕵")
            .setLabel("𝐌odifier 𝐑ôles")
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId("REGL_DESAC")
            .setEmoji("❌")
            .setLabel("𝐑éinitialiser")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!hasReglChannel)
        );

        return interaction.update({
          embeds: [embedReglement],
          components: [rowReglement, buildBaseSelectMenuRow("after")]
        });
      }

      /* ========= BINGO ========= */
      case "BINGO": {
        const bingoDoc = await Bingo.findOne({ serverID }).lean();

        let embedBingo = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du 𝐁ingo丨`")
          .setDescription(buildBingoConfigDescription(serverConfig, bingoDoc))
          .setThumbnail("https://i.postimg.cc/kXX65JVy/image-2026-01-04-214848313.png")
          .setColor("#b3c7ff");

        embedBingo = applyNextBingoFooter(embedBingo, bingoDoc);

        const isActive = ((bingoDoc?.etat || "").trim() === ETAT_DB.ACTIF);

        const mainBtn = new ButtonBuilder()
          .setCustomId(isActive ? "BINGO_DISABLE" : "BINGO_PUSH")
          .setLabel(isActive ? "𝐃ésactiver" : "𝐀ctiver")
          .setStyle(isActive ? ButtonStyle.Danger : ButtonStyle.Primary);

        if (!isActive) {
          mainBtn.setEmoji("✔️");
        }

        const rowBingo = new ActionRowBuilder().addComponents(
          mainBtn,
          new ButtonBuilder()
            .setCustomId("BINGO_BUTTON")
            .setLabel("𝐌odifier 𝐒alon")
            .setEmoji("📝")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("BINGO_DESAC")
            .setLabel("𝐑éinitialiser")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger),
        );

        return interaction.update({
          embeds: [embedBingo],
          components: [rowBingo, buildBaseSelectMenuRow("after")]
        });
      }

      case "TICKET": {
        const hasChannel = Boolean(serverConfig.ticketChannelName);
        const embedTicket = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐓icket丨`")
          .setDescription(
          `🎫丨**𝐋e service après-vente du serveur !**

          - **𝐔n souci ?** 𝐎uvre un ticket 🆘
          - **𝐒alon privé ?** 𝐌odos only 👮
          - **𝐓out est tracé**, rien ne se perd

          📌丨**𝐒alon actuel** : \`${serverConfig.ticketChannelName}\`
          👮丨**𝐑ôle admin** : \`${serverConfig.ticketAdminRoleName}\``
          )
          .setThumbnail("https://i.postimg.cc/MGxXhz8j/dddd.png")
          .setColor("#b3c7ff");

        const rowTicket = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("TICKET_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Secondary).setDisabled(!hasChannel),
          new ButtonBuilder().setCustomId("TICKET_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TICKET_ROLE").setEmoji("👮‍♂️").setLabel("𝐀dministrateur 𝐑ôle").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TICKET_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedTicket], components: [rowTicket, buildBaseSelectMenuRow("after")] });
      }

      case "ROLES": {
        const embedRoles = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration des 𝐑ôles pour niveaux丨`")
          .setDescription(
          `🧪丨**𝐋a progression visible, niveau par niveau !**

          - **𝐌ontée en niveau ?** 𝐑ôle automatique 👑
          - **𝐏aliers clés ?** 1, 2, 5, 10… 15… jusqu’à 50 !
          - **𝐏restige ?** 𝐎ui -> 10, on aime quand ça brille ✨

          ◟ 𝐔tilise **Liste** pour voir, **Modifier** pour ajuster`
          )
          .setThumbnail("https://i.postimg.cc/XqTYxb8N/dddqq.png")
          .setColor("#b3c7ff");

        const rowRoles = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ROLE_LISTE").setEmoji("📅").setLabel("𝐋iste").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("ROLES_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedRoles], components: [rowRoles, buildBaseSelectMenuRow("after")] });
      }

      case "DAILY": {
        const hasChannel = Boolean(serverConfig.dailyChannelName);
        const embedDaily = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du 𝐃aily丨`")
          .setDescription(
          `💵丨**𝐋a petite récompense qui fait plaisir !**

          - **𝐔ne fois par jour ?** 𝐎ui, faut revenir 😏 (toute les 23h)
          - **𝐁onus cumulatif ?** 𝐋es fidèles sont récompensés 🔥
          - **𝐗𝐏 gratuit ?** 𝐂lairement oui.

          📌丨**𝐒alon actuel** : \`${serverConfig.dailyChannelName}\``
          )
          .setThumbnail("https://i.postimg.cc/7h7fFhbY/qsdqqq.png")
          .setColor("#b3c7ff");

        const rowDaily = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("DAILY_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success).setDisabled(!hasChannel),
          new ButtonBuilder().setCustomId("DAILY_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("DAILY_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedDaily], components: [rowDaily, buildBaseSelectMenuRow("after")] });
      }

      case "SUGGESTION": {
        const embedSuggestion = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐒uggestions丨`")
          .setDescription(
          `💡丨**𝐋e laboratoire d’idées du serveur !**

          - **𝐔ne idée géniale ?** 𝐁alance-la ici 🧠
          - **𝐔n message = une suggestion** (magie ✨)
          - **𝐕otes & réactions ?** 𝐓out est prêt !

          📌丨**𝐒alon actuel** : \`${serverConfig.suggestionsChannelName}\``
          )
          .setThumbnail("https://i.postimg.cc/HLZc5FfM/qsdqsd.png")
          .setColor("#b3c7ff");

        const rowSuggestion = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("IDEE_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("SUGG_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedSuggestion], components: [rowSuggestion, buildBaseSelectMenuRow("after")] });
      }

      case "IMPLICATION": {
        const embedImplication = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐈mplications丨`")
          .setDescription(
          `🏆丨**𝐋e tableau d’honneur du serveur !**

          - **𝐍ouveau niveau ?** 𝐓out le monde est au courant 🎉
          - **𝐅lex discret ?** 𝐈ci, on félicite proprement 😌
          - **𝐌otivation ?** 𝐑ien de mieux qu’un petit message public !

          📌丨**𝐒alon actuel** : \`${serverConfig.implicationsChannelName}\``
          )
          .setThumbnail("https://i.postimg.cc/2STVRPjc/qsd.png")
          .setColor("#b3c7ff");

        const rowImplication = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("IMPLICATION_BUTTON").setEmoji("📝").setLabel("𝐌odifier Salons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("IMPLICATION_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedImplication], components: [rowImplication, buildBaseSelectMenuRow("after")] });
      }

      case "WELCOME": {
        const embedWelcome = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐖elcome丨`")
          .setDescription(
          `👋丨**𝐋e tapis rouge pour les nouveaux arrivants !**

          - **𝐍ouveau membre ?** 𝐀ccueil chaleureux garanti ✨
          - **𝐑ôle automatique ?** 𝐎ui, oui, on s’en occupe 🤝
          - **𝐏remière impression ?** 𝐀utant qu’elle soit bonne !

          📌丨**𝐒alon actuel** : \`${serverConfig.welcomeChannelName}\`
          🎭丨**𝐑ôle donné** : \`${serverConfig.roleWelcomeName}\``
          )
          .setThumbnail("https://i.postimg.cc/gkXwhMDY/Capturefqdsfsdq.png")
          .setColor("#b3c7ff");

        const rowWelcome = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("WELCOME_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("WELCOME_ROLE").setEmoji("🕵").setLabel("𝐌odifier 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("WELCOME_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedWelcome], components: [rowWelcome, buildBaseSelectMenuRow("after")] });
      }

      case "ROLECHANNEL": {
        const hasChannel = Boolean(serverConfig.roleChannelName);

        const embedRoleChannel = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du salon 𝐑ôles丨`")
          .setDescription(
          `🎭丨**𝐋e dressing officiel du serveur !**

          - **𝐑ôles de jeux ?** 𝐄n libre-service 🎮
          - **𝐔n clic = un rôle** (simple et efficace)
          - **𝐌odifiable à volonté** sans prise de tête

          📌丨**𝐒alon actuel** : \`${serverConfig.roleChannelName}\``
          )
          .setThumbnail("https://i.postimg.cc/tCkXYF0h/qqsssq.png")
          .setColor("#b3c7ff");

        const rowRoleChannel = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ROLECHANNEL_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success).setDisabled(!hasChannel),
          new ButtonBuilder().setCustomId("ROLECHANNEL_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ROLECHANNEL_LISTE").setEmoji("🕵").setLabel("𝐀fficher 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ROLECHANNEL_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedRoleChannel], components: [rowRoleChannel, buildBaseSelectMenuRow("after")] });
      }

      default:
        return interaction.deferUpdate();
    }
  },
};

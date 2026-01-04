const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const ServerConfig = require("../models/serverConfig");
const Bingo = require("../models/bingo");

/* ================= SELECT MENU ================= */
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

/* ================= BINGO UTILS ================= */
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

/* ================= HANDLER ================= */
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

    /* ================= SWITCH ================= */
    switch (selectedOption) {

      /* ========= LOG ========= */
      case "LOG": {
        const embedLog = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐋og丨`")
          .setDescription(
            `📜 **𝐁ienvenue dans le journal des secrets bien gardés !**

            - **𝐃aily ?** 𝐂'est ici qu'on les note !
            - **𝐃éparts du serveur ?** 𝐎h, on s'en souvient bien !
            - **𝐒uggestions ?** Tableau de post-it 💡
            - **𝐒ilences forcés ?** Tout est noté 🤫

            📌 **𝐒alon actuel** : \`${serverConfig.logChannelName}\``
          )
          .setThumbnail("https://images.emojiterra.com/google/android-12l/512px/1f4dd.png")
          .setColor("#b3c7ff");

        const rowLog = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("LOG_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("LOG_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedLog], components: [rowLog, buildBaseSelectMenuRow("after")] });
      }

      /* ========= TWITCH ========= */
      case "TWITCH": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐓witch丨`")
          .setDescription(
            `🔴丨𝐌ise en avant des streamers du serveur.
            𝐏ermet d’envoyer automatiquement un message quand un membre lance un live Twitch.
            __𝐓u peux configurer__ :

            ◟𝐋e salon d’annonce,
            ◟𝐋e rôle Streamer attribué pendant le live.

            𝐒alon actuel : \`${serverConfig.TwitchChannelName}\`
            𝐑ole __Streamer__ actuel : \`${serverConfig.TwitchRoleName}\``
          )
          .setThumbnail("https://cdn.pixabay.com/photo/2021/12/10/16/38/twitch-6860918_1280.png")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("TWITCH_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_LISTE").setEmoji("📅").setLabel("𝐋iste 𝐒treamers").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_ROLE").setEmoji("👮‍♂️").setLabel("𝐒treamer 𝐑ôle").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TWITCH_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      /* ========= REGLEMENT ========= */
      case "REGLEMENT": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐑èglement丨`")
          .setDescription(
            `⚖️丨𝐋e pilier du serveur.
              𝐒alon dédié à l’affichage du règlement officiel.
              __𝐓u peux configurer__ :

              ◟𝐃éfinir le salon,
              ◟𝐂hoisir le rôle attribué après validation,
              ◟𝐑envoyer le règlement à tout moment.

            ✔️ pour envoyé le 𝐑èglement dans ton salon !

            𝐒alon actuel : \`${serverConfig.reglementChannelName}\`
            𝐑ôle actuel : \`${serverConfig.roleReglementName}\``
          )
          .setThumbnail("https://exalto-park.com/wp-content/uploads/2022/11/Reglement-interieur.png")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("REGL_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("REGL_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("REGL_ROLE").setEmoji("🕵").setLabel("𝐌odifier 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("REGL_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      /* ========= BINGO ========= */
      case "BINGO": {
        const bingoDoc = await Bingo.findOne({ serverID }).lean();

        let embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du 𝐁ingo丨`")
          .setDescription(buildBingoConfigDescription(serverConfig, bingoDoc))
          .setThumbnail("https://png.pngtree.com/png-clipart/20210311/original/pngtree-colorful-bingo-words-hand-drawing-png-image_6006005.png")
          .setColor("#b3c7ff");

        embed = applyNextBingoFooter(embed, bingoDoc);

        const isActive = ((bingoDoc?.etat || "").trim() === ETAT_DB.ACTIF);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(isActive ? "BINGO_DISABLE" : "BINGO_PUSH")
            .setLabel(isActive ? "𝐃ésactiver" : "𝐀ctiver")
            .setStyle(isActive ? ButtonStyle.Danger : ButtonStyle.Primary)
            .setEmoji(isActive ? null : "✔️"),
          new ButtonBuilder().setCustomId("BINGO_BUTTON").setLabel("𝐌odifier 𝐒alon").setEmoji("📝").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("BINGO_DESAC").setLabel("𝐑éinitialiser").setEmoji("❌").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      case "TICKET": {
        const embedTicket = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐓icket丨`")
          .setDescription(
            `🛠️丨𝐒upport privé et modération.
            𝐒ystème de tickets permettant aux membres de contacter le staff en privé.
            __𝐓u peux configurer__ :

            ◟𝐒alon de création,
            ◟𝐑ôle administrateur,
            ◟𝐌essage initial.

            𝐒alon actuel : \`${serverConfig.ticketChannelName}\`
            𝐑ôle admin : \`${serverConfig.ticketAdminRoleName}\``
          )
          .setThumbnail("https://www.pngall.com/wp-content/uploads/12/Ticket-PNG-Free-Image.png")
          .setColor("#b3c7ff");

        const rowTicket = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("TICKET_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("TICKET_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TICKET_ROLE").setEmoji("👮‍♂️").setLabel("𝐀dministrateur 𝐑ôle").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("TICKET_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embedTicket], components: [rowTicket, baseMenu] });
      }

      case "ROLES": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration des 𝐑ôles pour niveaux丨`")
          .setDescription(
            `📈丨𝐑écompenses par progression.
            𝐋es rôles sont attribués automatiquement en fonction du niveau atteint par le membre.
            𝐋e service comprends **12 niveaux** de rôles personnalisables, sur **10 prestiges** maximum. Le niveau à l'arrivée est 0 et va jusqu'à 50 inclus.
            𝐆estion fine et évolutive pour structurer la progression.`
          )
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/33/33056.png")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ROLE_LISTE").setEmoji("📅").setLabel("𝐋iste").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("ROLES_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      case "DAILY": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du 𝐃aily丨`")
          .setDescription(
            `🔥丨𝐁onus quotidien d’expérience.
            𝐋es membres peuvent récupérer leur Daily XP toutes les **23 heures**.
            𝐒ystème cumulatif pour encourager la régularité.
            __𝐓u peux configurer__ :

            ◟𝐋e salon,
            ◟𝐋e message,
            ◟𝐋’activation/désactivation.

            𝐒alon actuel : \`${serverConfig.dailyChannelName}\``
          )
          .setThumbnail("https://papycha.fr/wp-content/uploads/2019/08/84863418061.png")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("DAILY_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("DAILY_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("DAILY_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      case "SUGGESTION": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐒uggestions丨`")
          .setDescription(
            `💬丨𝐁oîte à idées communautaire.
            𝐂haque message posté devient automatiquement une suggestion avec boutons de réaction.
            𝐏arfait pour :

            ◟𝐑écolter des idées,
            ◟𝐈mpliquer les membres dans l’évolution du serveur.

            𝐒alon actuel : \`${serverConfig.suggestionsChannelName}\``
          )
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/2118/2118247.png")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("IDEE_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("SUGG_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      case "IMPLICATION": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐈mplications丨`")
          .setDescription(
              `📢丨𝐀nnonces de progression.
              𝐀ffiche un message quand un membre :

              ◟𝐌onte de niveau,
              ◟𝐏rogresse dans l’expérience,
              ◟𝐁ump le serveur.

              𝐈déal pour motiver la communauté et mettre en avant l’activité.

              𝐒alon actuel : \`${serverConfig.implicationsChannelName}\``
          )
          .setThumbnail("https://supermonday.io/wp-content/uploads/2023/01/brain-g13f32aaed_1920.png")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("IMPLICATION_BUTTON").setEmoji("📝").setLabel("𝐌odifier Salons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("IMPLICATION_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      case "WELCOME": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration 𝐖elcome丨`")
          .setDescription(
            `🎉丨𝐀ccueil des nouveaux membres.
              𝐌essage automatique envoyé lorsqu’un membre rejoint le serveur.
              __𝐓u peux configurer__ :

              ◟𝐒alon de bienvenue,
              ◟𝐑ôle donné à l’arrivée,
              ◟𝐃ésactivation complète si besoin.

            𝐒alon actuel : \`${serverConfig.welcomeChannelName}\`
            𝐑ôle actuel : \`${serverConfig.roleWelcomeName}\``
          )
          .setThumbnail("https://cdn.pixabay.com/photo/2016/03/31/21/33/greeting-1296493_1280.png")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("WELCOME_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("WELCOME_ROLE").setEmoji("🕵").setLabel("𝐌odifier 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("WELCOME_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      case "ROLECHANNEL": {
        const embed = new EmbedBuilder()
          .setTitle("`丨𝐂onfiguration du salon 𝐑ôles丨`")
          .setDescription(
            `🎮丨𝐆estion des rôles en libre-service.
            𝐏ermet aux membres de choisir leurs rôles (jeux, activités, etc.) via un menu interactif.
            __𝐓u peux configurer__ :

            ◟𝐀jouter / retirer des rôles,
            ◟𝐂hanger le salon,
            ◟𝐄nvoyer ou réinitialiser le menu

            𝐒alon actuel : \`${serverConfig.roleChannelName}\``
          )
          .setThumbnail("https://www.numerama.com/wp-content/uploads/2020/03/role-playing-game-2536016_1920.jpg")
          .setColor("#b3c7ff");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ROLECHANNEL_PUSH").setEmoji("✔️").setLabel("𝐄nvoyer").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("ROLECHANNEL_BUTTON").setEmoji("📝").setLabel("𝐌odifier 𝐒alons").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ROLECHANNEL_LISTE").setEmoji("🕵").setLabel("𝐀fficher 𝐑ôles").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ROLECHANNEL_DESAC").setEmoji("❌").setLabel("𝐑éinitialiser").setStyle(ButtonStyle.Danger),
        );

        return interaction.update({ embeds: [embed], components: [row, baseMenu] });
      }

      default:
        return interaction.deferUpdate();
    }
  },
};

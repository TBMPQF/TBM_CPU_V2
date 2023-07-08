const {
  Discord,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "setConfigCustomID",
  async execute(interaction) {
    if (interaction.isStringSelectMenu()) {
      const selectedOption = interaction.values[0];

      switch (selectedOption) {
        case "LOG":
          const logEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐋og丨`")
            .setDescription(
              "Salon qui te permettra de suivre l'actualité du serveur (Quand quelqu'un récupère son daily, quand quelqu'un quitte ton serveur, suivre les suggestions ...)\n\nModifie le salon ou carrément désactive les 𝐋ogs de ton serveur."
            )
            .setThumbnail(
              "https://images.emojiterra.com/google/android-12l/512px/1f4dd.png"
            )
            .setColor("#b3c7ff");
          const rowLog = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("LOG_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("LOG_DESAC")
                .setEmoji("❌")
                .setLabel("Désactivé")
                .setStyle(ButtonStyle.Danger)
            );
          await interaction.reply({ embeds: [logEmbed], components: [rowLog] });

          break;

        case "REGLEMENT":
          const reglementEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐑èglement丨`")
            .setDescription(
              "Le salon ou tu affiche le règlement de ton serveur Discord.\n\nModifie le salon ou carrément désactive le 𝐑èglement de ton serveur.\n✔️ pour envoyé le règlement dans ton salon !"
            )
            .setThumbnail(
              "https://exalto-park.com/wp-content/uploads/2022/11/Reglement-interieur.png"
            )
            .setColor("#b3c7ff");
          const rowReglement = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("REGL_PUSH")
                .setEmoji("✔️")
                .setLabel("Envoyé")
                .setStyle(ButtonStyle.Success)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("REGL_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("REGL_DESAC")
                .setEmoji("❌")
                .setLabel("Désactivé")
                .setStyle(ButtonStyle.Danger)
            );
          await interaction.reply({
            embeds: [reglementEmbed],
            components: [rowReglement],
          });

          break;

        case "WELCOME":
          const WELCOMEEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐖elcome丨`")
            .setDescription(
              "Message de bienvenue lorsque qu'un utilisateur rejoint ton serveur Discord.\n\nPersonnalise ton message, modifie le salon ou carrément désactive le message de bienvenue de ton serveur."
            )
            .setThumbnail(
              "https://cdn.pixabay.com/photo/2016/03/31/21/33/greeting-1296493_1280.png"
            )
            .setColor("#b3c7ff");
          const rowWelcome = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("WELCOME_PERSO")
                .setEmoji("🖌️")
                .setLabel("Personnalisation")
                .setStyle(ButtonStyle.Secondary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("WELCOME_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("WELCOME_DESAC")
                .setEmoji("❌")
                .setLabel("Désactivé")
                .setStyle(ButtonStyle.Danger)
            );
          await interaction.reply({
            embeds: [WELCOMEEmbed],
            components: [rowWelcome],
          });
          break;

        case "IMPLICATION":
          const IMPLICATIONEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐈mplications丨`")
            .setDescription(
              "Message qui s'affiche dans le salon que tu veux pour avertir ta communauté qu'un de tes membres vient de prendre un niveau !\n\nPersonnalise ton message, modifie le salon ou carrément désactive les messages d'expérience de ton serveur."
            )
            .setThumbnail(
              "https://supermonday.io/wp-content/uploads/2023/01/brain-g13f32aaed_1920.png"
            )
            .setColor("#b3c7ff");
          const rowImplication = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("IMPLICATION_PERSO")
                .setEmoji("🖌️")
                .setLabel("Personnalisation")
                .setStyle(ButtonStyle.Secondary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("IMPLICATION_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("IMPLICATION_DESAC")
                .setEmoji("❌")
                .setLabel("Désactivé")
                .setStyle(ButtonStyle.Danger)
            );
          await interaction.reply({
            embeds: [IMPLICATIONEmbed],
            components: [rowImplication],
          });
          break;

        case "SUGGESTION":
          const SUGGESTIONEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐒uggestions丨`")
            .setDescription(
              "Un salon qui peut permettre a ta communautée de proposer une amélioration à ton serveur.\n\nModifie le salon ou carrément désactive les suggestions de ton serveur."
            )
            .setThumbnail(
              "https://cdn-icons-png.flaticon.com/512/2118/2118247.png"
            )
            .setColor("#b3c7ff");
          const rowSugg = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("SUGG_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("SUGG_DESAC")
                .setEmoji("❌")
                .setLabel("Désactivé")
                .setStyle(ButtonStyle.Danger)
            );
          await interaction.reply({
            embeds: [SUGGESTIONEmbed],
            components: [rowSugg],
          });
          break;

        case "DAILY":
          const DAILYEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐃aily丨`")
            .setDescription(
              "Permet à toute ta communautée de récupérer un bonus quotidien d'expérience, récupérable une fois toute les 23H. Un bonus de 2% sera appliqué au bout de 7 jours consécutifs.\n\nPersonnalise l'expérience donné, modifie le salon ou carrément désactive le daily de ton serveur.\n✔️ pour envoyé le message de récupération de daily dans ton salon !"
            )
            .setThumbnail(
              "https://papycha.fr/wp-content/uploads/2019/08/84863418061.png"
            )
            .setColor("#b3c7ff");
          const rowDaily = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("DAILY_PERSO")
                .setEmoji("🖌️")
                .setLabel("Personnalisation")
                .setStyle(ButtonStyle.Secondary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("DAILY_PUSH")
                .setEmoji("✔️")
                .setLabel("Envoyé")
                .setStyle(ButtonStyle.Success)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("DAILY_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("DAILY_DESAC")
                .setEmoji("❌")
                .setLabel("Désactivé")
                .setStyle(ButtonStyle.Danger)
            );
          await interaction.reply({
            embeds: [DAILYEmbed],
            components: [rowDaily],
          });
          break;

        case "ROLES":
          const ROLESEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐑ôles丨`")
            .setDescription("Contenu de l'option ROLES")
            .setColor("#b3c7ff");
            const rowRoles = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("ROLES_LISTE")
                .setEmoji("📅")
                .setLabel("Liste")
                .setStyle(ButtonStyle.Secondary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("ROLES_PUSH")
                .setEmoji("✔️")
                .setLabel("Envoyé")
                .setStyle(ButtonStyle.Success)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("ROLES_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
              new ButtonBuilder()
                .setCustomId("ROLES_DESAC")
                .setEmoji("❌")
                .setLabel("Désactivé")
                .setStyle(ButtonStyle.Danger)
            );
          await interaction.reply({
            embeds: [ROLESEmbed],
            components: [rowRoles],
          });
          break;

        default:
          await interaction.reply("Option invalide");
          break;
      }
    }
  },
};

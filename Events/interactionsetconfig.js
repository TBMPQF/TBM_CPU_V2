const {
  Discord,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const ServerConfig = require("../models/serverConfig");

module.exports = {
  name: "setConfigCustomID",
  async execute(interaction) {
    const serverID = interaction.guild.id;
    const serverConfig = await ServerConfig.findOne({ serverID: serverID });

    if (interaction.isStringSelectMenu()) {
      const selectedOption = interaction.values[0];

      switch (selectedOption) {
        case "LOG":
          const logEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐋og丨`")
            .setDescription(
              `Salon qui te permettra de suivre l'actualité du serveur (Quand quelqu'un récupère son daily, quand quelqu'un quitte ton serveur, suivre les suggestions ... )\n\nModifie le salon ou carrément désactive les 𝐋ogs de ton serveur.\n\nSalon actuel : \`${serverConfig.logChannelName}\``
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

          case "ROLECHANNEL":
            const roleChannelEmbed = new EmbedBuilder()
              .setTitle("`丨𝐂onfiguration du salon 𝐑ôles丨`")
              .setDescription(
                `Salon ou tu permets à tes utilisateurs de prendre leurs rôles de jeu, une fois enregistrer, il s'affichera surtout dans le message 𝐖elcome.\nModifie ou carrément désactive le salon des 𝐑ôles de ton serveur.\n\nSalon actuel : \`${serverConfig.roleChannelName}\``
              )
              .setThumbnail(
                "https://www.numerama.com/wp-content/uploads/2020/03/role-playing-game-2536016_1920.jpg"
              )
              .setColor("#b3c7ff");
            const rowroleChannel = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId("ROLECHANNEL_BUTTON")
                  .setEmoji("📝")
                  .setLabel("Modifié Salon")
                  .setStyle(ButtonStyle.Primary)
              )
              .addComponents(
                new ButtonBuilder()
                  .setCustomId("ROLECHANNEL_DESAC")
                  .setEmoji("❌")
                  .setLabel("Désactivé")
                  .setStyle(ButtonStyle.Danger)
              );
            await interaction.reply({ embeds: [roleChannelEmbed], components: [rowroleChannel] });
  
            break;

        case "REGLEMENT":
          const reglementEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐑èglement丨`")
            .setDescription(
              `Le salon ou tu affiche le 𝐑èglement de ton serveur Discord.\n\nModifie le salon ou carrément désactive le 𝐑èglement de ton serveur.\nTu peux également modifié le rôle obtenu lors de la validation de ton 𝐑èglement.\n\n✔️ pour envoyé le 𝐑èglement dans ton salon !\n\nSalon actuel : \`${serverConfig.reglementChannelName}\`\nRôle actuel : \`${serverConfig.roleReglementName}\``
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
                .setCustomId("REGL_ROLE")
                .setEmoji("🕵")
                .setLabel("Modifié Rôle")
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
              `Message de bienvenue lorsque qu'un utilisateur rejoint ton serveur Discord.\n\nModifie le salon, le rôle attribué lors de l'arrivé du membre ou carrément désactive le message de bienvenue de ton serveur.\n\nSalon actuel : \`${serverConfig.welcomeChannelName}\`\nRôle actuel : \`${serverConfig.roleWelcomeName}\``
            )
            .setThumbnail(
              "https://cdn.pixabay.com/photo/2016/03/31/21/33/greeting-1296493_1280.png"
            )
            .setColor("#b3c7ff");
          const rowWelcome = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("WELCOME_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            ).addComponents(
              new ButtonBuilder()
                .setCustomId("WELCOME_ROLE")
                .setEmoji("🕵")
                .setLabel("Modifié Rôle")
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
              `Message qui s'affiche dans le salon que tu veux pour avertir ta communauté qu'un de tes membres vient de prendre un niveau !\n\nModifie le salon ou carrément désactive les messages d'expérience de ton serveur.\nPour mieux faire, tu peux même désactiver les messages de bienvenue envoyer par Discord !\n\nSalon actuel : \`${serverConfig.implicationsChannelName}\``
            )
            .setThumbnail(
              "https://supermonday.io/wp-content/uploads/2023/01/brain-g13f32aaed_1920.png"
            )
            .setColor("#b3c7ff");
          const rowImplication = new ActionRowBuilder()
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
              `Un salon qui peut permettre a ta communautée de proposer une amélioration à ton serveur.\n__Chaque personne qui envoie un simple message sera transformé directement en suggestion avec bouton pour pouvoir réagir__ !\n\nModifie le salon ou carrément désactive les 𝐒uggestions de ton serveur.\n\nSalon actuel : \`${serverConfig.suggestionsChannelName}\``
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
              `Permet à toute ta communautée de récupérer un bonus quotidien d'expérience de **200 XP**, récupérable une fois __toute les 23H__. Un bonus cumulable de 2% sera appliqué au bout de 7 jours consécutifs.\n\nModifie le salon ou carrément désactive le 𝐃aily de ton serveur.\n\n✔️ pour envoyé le message de récupération de 𝐃aily dans ton salon !\n\nSalon actuel : \`${serverConfig.dailyChannelName}\``
            )
            .setThumbnail(
              "https://papycha.fr/wp-content/uploads/2019/08/84863418061.png"
            )
            .setColor("#b3c7ff");
          const rowDaily = new ActionRowBuilder()
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
            .setTitle("`丨𝐂onfiguration 𝐑ôles des niveaux丨`")
            .setDescription("Gestion des rôles de niveau, tu peux modifié les rôles donné lorsque un utilisateur passe niveau 1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45 et 50. Tu peux faire cela sur le prestige 1 aussi.")
            .setThumbnail(
              "https://cdn-icons-png.flaticon.com/512/33/33056.png"
            )
            .setColor("#b3c7ff");
            
          const rowRoles = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("ROLE_LISTE")
                .setEmoji("📅")
                .setLabel("Liste")
                .setStyle(ButtonStyle.Secondary)
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

          case "TICKET":
          const TICKETEmbed = new EmbedBuilder()
            .setTitle("`丨𝐂onfiguration 𝐓icket丨`")
            .setDescription(`Système de 𝐓icket qui permettra à tous tes utilisateurs lors d'un problème d'ouvrir un salon disponible uniquement pour les modérateurs. Ainsi il pourra exposer son problème.\n\nModifie le salon ou carrément désactive les 𝐓ickets de ton serveur.\n\n✔️ pour envoyé le message initial des 𝐓ickets dans ton salon !\n\nSalon actuel : \`${serverConfig.ticketChannelName}\`\nRole actuel : \`${serverConfig.ticketAdminRoleName}\``)
            .setThumbnail(
              "https://www.pngall.com/wp-content/uploads/12/Ticket-PNG-Free-Image.png"
            )
            .setColor("#b3c7ff");
            
          const rowTicket = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("TICKET_PUSH")
                .setEmoji("✔️")
                .setLabel("Envoyé")
                .setStyle(ButtonStyle.Secondary)
            ).addComponents(
              new ButtonBuilder()
                .setCustomId("TICKET_BUTTON")
                .setEmoji("📝")
                .setLabel("Modifié Salon")
                .setStyle(ButtonStyle.Primary)
            ).addComponents(
              new ButtonBuilder()
                .setCustomId("TICKET_ROLE")
                .setEmoji("👮‍♂️")
                .setLabel("Administrateur Rôles")
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
            embeds: [TICKETEmbed],
            components: [rowTicket],
          });
          break;
        default:
          await interaction.reply("Option invalide");
          break;
      }
    }
  },
};

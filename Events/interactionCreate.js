const {
  ActionRowBuilder,
  PermissionsBitField,
  ButtonBuilder,
  EmbedBuilder,
  ChannelType,
  ButtonStyle,
} = require("discord.js");
const mongoose = require("mongoose");
const config = require("../config");
const User = require("../models/experience");
const levelUp = require("../models/levelUp");
const interactionSetConfig = require("./interactionsetconfig");
const ServerRole = require("../models/serverRole");
const {
  logRequestMessageIds,
  welcomeRequestMessageIds,
  reglementRequestMessageIds,
  RolereglementRequestMessageIds,
  RoleWelcomeRequestMessageIds,
  implicationRequestMessageIds,
  dailyRequestMessageIds,
  suggestionsRequestMessageIds,
  roleChannelRequestMessageIds,
  ticketRequestMessageIds,
  RoleAdminRequestMessageIds,
} = require("../models/shared");
const ServerConfig = require("../models/serverConfig");

mongoose.connect(config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const usersVoted = new Map();

module.exports = {
  name: "interactionCreate",
  async execute(interaction, bot) {
    //Tous les embeds de Métiers pour New World
    if (interaction.isStringSelectMenu()) {
      let choice = interaction.values[0];
      if (choice == "TANNERIE") {
        let Tannerie050 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 1412 x Peau brute\n • 353 x `Cuir brut` (*Tannerie 3*)\n\n Coût net total ~ `808,37` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tannerie50100 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 50 à 100\`丨🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n725 x Tanin mâture\n 11600 x Peau brute\n • 2900 x Cuir brut (*Tannerie 3*)\n •• 725 x `Cuir corroyé` (*Tannerie 3*)\n\n Coût net total ~ `5495,50` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tannerie100150 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n642 x Tanin mâture\n 3852 x Peau épaisse\n • 1284 x Cuir corroyé (*Tannerie 3*)\n •• 725 x `Cuir épais` (*Tannerie 4*)\n\n Coût net total ~ `8326,74` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tannerie150200 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n1602 x Tanin mâture\n 9609 x Peau épaisse\n • 3203 x Cuir corroyé (*Tannerie 3*)\n • 2082 x Cuir épais (*Tannerie 4*)\n • 8328 x Peau de fer\n • 1041 x Tanin mâture\n •• 1041 x `Cuir imprégné` (*Tannerie 5*)\n\n Coût net total ~ `19081,53` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Tannerie050, Tannerie50100, Tannerie100150, Tannerie150200],
        });
        setTimeout(() => interaction.deleteReply(), 600000);
      }
      if (choice == "TISSAGE") {
        let Tissage050 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 1336 x Fibres\n • 334 x `Lin` (*Métier à tisser 3*)\n\n Coût net total ~ `390,78` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tissage50100 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 50 à 100\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n2740 x Lin\n 685 x Triplure en tissefer\n • 685 x `Satin` (*Métier à tisser 3*)\n\n Coût net total ~ `3630,50` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tissage100150 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n3642 x Fils de soie\n 1214 x Satin\n 607 x Triplure en tissefer\n • 607 x `Soie` (*Métier à tisser 4*)\n\n Coût net total ~ `6792,33` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tissage150200 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n9083 x Fils de soie\n 3028 x Satin\n 1514 x Triplure en tissefer\n • 1968 x Soie (*Métier à tisser 4*)\n • 984 x Triplure en tissefer\n • 7872 x Souchet (*Métier à tisser 5*)\n •• 984 x `Soie imprégnée` (*Métier à tisser 5*)\n\n Coût net total ~ `26723,17` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Tissage050, Tissage50100, Tissage100150, Tissage150200],
        });
        setTimeout(() => interaction.deleteReply(), 600000);
      }
      if (choice == "CUISINE") {
        let Cuisine050 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/kaao.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 346 x Viande rouge\n 346 x Champignon\n • 346 x `Ration de voyage` (*Cuisine 2*)\n\n Coût net total ~ `96,90` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Cuisine50100 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/kaao.png")
          .setTitle(`\`Niveau 50 à 100\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n690 x Chou\n 690 x Viande rouge\n 690 x Champignon\n • 690 x `Repas léger` (*Cuisine 3*)\n\n Coût net total ~ `386,40` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Cuisine100150 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/kaao.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n3950 x Chou\n 3950 x Viande rouge\n 3950 x Champignon\n • 3950 x `Repas léger` (*Cuisine 3*)\n\n Coût net total ~ `2212,00` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Cuisine150200 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/kaao.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n1050 x Haricot vert\n 1050 x Viande rouge\n 1050 x Champignon\n 1050 x Courge\n 1050 x Miel\n • 1050 x Repas Copieux (*Cuisine 5*)\n\n Coût net total ~ `1585,50` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Cuisine050, Cuisine50100, Cuisine100150, Cuisine150200],
        });
        setTimeout(() => interaction.deleteReply(), 600000);
      }
      if (choice == "ARTS") {
        let Arts050 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/i73x.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 334 x Amanite chaudron\n 334 x Vrille de rampesol\n 334 x Eau\n • 334 x `Teinture mère de dépérissement ordinaire` (*Réserve dédiée aux arts obscurs 2*)\n\n Coût net total ~ `340,68` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Arts50100 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/i73x.png")
          .setTitle(`\`Niveau 50 à 100\`丨 🟩🟩⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 1035 x Anneau d'amanite tue-mouches\n 1035 x Vrille de rampesol\n 1035 x Eau\n • 1035 x `Teinture mère de dépérissement puissante` (*Réserve dédiée aux arts obscurs 3*)\n\n Coût net total ~ `2649,60` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Arts100150 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/i73x.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩🟩⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 1432 x Peau de lumécaille\n 895 x Noirétoffe\n 716 x Fer des fées\n 1074 x Grain de la mort\n • 179 x `Gantelets du néant en métal stellaire` (*Réserve dédiée aux arts obscurs 4*)\n\n Coût net total ~ `4850,01` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Arts150200 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/i73x.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩🟩⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 4560 x Peau brute\n • 1140 x Cuir brut (Tannerie 3)\n • 1425 x Fer des fées\n • 2280 x Bois sauvage\n • 1710 x Grain de la vie\n •• 285 x `Bâton de la vie en orichalque` (*Réserve dédiée aux arts obscurs 5*)\n\n Coût net total ~ `8760,90` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Arts050, Arts50100, Arts100150, Arts150200],
        });
        setTimeout(() => interaction.deleteReply(), 600000);
      }
      if (choice == "JOALLERIE") {
        let Joallerie0100 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/46/fiju.png")
          .setTitle(`\`Niveau 0 à 100\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 348 x Pierre de lune impure taillée\n 348 x Chaîne en argent\n 348 x Fixation en argent\n 348 x Lingot d'argent\n • 348 x `Lustré Amulette de pierre de lune impure` (*Poste d'équipement 2*)\n\n Coût net total ~ `873,48` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Joallerie100200 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/46/fiju.png")
          .setTitle(`\`Niveau 100 à 200\`丨 🟩🟩🟩`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 41552 x Minerai d'argent\n • 10388 x Lingot d'argent (*Fonderie 3*)\n •• 2597 x FIxation en argent (*Poste d'équipement 2*)\n •• 2597 x Émeraude taillée\n •• 2597 x Bande en argent\n ••• 2597 x `Trempé Anneau d'émeraude` (*Poste d'équipement 3*)\n\n Coût net total ~ `29605,80` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 16/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Joallerie0100, Joallerie100200],
        });
        setTimeout(() => interaction.deleteReply(), 600000);
      }
      if (choice == "AMEUBLEMENT") {
        let Ameublement050 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩🟩⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 1695 x Lin\n 565 x Triplure en tissefer\n 565 x Fibres\n • 113 x `Tapis soleil rond` (*Atelier 2*)\n\n Coût net total ~ `2826,13` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Ameublement50100 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 50 à 100\`丨 🟩🟩🟩`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 11385 x Lin\n 3795 x Triplure en tissefer\n 3795 x Fibres\n • 759 x `Tapis soleil rond` (*Atelier 2*)\n\n Coût net total ~ `18982,59` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Ameublement100150 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩🟩🟩`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 3080 x Cuir épais\n 880 x Plumes\n 88 x Peau d'ours immaculée\n • 88 x `Tapis en peau d'ours brun` (*Atelier 2*)\n\n Coût net total ~ `40588,68` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Ameublement150200 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩🟩🟩`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 19005 x Cuir épais\n 5430 x Plumes\n 543 x Peau d'ours immaculée\n • 543 x `Tapis en peau d'ours brun` (*Atelier 2*)\n\n Coût net total ~ `250450,61` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [
            Ameublement050,
            Ameublement50100,
            Ameublement100150,
            Ameublement150200,
          ],
        });
        setTimeout(() => interaction.deleteReply(), 600000);
      }
      if (choice == "TAILLEUR") {
        let Tailleur050 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 88 x Aigue-marine impure\n 176 x Grain de l'eau\n • 88 x `Aigue-marine impure taillée` (*Table de tailleur de pierre 3*)\n\n Coût net total ~ `319,44` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 20/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tailleur50100 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 50 à 100\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 470 x Grain de l'eau\n • 94 x Volute de l'eau (*Réserve dédiée aux arts obscurs 3*)\n • 282 x Aigue-marine impure\n • 188 x Dissolvant pur\n •• 94 x `Aigue-marine` (*Table de tailleur de pierre 3*)\n\n Coût net total ~ `981,36` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tailleur100150 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩🟩⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 2520 x Grain du feu\n • 504 x Volute du feu (*Réserve dédiée aux arts obscurs 3*)\n •• 126 x Essence du feu\n •• 504 x Rubis\n •• 252 x Dissolvant pur\n ••• 126 x `Rubis éclatant` (*Table de tailleur de pierre 4*)\n\n Coût net total ~ `4576,32` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tailleur150200 = new EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/ozh4.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 380 x Dissolvant pur\n 190 x Quintessence de la terre\n 950 x Ambre éclatant\n • 190 x `Ambre immaculé` (*Table de tailleur de pierre 5*)\n\n Coût net total ~ `17394,50` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Tailleur050, Tailleur50100, Tailleur100150, Tailleur150200],
        });
        setTimeout(() => interaction.deleteReply(), 600000);
      }
    }

    //Bouton Daily, pour récupérer son bonus quotidien.
    if (interaction.customId === "DAILYXP") {
      const user = await User.findOne({
        serverID: interaction.guild.id,
        userID: interaction.user.id,
      });

      if (!user) {
        return interaction.reply({
          content:
            "Avant de vouloir récupérer ton bonus, ne veux-tu pas d'abord faire un peu connaissance avec tes nouveaux camarades ?",
          ephemeral: true,
        });
      }

      const now = new Date();
      const lastClaim = user.lastDaily;
      const msIn47Hours = 47 * 60 * 60 * 1000;
      const msIn23Hours = 23 * 60 * 60 * 1000;
      const daysInWeek = 7;
      let resetConsecutiveDaily = false;

      if (lastClaim && now.getTime() - lastClaim.getTime() < msIn47Hours) {
        const timeSinceLastClaim = now.getTime() - lastClaim.getTime();

        if (timeSinceLastClaim < msIn23Hours) {
          const timeRemaining = msIn23Hours - timeSinceLastClaim;
          const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
          const minutesRemaining = Math.floor(
            (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
          );
          const secondsRemaining = Math.floor(
            (timeRemaining % (60 * 1000)) / 1000
          );

          let timeRemainingMessage = "";
          if (hoursRemaining > 0) {
            timeRemainingMessage += `\`${hoursRemaining} heure(s)\`, `;
          }
          if (minutesRemaining > 0) {
            timeRemainingMessage += `\`${minutesRemaining
              .toString()
              .padStart(2, "0")} minute(s)\` et `;
          }
          timeRemainingMessage += `\`${secondsRemaining
            .toString()
            .padStart(2, "0")} seconde(s)\``;

          return interaction.reply({
            content: `Tu dois attendre encore ${timeRemainingMessage} avant de pouvoir récupérer ton daily !`,
            ephemeral: true,
          });
        }

        user.consecutiveDaily += 1;
      } else {
        resetConsecutiveDaily = true;
        user.consecutiveDaily = 1;
      }

      if (user.consecutiveDaily > user.maxDaily) {
        user.maxDaily = user.consecutiveDaily;
      }

      const baseXP = 200;
      const weeksConsecutive = Math.floor(user.consecutiveDaily / daysInWeek);
      const bonusXP = baseXP * 0.02 * weeksConsecutive;
      const totalXP = baseXP + bonusXP;

      user.xp += totalXP;
      user.lastDaily = now;
      levelUp(interaction, user, user.xp);

      let dailyMessage;

      if (resetConsecutiveDaily) {
        dailyMessage = `\`${interaction.user.username}\` 𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !\n\n 𝐌ais tu as perdu toute tes flammes \`1\` :fire:\n 𝐓on ancien record est de \`${user.maxDaily}\``;
      } else if (user.consecutiveDaily === 1) {
        dailyMessage = `\`${interaction.user.username}\` 𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !`;
      } else {
        dailyMessage = `\`${interaction.user.username}\` 𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !\n\n 𝐓u es en feu \`${user.consecutiveDaily}\` :fire:\n 𝐓on record est de \`${user.maxDaily}\``;
      }

      const dailyEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(dailyMessage)
        .setFooter({
          text: `丨`,
          iconURL: interaction.user.displayAvatarURL({
            dynamic: true,
            size: 64,
          }),
        })
        .setTimestamp();
      interaction.reply({ embeds: [dailyEmbed], ephemeral: true });

      //LOG Pour Daily.
      const serverInfo = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });

      if (serverInfo || !serverInfo.logChannelID) {
        const XPLOG = new EmbedBuilder()
          .setColor("Orange")
          .setTitle(
            `\`${interaction.user.username}\` 𝐕ient de récuperer son bonus quotidien. 💸`
          )
          .setFooter({
            text: `丨`,
            iconURL: interaction.user.displayAvatarURL({
              dynamic: true,
              size: 64,
            }),
          })
          .setTimestamp();

        const logChannel = bot.channels.cache.get(serverInfo.logChannelID);
        logChannel.send({ embeds: [XPLOG] });
      }
    }

    //SelectMenu pour le channel rôle, sélecteur de jeux.
    if (interaction.isStringSelectMenu()) {
      const member = interaction.member;

      if (interaction.customId === "RoleCustomID") {
        let choice = interaction.values[0];
        interaction.deferReply({ ephemeral: true }).then(() => {
          if (choice == "APEX") {
            const roleID = "811662603713511425";
            handleRole(interaction, member, roleID, "Apex Legends");
          } else if (choice == "NEWORLD") {
            const roleID = "907320710559576105";
            handleRole(interaction, member, roleID, "New World");
          } else if (choice == "FOREST") {
            const roleID = "1078754580113920020";
            handleRole(interaction, member, roleID, "Sons of The Forest");
          } else if (choice == "CALLOF") {
            const roleID = "813800188317663254";
            handleRole(interaction, member, roleID, "Call of Duty");
          } else if (choice == "ROCKET") {
            const roleID = "811663563558092841";
            handleRole(interaction, member, roleID, "Rocket League");
          } else if (choice == "MINECRAFT") {
            const roleID = "811663653140168741";
            handleRole(interaction, member, roleID, "Minecraft");
          }
        });
      } else if (interaction.customId === interactionSetConfig.name) {
        interactionSetConfig.execute(interaction);
      }
    }

    async function handleRole(interaction, member, roleID, roleName) {
      if (member.roles.cache.some((role) => role.id == roleID)) {
        await member.roles.remove(roleID);
        interaction.editReply({
          content: `Votre rôle \`${roleName}\` a été supprimé.`,
        });
      } else {
        await member.roles.add(roleID);
        interaction.editReply({
          content: `Vous avez récupéré votre rôle \`${roleName}\`.`,
        });
      }
    }

    // Validation règlement avec rôle
    if (interaction.customId === "VALID_REGL") {
      const guild = await interaction.client.guilds.fetch(interaction.guildId);
      const member = await guild.members.fetch(interaction.user.id);

      const serverConfig = await ServerConfig.findOne({ serverID: guild.id });

      if (serverConfig && serverConfig.roleReglementID) {
        const roleId = serverConfig.roleReglementID;

        if (!guild.roles.cache.has(roleId)) {
          await interaction.reply({
            content: `Le rôle ${roleId} n'existe pas sur ce serveur.`,
            ephemeral: true,
          });
          return;
        }

        if (member.roles.cache.has(roleId)) {
          await interaction.reply({
            content:
              "Tu as déjà validé le règlement, quelque chose à te reprocher peut-être ?? :thinking:",
            ephemeral: true,
          });
          return;
        }

        try {
          await member.roles.add(roleId);
          await interaction.reply({
            content:
              "Merci d'avoir pris connaissance du règlement. :sunglasses:",
            ephemeral: true,
          });
        } catch (error) {
          if (error.code === 50013) {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content:
                  "Contact un modérateur avec l'erreur suivante : Le bot doit être `tout en haut` dans la liste des rôles du serveur. N'oublie pas de me mettre `administrateur`.\nUne fois que c'est fait tu pourras validé le règlement !",
                ephemeral: true,
              });
            } else if (interaction.deferred || interaction.replied) {
              await interaction.followUp({
                content:
                  "Contact un modérateur avec l'erreur suivante : Le bot doit être `tout en haut` dans la liste des rôles du serveur. N'oublie pas de me mettre `administrateur`.\nUne fois que c'est fait tu pourras validé le règlement !",
                ephemeral: true,
              });
            }
          } else {
            console.error(error);
          }
        }
      }
    }

    //Bouton pour Ticket => Création salon avec fermeture une fois terminé.
    if (interaction.customId === "CREATE_CHANNEL") {
      const serverConfig = await mongoose
        .model("ServerConfig")
        .findOne({ serverID: interaction.guild.id });
      const StreamCordBOTId = "375805687529209857";
      const DisboardBOTId = "302050872383242240";
      const AdminRoleID = serverConfig.ticketAdminRoleID;
      await interaction.deferReply({ ephemeral: true });

      const parentChannel = interaction.channel;

      let permissionOverwrites = [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user,
          allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ViewChannel,
          ],
        },
        {
          id: StreamCordBOTId,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: DisboardBOTId,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
      ];

      if (AdminRoleID) {
        permissionOverwrites.push({
          id: AdminRoleID,
          allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ViewChannel,
          ],
        });
      }

      let channel = await interaction.guild.channels.create({
        name: `🎫丨𝐓icket丨${interaction.user.username}`,
        parent: parentChannel.parentId,
        type: ChannelType.GuildText,
        permissionOverwrites: permissionOverwrites,
      });

      const clearembed = new EmbedBuilder()
        .setDescription(
          `${interaction.user}\n丨𝐓on dossier va être étudié, __merci d'être patient__, notre équipe s'occupe de tout !`
        )
        .setColor("Blue");

      const deletebutton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("DELETE_TICKET")
          .setEmoji("❌")
          .setLabel("Supprimer le ticket")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        embeds: [clearembed],
        components: [deletebutton],
      });

      if (!AdminRoleID) {
        await channel.send(
          "⚠丨__**Attention**__丨Le rôle d'administrateur __n'est pas__ défini pour la gestion des tickets."
        );
      }

      await interaction.editReply({
        content: "Ticket créé avec succès !",
      });
    }
    if (interaction.customId === "DELETE_TICKET") {
      const surbutton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("VALID_DELETE")
            .setLabel("Oui")
            .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("PAS_SUPPRIMER")
            .setLabel("Non")
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.reply({
        content: "**Es-tu sur de vouloir supprimer ce ticket ?**",
        components: [surbutton],
        ephemeral: true,
      });
    }
    if (interaction.customId === "VALID_DELETE") {
      await interaction.guild.channels.delete(interaction.channel);
    }

    // Boutton suggestion
    if (interaction.customId === "ACCEPTSUGG") {
      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });

      if (!serverConfig || !serverConfig.logChannelID) {
        return;
      }

      const messageVotes = usersVoted.get(interaction.message.id) || new Map();

      if (messageVotes.has(interaction.user.id)) {
        const previousVote = messageVotes.get(interaction.user.id);
        const alreadyVotedMessage =
          previousVote === "ACCEPTSUGG"
            ? "Eh non! Tu as déjà voté `POUR` à cette suggestion !"
            : "Eh non! Tu as déjà voté `CONTRE` à cette suggestion !";

        await interaction.reply({
          content: alreadyVotedMessage,
          ephemeral: true,
        });
        return;
      }

      messageVotes.set(interaction.user.id, interaction.customId);
      usersVoted.set(interaction.message.id, messageVotes);

      const embed = interaction.message.embeds[0];
      const indexToUpdate = interaction.customId === "ACCEPTSUGG" ? 1 : 2;

      const newFieldValue = parseInt(embed.fields[indexToUpdate].value) + 1;
      embed.fields[indexToUpdate].value = newFieldValue.toString();

      const updatedEmbed = new EmbedBuilder()
        .setColor(embed.color)
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(embed.fields);

      await interaction.message.edit({ embeds: [updatedEmbed] });

      await interaction.reply({
        content: `**Merci. Ton vote à bien été pris en compte. N'hésite surtout pas à commenter ton choix dans le __fil__ de la suggestion. :bulb:**`,
        ephemeral: true,
      });

      const ACCEPTSUGGLOG = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(
          `:ok: \`${interaction.user.username}\` 𝐕ient de réagir positivement à la suggestion :\n\n\`"${embed.description}"\`.`
        )
        .setFooter({
          text: `丨`,
          iconURL: interaction.user.displayAvatarURL({
            dynamic: true,
            size: 64,
          }),
        })
        .setTimestamp();

      const logChannel = bot.channels.cache.get(serverConfig.logChannelID);
      logChannel.send({ embeds: [ACCEPTSUGGLOG] });
    }
    if (interaction.customId === "NOPSUGG") {
      const serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });

      if (!serverConfig || !serverConfig.logChannelID) {
        return;
      }

      const messageVotes = usersVoted.get(interaction.message.id) || new Map();

      if (messageVotes.has(interaction.user.id)) {
        const previousVote = messageVotes.get(interaction.user.id);
        const alreadyVotedMessage =
          previousVote === "ACCEPTSUGG"
            ? "Eh non! Tu as déjà voté `POUR` à cette suggestion !"
            : "Eh non! Tu as déjà voté `CONTRE` à cette suggestion !";

        await interaction.reply({
          content: alreadyVotedMessage,
          ephemeral: true,
        });
        return;
      }

      messageVotes.set(interaction.user.id, interaction.customId);
      usersVoted.set(interaction.message.id, messageVotes);

      const embed = interaction.message.embeds[0];
      const indexToUpdate = interaction.customId === "ACCEPTSUGG" ? 1 : 2;

      const newFieldValue = parseInt(embed.fields[indexToUpdate].value) + 1;
      embed.fields[indexToUpdate].value = newFieldValue.toString();

      const updatedEmbed = new EmbedBuilder()
        .setColor(embed.color)
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setThumbnail(embed.thumbnail.url)
        .addFields(embed.fields);

      await interaction.message.edit({ embeds: [updatedEmbed] });

      await interaction.reply({
        content: `**Merci. Ton vote à bien été pris en compte. N'hésite surtout pas à commenter ton choix dans le __fil__ de la suggestion. :bulb:**`,
        ephemeral: true,
      });

      const NOPSUGGLOG = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(
          `:x: \`${interaction.user.username}\` 𝐕ient de réagir négativement à la suggestion :\n\n\`"${embed.description}"\`.`
        )
        .setFooter({
          text: `丨`,
          iconURL: interaction.user.displayAvatarURL({
            dynamic: true,
            size: 64,
          }),
        })
        .setTimestamp();

      const logChannel = bot.channels.cache.get(serverConfig.logChannelID);
      logChannel.send({ embeds: [NOPSUGGLOG] });
    }

    // Actualisation du ping
    if (interaction.customId === "PING_BUTTON") {
      let reloadPing = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("PING_BUTTON")
          .setEmoji("🔄")
          .setLabel("Actualiser")
          .setStyle(ButtonStyle.Success)
      );
      const pingUser = Date.now() - interaction.createdTimestamp;
      let emojiUser;
      if (pingUser < 200) {
        emojiUser = "🟢";
      } else if (pingUser < 400 && pingUser > 200) {
        emojiUser = "🟠";
      } else if (pingUser > 400) {
        emojiUser = "🔴";
      }
      // Ping de l'API de discord
      const APIPing = bot.ws.ping;
      let APIemoji;
      if (APIPing < 200) {
        APIemoji = "🟢";
      } else if (APIPing < 400 && APIPing > 200) {
        APIemoji = "🟠";
      } else if (APIPing > 400) {
        APIemoji = "🔴";
      }

      let PingEmbed = new EmbedBuilder()
        .setDescription(
          `
          \`${emojiUser}\`丨Votre ping : **${pingUser}ms** :fish:
          \`${APIemoji}\`丨BOT TBM_CPU ping : **${APIPing}ms**`
        )
        .setColor("#b3c7ff");

      await interaction.deferUpdate();
      await interaction.editReply({
        embeds: [PingEmbed],
        components: [reloadPing],
        ephemeral: true,
      });
    }

    //Gestion du SetConfig
    if (interaction.customId === "LOG_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon de `𝐋og` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      logRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "ROLES_LISTE") {
      const serverRoles = await ServerRole.findOne({
        serverID: interaction.guild.id,
      });

      const rowRolesListe = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ROLES_PERSOLISTE")
          .setEmoji("🖌️")
          .setLabel("Modifié les rôles")
          .setStyle(ButtonStyle.Secondary)
      );

      if (!serverRoles) {
        return interaction.reply({
          content: "Il n'y a pas de rôles stockés pour ce serveur.",
          components: [rowRolesListe],
        });
      }

      const levels = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

      const prestige0Roles = serverRoles.prestige0Roles
        .map(
          (id, index) =>
            `Niveau ${levels[index]} | ${
              interaction.guild.roles.cache.get(id)?.toString() ||
              "Rôle inconnu"
            }`
        )
        .join("\n");
      const prestige1Roles = serverRoles.prestige1Roles
        .map(
          (id, index) =>
            `Niveau ${levels[index]} | ${
              interaction.guild.roles.cache.get(id)?.toString() ||
              "Rôle inconnu"
            }`
        )
        .join("\n");

      const roleEmbed = new EmbedBuilder()
        .setTitle("Liste des Rôles")
        .setColor("#b3c7ff")
        .setDescription(
          `__**Rôles Prestige 0 :**__\n ${prestige0Roles}\n\n__**Rôles Prestige 1 :**__\n ${prestige1Roles}`
        );

      interaction.reply({ embeds: [roleEmbed], components: [rowRolesListe] });
    }
    if (interaction.customId === "ROLES_PERSOLISTE") {
      let currentPrestige = "prestige0Roles";
      await interaction.reply(
        "Veuillez **répondre** avec les rôles personnalisés pour le prestige `0` (Niveau avant le prestige `1`). Vous pouvez entrer jusqu'à 12 rôles, séparés par des virgules. (123456789, 123456789 etc ... )"
      );

      const collector = interaction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id,
        time: 60000,
      });

      collector.on("collect", async (m) => {
        const roles = m.content.split(",").map((role) => role.trim());

        if (roles.length > 12) {
          interaction.followUp(
            "Vous avez entré trop de rôles. Veuillez entrer jusqu'à 12 rôles __maximum__."
          );
          return;
        }

        const rolesInGuild = interaction.guild.roles.cache.map(
          (role) => role.id
        );
        const rolesExist = roles.every((role) => rolesInGuild.includes(role));

        if (!rolesExist) {
          interaction.followUp(
            "Un ou plusieurs rôles que vous avez entrés n'existent pas sur ce serveur. Veuillez vérifier les ID's des rôles et réessayer."
          );
          return;
        }

        let server = await ServerRole.findOne({
          serverID: interaction.guild.id,
        });

        if (!server) {
          server = new ServerRole({
            serverID: interaction.guild.id,
            serverName: interaction.guild.name,
            prestige0Roles: [],
            prestige1Roles: [],
          });
        }
        server[currentPrestige] = roles;
        await server.save();

        if (currentPrestige === "prestige0Roles") {
          interaction.followUp(
            "Rôles pour le prestige `0` enregistrés avec succès ! Veuillez maintenant entrer les rôles pour le prestige `1`. N'oubliez pas, vous pouvez entrer jusqu'à 12 rôles, séparés par des virgules."
          );
          currentPrestige = "prestige1Roles";
        } else {
          interaction.followUp(
            "**Tous les rôles ont été enregistrés avec succès !**"
          );
          collector.stop();
        }
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          interaction.followUp(
            "__**Le temps pour entrer les rôles est écoulé. Veuillez réessayer.**__"
          );
        }
      });
    }
    if (interaction.customId === "WELCOME_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon de `𝐁ienvenue` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      welcomeRequestMessageIds[serverId] = message.id;
    }
    if (interaction.customId === "REGL_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de répondre avec le nom __exact__ ou l'ID du salon de `𝐑èglement` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      reglementRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "REGL_PUSH") {
      let serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
      if (!serverConfig || !serverConfig.reglementChannelID) {
        return interaction.reply({
          content:
            "Aucun salon de 𝐑èglement n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salon`.",
          ephemeral: true,
        });
      }

      const Reglementembed = new EmbedBuilder()
        .setColor("#b3c7ff")
        .setTitle(
          `*_~𝐑èglement de la ${interaction.guild.name} pour votre bonne formation~_*`
        )
        .setDescription(
          `\n**Merci de bien vouloir lire toute les règles ainsi que de les respecter !**\n\n:wave:\`丨𝐁ienvenue :\` \nTout d'abord bienvenue parmi nous. Tu peux à présent lire et valider le règlement puis choisir tes rôles dans le salon \`Rôles\`. Si tu es un streamer, tu peux obtenir le rôle \`Streamer\` pour avoir les notifications de TES lives sur notre serveur ! Pour toute demande, informations ou signalement, tu peux ouvrir un ticket dans le \`salon prévu à cet effet\`, un modérateur se fera un plaisir de te répondre.\n\n:rotating_light:\`丨𝐌entions :\`\n Évitez les mentions inutiles et \`réfléchissez\` avant de poser une question. Vous n'êtes pas seuls et les réponses ont souvent déjà été données. Il sera punissable d'une \`exclusion\` et/ou d'un \`bannissement\` avec sursis.\n\n:warning:\`丨𝐏ublicités :\`\n Toute publicité \`non autorisé\` par un membre du staff est \`strictement interdite\` sur le serveur mais également par message privé. Il sera punissable d'une \`exclusion\` et/ou d'un \`bannissement\` avec sursis.\n\n:underage:\`丨𝐍SFW :\`\nNSFW, NSFL et le contenu malsain n'est \`pas autorisé\` sur le serveur. Il sera punissable d'un \`bannissement\` !\n\n:flag_fr:\`丨𝐅rançais :\`\nLa structure est \`francophone\`, veuillez donc écrire français uniquement pour une compréhension facile de tous les membres de la communauté. Il sera punissable si les avertissements sont répétés et non écoutés.`
        )
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({
          text: `Cordialement l'équipe ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });

      const rowValidRegl = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("VALID_REGL")
          .setLabel("📝丨𝐕alider le 𝐑èglement丨📝")
          .setStyle(ButtonStyle.Success)
      );
      const ReglementChannel = bot.channels.cache.get(
        serverConfig.reglementChannelID
      );
      if (ReglementChannel) {
        ReglementChannel.send({
          embeds: [Reglementembed],
          components: [rowValidRegl],
        });
      }
    }
    if (interaction.customId === "REGL_ROLE") {
      const message = await interaction.reply({
        content:
          "\n__**N'OUBLIE PAS DE ME METTRE TOUT EN HAUT DANS LA LISTE DE TES RÖLES.**__\n\nMerci de **répondre** en faisant un tag (@votre_rôle) pour donner le rôle lorsque votre utilisateur validera le `𝐑èglement`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      RolereglementRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "WELCOME_ROLE") {
      const message = await interaction.reply({
        content:
          "\n__**N'OUBLIE PAS DE ME METTRE TOUT EN HAUT DANS LA LISTE DE TES RÖLES.**__\n\nMerci de **répondre** en faisant un tag (@votre_rôle) pour donner le rôle lorsque votre utilisateur validera le `𝐑èglement`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      RoleWelcomeRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "IMPLICATION_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon pour `𝐈mplications` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      implicationRequestMessageIds[serverId] = message.id;
    }
    if (interaction.customId === "DAILY_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon pour le `𝐃aily` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      dailyRequestMessageIds[serverId] = message.id;
    }
    if (interaction.customId === "DAILY_PUSH") {
      let serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
      if (!serverConfig || !serverConfig.dailyChannelID) {
        return interaction.reply({
          content:
            "Aucun salon pour le 𝐃aily n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salon`.",
          ephemeral: true,
        });
      }
      const DailyEmbed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle(`――――――∈ 𝐆ain d'𝐗𝐏 journalier ! ∋――――――`)
        .setDescription(
          `\n𝐂'est ici que tu peux récupérer ton \`𝐃aily\`. 𝐈l sera disponible à nouveau après \`23H\`. 𝐍e l'oublie pas, lui en tout cas ne t'oublieras pas haha.`
        )
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({
          text: `𝐂ordialement l'équipe ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });

      const rowPushDaily = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("DAILYXP")
          .setLabel("💸丨𝐑écupérer l'𝐗𝐏丨💸")
          .setStyle(ButtonStyle.Success)
      );
      const dailyChannel = bot.channels.cache.get(serverConfig.dailyChannelID);
      if (dailyChannel) {
        dailyChannel.send({
          embeds: [DailyEmbed],
          components: [rowPushDaily],
        });
      }
    }
    if (interaction.customId === "SUGG_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de **répondre** avec le nom __exact__ ou l'ID du salon pour les `𝐒uggestions` désiré.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      suggestionsRequestMessageIds[serverId] = message.id;
    }
    if (interaction.customId === "ROLECHANNEL_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de répondre avec le nom __exact__ ou l'ID du salon pour les `𝐑oles`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      roleChannelRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "TICKET_BUTTON") {
      const message = await interaction.reply({
        content:
          "Merci de répondre avec le nom __exact__ ou l'ID du salon pour les `𝐓ickets`.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      ticketRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }
    if (interaction.customId === "TICKET_PUSH") {
      let serverConfig = await ServerConfig.findOne({
        serverID: interaction.guild.id,
      });
      if (!serverConfig || !serverConfig.ticketChannelID) {
        return interaction.reply({
          content:
            "Aucun salon pour les 𝐓ickets n'est configuré pour ce serveur. Veuillez en __configurer__ un en séléctionnant `Modifié Salon`.",
          ephemeral: true,
        });
      }
      const TicketEmbed = new EmbedBuilder()
        .setColor("#b3c7ff")
        .setTitle(`―――――― :inbox_tray: 𝐎uvrir un 𝐓icket :inbox_tray: ――――――`)
        .setDescription(
          `\n**𝐌erci de respecter les règles concernant les \`𝐓ickets\` !**\n\n\`1.\` 𝐍e pas créer de ticket sans raison.\n\n\`2.\` 𝐍e pas mentionner le staff sauf si vous n'avez pas eu de réponse durant 24h.\n\n\`3.\` 𝐍e pas créer de ticket pour insulter le staff ou une autre personne.`
        )
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({
          text: `𝐂ordialement, l'équipe ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });

      const rowPushTicket = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("CREATE_CHANNEL")
          .setLabel("🎫丨𝐂réer un 𝐓icket丨🎫")
          .setStyle(ButtonStyle.Primary)
      );
      const ticketChannel = bot.channels.cache.get(
        serverConfig.ticketChannelID
      );
      if (ticketChannel) {
        ticketChannel.send({
          embeds: [TicketEmbed],
          components: [rowPushTicket],
        });
        return interaction.reply({ content: "Embed crée.", ephemeral: true });
      }
    }
    if (interaction.customId === "TICKET_ROLE") {
      const message = await interaction.reply({
        content:
          "\n__**N'OUBLIE PAS DE ME METTRE TOUT EN HAUT DANS LA LISTE DE TES RÖLES.**__\n\nMerci de **répondre** en faisant un tag (@votre_rôle) pour rentrer le rôle d'administration de votre serveur.",
        fetchReply: true,
      });
      const serverId = interaction.guild.id;
      RoleAdminRequestMessageIds[serverId] = message.id;
      setTimeout(() => {
        message.delete();
      }, 60000);
    }

    //Bouton Classement Général
    if (interaction.customId === "LADDER_BUTTON") {
      const guild = interaction.guild;
      const topUsers = await User.find({ serverID: guild.id })
        .sort({ prestige: -1, xp: -1 })
        .limit(10);

      const leaderboardEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle(`Classement du serveur ${guild.name}`)
        .setDescription(
          topUsers
            .map((user, index) => {
              let positionSuffix = "ᵉᵐᵉ";
              let medalEmoji = "";

              switch (index) {
                case 0:
                  positionSuffix = "ᵉʳ";
                  medalEmoji = "🥇";
                  break;
                case 1:
                  medalEmoji = "🥈";
                  break;
                case 2:
                  medalEmoji = "🥉";
                  break;
              }

              return `\n**${index + 1}${positionSuffix} ${medalEmoji}** __**${
                bot.users.cache.get(user.userID)?.username ||
                "Utilisateur inconnu"
              }**__ 丨 Prestige: **\`${
                user.prestige
              }\`** - XP: **\`${user.xp.toLocaleString()}\`**`;
            })
            .join("\n")
        )
        .setThumbnail(guild.iconURL({ dynamic: true }));

      await interaction.reply({ embeds: [leaderboardEmbed] });
      setTimeout(async () => {
        const message = await interaction.fetchReply();
        message.delete();
      }, 15000);
    }

    if (interaction.channel === null) return;
    if (!interaction.isCommand()) return;
    if (!bot.commands.has(interaction.commandName)) return;
    try {
      await bot.commands.get(interaction.commandName).execute(interaction, bot);
    } catch (error) {
      console.error(error);
      if (typeof interaction.reply === "function") {
        interaction.reply({
          content:
            "**Une erreur est survenue lors de l'exécution de la commande -> contact mon créateur `tbmpqf`.**",
          ephemeral: true,
        });
      } else {
        interaction.channel.send({
          content:
            "**Une erreur est survenue lors de l'exécution de la commande -> contact mon créateur `tbmpqf`.**",
        });
      }
    }
  },
};

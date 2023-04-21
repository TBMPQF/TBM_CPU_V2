const {
  ActionRowBuilder,
  PermissionsBitField,
  ButtonBuilder,
  EmbedBuilder,
  ChannelType,
  ButtonStyle,
} = require("discord.js");
const levels = require("discord-xp");
const User = require("../models/daily");
const mongoose = require("mongoose");
const config = require("../config");

mongoose.connect(config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
      const now = new Date();
      const userId = interaction.user.id;
      const username = interaction.user.username;

      User.findOne({ userId }, async (err, user) => {
        if (err) console.error(err);

        if (user) {
          const lastDaily = user.lastClaimed;
          const hoursSinceLastDaily = (now - lastDaily) / (1000 * 60 * 60);
          const minutesSinceLastDaily = (now - lastDaily) / (1000 * 60);

          if (hoursSinceLastDaily >= 23) {
            const premièreclasseRole =
              interaction.guild.roles.cache.get("811724918630645790");
            const caporalRole =
              interaction.guild.roles.cache.get("813795565708115988");
            const caporalchefRole =
              interaction.guild.roles.cache.get("813795488285327362");
            const sergentRole =
              interaction.guild.roles.cache.get("813795598943518732");
            const sergentchefRole =
              interaction.guild.roles.cache.get("813795648791904296");
            const adjudantRole =
              interaction.guild.roles.cache.get("813795701708030014");
            const adjudantchefRole =
              interaction.guild.roles.cache.get("813795755080548393");
            const majorRole =
              interaction.guild.roles.cache.get("813795805726113793");
            const aspirantRole =
              interaction.guild.roles.cache.get("813795871661359124");
            const souslieutnantRole =
              interaction.guild.roles.cache.get("813795921480908840");
            const lieutnantRole =
              interaction.guild.roles.cache.get("813795963805761547");

            const dailyXP = 200;
            const completedWeeks = Math.floor(user.dailyStreak / 7);
            const bonusPercentage = completedWeeks * 2;
            const bonusXP = dailyXP * (bonusPercentage / 100);
            const totalXP = dailyXP + bonusXP;
            const hasLeveledUp = await levels.appendXp(
              interaction.member.id,
              interaction.guild.id,
              totalXP
            );

            if (hasLeveledUp) {
              const user = await levels.fetch(
                interaction.member.id,
                interaction.guild.id
              );
              const channel = bot.channels.cache.get("717154831823011890");
              if (!channel) {
                console.error("Le canal n'a pas été trouvé !");
              } else {
                channel
                  .send(
                    `**${interaction.user}丨**Tu viens de passer au niveau **\`${user.level}\`** en récupérant ton bonus quotidien ! - :worm:`
                  )
                  .catch((error) => {
                    console.error("Erreur lors de l'envoi du message :", error);
                  });
              }
              if (user.level == 2) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${premièreclasseRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("811724918630645790"))
                  .then(interaction.member.roles.remove("825023017645899822"));
              }

              if (user.level == 5) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${caporalRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795565708115988"))
                  .then(interaction.member.roles.remove("811724918630645790"));
              }
              if (user.level == 10) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${caporalchefRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795488285327362"))
                  .then(interaction.member.roles.remove("813795565708115988"));
              }
              if (user.level == 15) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${sergentRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795598943518732"))
                  .then(interaction.member.roles.remove("813795488285327362"));
              }
              if (user.level == 20) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${sergentchefRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795648791904296"))
                  .then(interaction.member.roles.remove("813795598943518732"));
              }
              if (user.level == 25) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${adjudantRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795701708030014"))
                  .then(interaction.member.roles.remove("813795648791904296"));
              }
              if (user.level == 30) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${adjudantchefRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795755080548393"))
                  .then(interaction.member.roles.remove("813795701708030014"));
              }
              if (user.level == 35) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${majorRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795805726113793"))
                  .then(interaction.member.roles.remove("813795755080548393"));
              }
              if (user.level == 40) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${aspirantRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795871661359124"))
                  .then(interaction.member.roles.remove("813795805726113793"));
              }
              if (user.level == 45) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le grade ${souslieutnantRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795921480908840"))
                  .then(interaction.member.roles.remove("813795871661359124"));
              }
              if (user.level == 50) {
                bot.channels.cache
                  .get(`717154831823011890`)
                  .send(
                    `**     丨**Tu débloques le dernier et glorieux grade ${lieutnantRole}. Félicitation ! :tada:`
                  )
                  .then(interaction.member.roles.add("813795963805761547"))
                  .then(interaction.member.roles.remove("813795921480908840"));
              }
            }

            const updatedStreak =
              hoursSinceLastDaily < 47 ? user.dailyStreak + 1 : 1;
            User.updateOne(
              { userId },
              { $set: { lastClaimed: now, dailyStreak: updatedStreak } },
              (err) => {
                if (err) console.error(err);
                if (updatedStreak === 1) {
                  const dailyEmbed = new EmbedBuilder()
              .setColor("Gold")
              .setTitle(
                `\`${
                  interaction.user.username
                }\` 𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !\n\n 𝐓u as perdu toute tes flammes \`1\` :fire:`
              )
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
            bot.channels.cache
              .get("838440585341566996")
              .send({ embeds: [XPLOG] });
                } else {
                  const daily1Embed = new EmbedBuilder()
              .setColor("Gold")
              .setTitle(
                `\`${
                  interaction.user.username
                }\` 𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !\n\n 𝐓u es en feu \`${
                  user.dailyStreak + 1
                }\` :fire:`
              )
              .setFooter({
                text: `丨`,
                iconURL: interaction.user.displayAvatarURL({
                  dynamic: true,
                  size: 64,
                }),
              })
              .setTimestamp();
            interaction.reply({ embeds: [daily1Embed], ephemeral: true });
                }
              }
            )
            
          } else {
            // On calcule le temps restant jusqu'au prochain daily
            const timeUntilNextDaily = Math.round(23 - hoursSinceLastDaily);
            const minutesUntilNextDaily = Math.round((23 * 60) - minutesSinceLastDaily);
            const minutesRemaining = minutesUntilNextDaily % 60;
            const minutesRemainingPadded = String(minutesRemaining).padStart(2, '0');
            interaction.reply({
              content: `Tu dois attendre encore \`${timeUntilNextDaily}h${minutesRemainingPadded}\` avant de pouvoir récupérer ton daily !`,
              ephemeral: true,
            });
          }
        } else {
          const newUser = new User({
            userId,
            lastDaily: now,
            username,
          });

          await newUser.save();

          const premièreclasseRole =
            interaction.guild.roles.cache.get("811724918630645790");
          const caporalRole =
            interaction.guild.roles.cache.get("813795565708115988");
          const caporalchefRole =
            interaction.guild.roles.cache.get("813795488285327362");
          const sergentRole =
            interaction.guild.roles.cache.get("813795598943518732");
          const sergentchefRole =
            interaction.guild.roles.cache.get("813795648791904296");
          const adjudantRole =
            interaction.guild.roles.cache.get("813795701708030014");
          const adjudantchefRole =
            interaction.guild.roles.cache.get("813795755080548393");
          const majorRole =
            interaction.guild.roles.cache.get("813795805726113793");
          const aspirantRole =
            interaction.guild.roles.cache.get("813795871661359124");
          const souslieutnantRole =
            interaction.guild.roles.cache.get("813795921480908840");
          const lieutnantRole =
            interaction.guild.roles.cache.get("813795963805761547");
          const dailyXP = 200;
          const hasLeveledUp = await levels.appendXp(
            interaction.member.id,
            interaction.guild.id,
            dailyXP
          );
          if (hasLeveledUp) {
            const user = await levels.fetch(
              interaction.member.id,
              interaction.guild.id
            );
            bot.channels.cache
              .get(`717154831823011890`)
              .send(
                `**${interaction.user}丨**Tu viens de passer au niveau **\`${user.level}\`** en récupérant ton bonus quotidien ! - :worm:`
              );
            if (user.level == 2) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${premièreclasseRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("811724918630645790"))
                .then(interaction.member.roles.remove("825023017645899822"));
            }
            if (user.level == 5) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${caporalRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795565708115988"))
                .then(interaction.member.roles.remove("811724918630645790"));
            }
            if (user.level == 10) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${caporalchefRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795488285327362"))
                .then(interaction.member.roles.remove("813795565708115988"));
            }
            if (user.level == 15) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${sergentRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795598943518732"))
                .then(interaction.member.roles.remove("813795488285327362"));
            }
            if (user.level == 20) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${sergentchefRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795648791904296"))
                .then(interaction.member.roles.remove("813795598943518732"));
            }
            if (user.level == 25) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${adjudantRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795701708030014"))
                .then(interaction.member.roles.remove("813795648791904296"));
            }
            if (user.level == 30) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${adjudantchefRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795755080548393"))
                .then(interaction.member.roles.remove("813795701708030014"));
            }
            if (user.level == 35) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${majorRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795805726113793"))
                .then(interaction.member.roles.remove("813795755080548393"));
            }
            if (user.level == 40) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${aspirantRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795871661359124"))
                .then(interaction.member.roles.remove("813795805726113793"));
            }
            if (user.level == 45) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le grade ${souslieutnantRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795921480908840"))
                .then(interaction.member.roles.remove("813795871661359124"));
            }
            if (user.level == 50) {
              bot.channels.cache
                .get(`717154831823011890`)
                .send(
                  `**     丨**Tu débloques le dernier et glorieux grade ${lieutnantRole}. Félicitation ! :tada:`
                )
                .then(interaction.member.roles.add("813795963805761547"))
                .then(interaction.member.roles.remove("813795921480908840"));
            }
            const daily1Embed = new EmbedBuilder()
              .setColor("Gold")
              .setTitle(
                `\`${
                  interaction.user.username
                }\` 𝐓u viens de récuperer ton bonus quotidien ! \`+${totalXP} 𝐗p\` :tada: !\n\n 𝐓u es en feu \`${
                  user.dailyStreak + 1
                }\` :fire:`
              )
              .setFooter({
                text: `丨`,
                iconURL: interaction.user.displayAvatarURL({
                  dynamic: true,
                  size: 64,
                }),
              })
              .setTimestamp();
            interaction.reply({ embeds: [daily1Embed], ephemeral: true });
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
            await bot.channels.cache
              .get("838440585341566996")
              .send({ embeds: [XPLOG] });
          }
        }
      });
    }

    //SelectMenu pour le channel rôle, sélecteur de jeux.
    if (interaction.isStringSelectMenu()) {
      let choice = interaction.values[0];
      const member = interaction.member;
      if (choice == "APEX") {
        interaction.deferReply({ ephemeral: true }).then(() => {
          if (
            member.roles.cache.some((role) => role.id == "811662603713511425")
          ) {
            member.roles.remove("811662603713511425");
            interaction.editReply({
              content: "Votre rôle `Apex Legends` a été supprimé.",
            });
          } else {
            member.roles.add("811662603713511425");
            interaction.editReply({
              content: "Vous avez récupéré votre rôle `Apex Legends`.",
            });
          }
        });
      } else if (choice == "NEWORLD") {
        interaction.deferReply({ ephemeral: true }).then(() => {
          if (
            member.roles.cache.some((role) => role.id == "907320710559576105")
          ) {
            member.roles.remove("907320710559576105");
            interaction.editReply({
              content: "Votre rôle `New World` a été supprimé.",
            });
          } else {
            member.roles.add("907320710559576105");
            interaction.editReply({
              content: "Vous avez récupéré votre rôle `New World`.",
            });
          }
        });
      } else if (choice == "FOREST") {
        interaction.deferReply({ ephemeral: true }).then(() => {
          if (
            member.roles.cache.some((role) => role.id == "1078754580113920020")
          ) {
            member.roles.remove("1078754580113920020");
            interaction.editReply({
              content: "Votre rôle `Sons of The Forest` a été supprimé.",
            });
          } else {
            member.roles.add("1078754580113920020");
            interaction.editReply({
              content: "Vous avez récupéré votre rôle `Sons of The Forest`.",
            });
          }
        });
      } else if (choice == "CALLOF") {
        interaction.deferReply({ ephemeral: true }).then(() => {
          if (
            member.roles.cache.some((role) => role.id == "813800188317663254")
          ) {
            member.roles.remove("813800188317663254");
            interaction.editReply({
              content: "Votre rôle `Call of Duty` a été supprimé.",
            });
          } else {
            member.roles.add("813800188317663254");
            interaction.editReply({
              content: "Vous avez récupéré votre rôle `Call of Duty`.",
            });
          }
        });
      } else if (choice == "ROCKET") {
        interaction.deferReply({ ephemeral: true }).then(() => {
          if (
            member.roles.cache.some((role) => role.id == "811663563558092841")
          ) {
            member.roles.remove("811663563558092841");
            interaction.editReply({
              content: "Votre rôle `Rocket League` a été supprimé.",
            });
          } else {
            member.roles.add("811663563558092841");
            interaction.editReply({
              content: "Vous avez récupéré votre rôle `Rocket League`.",
            });
          }
        });
      }
    }

    //Bouton pour Ticket => Création salon avec fermeture une fois terminé.
    if (interaction.customId === "VALID_CHARTE") {
      interaction.deferUpdate();
      interaction.member.roles.add("811662602530717738");
    }

    const StreamCordBOTId = '375805687529209857';
    const DisboardBOTId = '302050872383242240';
    const AdminRoleID = '717122082663694506';
    if (interaction.customId === "CREATE_CHANNEL") {
      interaction.deferUpdate();
      let channel = await interaction.guild.channels.create({
        name: `🎫丨𝐓icket丨${interaction.user.username}`,
        parent: "823950661523603466",
        type: ChannelType.GuildText,
        permissionOverwrites: [
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
          {
            id: AdminRoleID,
            allow: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
        ],
      },
        ],
      });

      const clearembed = new EmbedBuilder()
        .setDescription(
          `${interaction.user}\n Merci d'être patient, notre équipe s'occupe de tout !`
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
      await interaction.reply({
        content:
          "**Merci. Ton vote à bien été pris en compte. N'hésite surtout pas à commenter ton choix dans le fil de la suggestion. :bulb:**",
        ephemeral: true,
      });
      const ACCEPTSUGGLOG = new EmbedBuilder()
        .setColor("Green")
        .setTitle(
          `:ok: \`${interaction.user.username}\` 𝐕ient de réagir positivement à une suggestion.`
        )
        .setFooter({
          text: `丨`,
          iconURL: interaction.user.displayAvatarURL({
            dynamic: true,
            size: 64,
          }),
        })
        .setTimestamp();
      bot.channels.cache
        .get("838440585341566996")
        .send({ embeds: [ACCEPTSUGGLOG] });
    }
    if (interaction.customId === "NOPSUGG") {
      await interaction.reply({
        content:
          "**Merci. Ton vote à bien été pris en compte. N'hésite surtout pas à commenter ton choix dans le fil de la suggestion. :bulb:**",
        ephemeral: true,
      });
      const NOPSUGGLOG = new EmbedBuilder()
        .setColor("Red")
        .setTitle(
          `:x: \`${interaction.user.username}\` 𝐕ient de réagir négativement à une suggestion.`
        )
        .setFooter({
          text: `丨`,
          iconURL: interaction.user.displayAvatarURL({
            dynamic: true,
            size: 64,
          }),
        })
        .setTimestamp();
      bot.channels.cache
        .get("838440585341566996")
        .send({ embeds: [NOPSUGGLOG] });
    }

    // Actualisation du ping
    if (interaction.customId === "ping") {
      let reloadPing = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ping")
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
    if (interaction.channel === null) return;
if (!interaction.isCommand()) return;
if (!bot.commands.has(interaction.commandName)) return;
try {
  await bot.commands.get(interaction.commandName).execute(interaction);
} catch (error) {
  console.error(error);
  if (typeof interaction.reply === 'function') {
    interaction.reply({
      content: 'Une erreur est survenue lors de l\'exécution de la commande',
      ephemeral: true
    });
  } else {
    interaction.channel.send({
      content: 'Une erreur est survenue lors de l\'exécution de la commande'
    });
  }
}
  },
};

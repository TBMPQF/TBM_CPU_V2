const Discord = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const buttonCooldown = new Set();
const Levels = require("discord-xp");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, bot, user) {
    //Tous les embeds de Craft pour New World
    if (interaction.isSelectMenu()) {
      let choice = interaction.values[0];
      if (choice == "TANNERIE") {
        let Tannerie050 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 1412 x Peau brute\n • 353 x `Cuir brut` (*Tannerie 3*)\n\n Coût net total ~ `709,53` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tannerie50100 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 50 à 100\`丨🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n725 x Tanin mâture\n 11600 x Peau brute\n • 2900 x Cuir brut (*Tannerie 3*)\n •• 725 x `Cuir corroyé` (*Tannerie 3*)\n\n Coût net total ~ `7337,00` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tannerie100150 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n642 x Tanin mâture\n 3852 x Peau épaisse\n • 1284 x Cuir corroyé (*Tannerie 3*)\n •• 725 x `Cuir épais` (*Tannerie 4*)\n\n Coût net total ~ `9469,50` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tannerie150200 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/wbm7.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n1602 x Tanin mâture\n 9609 x Peau épaisse\n • 3203 x Cuir corroyé (*Tannerie 3*)\n • 2082 x Cuir épais (*Tannerie 4*)\n • 8328 x Peau de fer\n • 1041 x Tanin mâture\n •• 1041 x `Cuir imprégné` (*Tannerie 5*)\n\n Coût net total ~ `27830,73` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Tannerie050, Tannerie50100, Tannerie100150, Tannerie150200],
        });
      }
      if (choice == "TISSAGE") {
        let Tissage050 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 0 à 50\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n 1336 x Fibres\n • 334 x `Lin` (*Métier à tisser 3*)\n\n Coût net total ~ `1285,90` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tissage50100 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 50 à 100\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n2740 x Lin\n 685 x Triplure en tissefer\n • 685 x `Satin` (*Métier à tisser 3*)\n\n Coût net total ~ `4904,60` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tissage100150 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 100 à 150\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n3642 x Fils de soie\n 1214 x Satin\n 607 x Triplure en tissefer\n • 607 x `Soie` (*Métier à tisser 4*)\n\n Coût net total ~ `5821,13` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });
        let Tissage150200 = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setThumbnail("https://zupimages.net/up/22/45/fx4f.png")
          .setTitle(`\`Niveau 150 à 200\`丨 🟩⬛⬛`)
          .setDescription(
            "\n\n\n**__Étapes de fabrication__** :\n\n9083 x Fils de soie\n 3028 x Satin\n 1514 x Triplure en tissefer\n • 1968 x Soie (*Métier à tisser 4*)\n • 984 x Triplure en tissefer\n • 7872 x Souchet (*Métier à tisser 5*)\n •• 984 x `Soie imprégnée` (*Métier à tisser 5*)\n\n Coût net total ~ `24871,74` <:coins:1040567610913345576>"
          )
          .setFooter({
            text: `Prix mis à jour le 11/11/2022丨Si tu as d'autres propositions, n'hésite pas à crée un ticket`,
            iconURL: interaction.guild.iconURL({
              dynamic: true,
              size: 64,
            }),
          });

        interaction.reply({
          embeds: [Tissage050, Tissage50100, Tissage100150, Tissage150200],
        });
      }
      if (choice == "CUISINE") {
        let Cuisine050 = new Discord.EmbedBuilder()
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
        let Cuisine50100 = new Discord.EmbedBuilder()
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
        let Cuisine100150 = new Discord.EmbedBuilder()
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
        let Cuisine150200 = new Discord.EmbedBuilder()
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
      }
      if (choice == "ARTS") {
        let Arts050 = new Discord.EmbedBuilder()
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
        let Arts50100 = new Discord.EmbedBuilder()
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
        let Arts100150 = new Discord.EmbedBuilder()
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
        let Arts150200 = new Discord.EmbedBuilder()
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
      }
      if (choice == "JOALLERIE") {
        let Joallerie0100 = new Discord.EmbedBuilder()
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
        let Joallerie100200 = new Discord.EmbedBuilder()
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
      }
      if (choice == "AMEUBLEMENT") {
        let Ameublement050 = new Discord.EmbedBuilder()
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
        let Ameublement50100 = new Discord.EmbedBuilder()
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
        let Ameublement100150 = new Discord.EmbedBuilder()
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
        let Ameublement150200 = new Discord.EmbedBuilder()
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
      }
    }

    //Bouton Daily, pour récupérer son bonus quotidien.
    if (!buttonCooldown.has(interaction.user.id)) {
      if (interaction.customId === "DAILYXP") {
        const dailyXP = Math.floor(Math.random() * 1) + 200;
        Levels.appendXp(interaction.user.id, interaction.guild.id, dailyXP);

        const dailyEmbed = new Discord.EmbedBuilder()
          .setColor("Gold")
          .setTitle(
            `\`${interaction.user.username}\` 𝐓u viens de récuperer ton bonus quotidien ! \`+200 𝐗p\` :tada:`
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
        const XPLOG = new Discord.EmbedBuilder()
          .setColor("Orange")
          .setTitle(
            `\`${interaction.user.username}\` 𝐕ient de récuperer son bonus quotidien.`
          )
          .setFooter({
            text: `丨`,
            iconURL: interaction.user.displayAvatarURL({
              dynamic: true,
              size: 64,
            }),
          })
          .setTimestamp();
        bot.channels.cache.get("838440585341566996").send({ embeds: [XPLOG] });
      }
    }
    buttonCooldown.add(interaction.user.id);
    setTimeout(() => buttonCooldown.delete(interaction.user.id), 82800_000);

    //SelectMenu pour le channel rôle, sélecteur de jeux.
    if (interaction.isSelectMenu()) {
      let choice = interaction.values[0];
      const member = interaction.member;
      if (choice == "APEX") {
        if (
          member.roles.cache.some((role) => role.id == "811662603713511425")
        ) {
          interaction.deferUpdate();

          member.roles.remove("811662603713511425");
        } else {
          member.roles.add("811662603713511425");
          interaction.deferUpdate();
        }
      } else if (choice == "NEWORLD") {
        if (
          member.roles.cache.some((role) => role.id == "907320710559576105")
        ) {
          interaction.deferUpdate();

          member.roles.remove("907320710559576105");
        } else {
          member.roles.add("907320710559576105");
          interaction.deferUpdate();
        }
      } else if (choice == "ROCKET") {
        if (
          member.roles.cache.some((role) => role.id == "811663563558092841")
        ) {
          interaction.deferUpdate();

          member.roles.remove("811663563558092841");
        } else {
          member.roles.add("811663563558092841");
          interaction.deferUpdate();
        }
      } else if (choice == "CALLOF") {
        if (
          member.roles.cache.some((role) => role.id == "813800188317663254")
        ) {
          interaction.deferUpdate();

          member.roles.remove("813800188317663254");
        } else {
          member.roles.add("813800188317663254");
          interaction.deferUpdate();
        }
      } else if (choice == "MINECRAFT") {
        if (
          member.roles.cache.some((role) => role.id == "811663653140168741")
        ) {
          interaction.deferUpdate();

          member.roles.remove("811663653140168741");
        } else {
          member.roles.add("811663653140168741");
          interaction.deferUpdate();
        }
      } else if (choice == "7DAYS") {
        if (
          member.roles.cache.some((role) => role.id == "811663679351160890")
        ) {
          interaction.deferUpdate();
          member.roles.remove("811663679351160890");
        } else {
          member.roles.add("811663679351160890");
          interaction.deferUpdate();
        }
      }
    }

    //Bouton pour Ticket => Création salon avec fermeture une fois terminé.
    if (interaction.customId === "VALID_CHARTE") {
      interaction.deferUpdate();
      interaction.member.roles.add("811662602530717738");
    }

    if (interaction.customId === "CREATE_CHANNEL") {
      interaction.deferUpdate();
      let channel = await interaction.guild.channels.create({
        name: `🎫丨𝐓icket丨${interaction.user.username}`,
        parent: "823950661523603466",
        type: Discord.ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [Discord.PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user,
            allow: [
              Discord.PermissionFlagsBits.Sendinteractions,
              Discord.PermissionFlagsBits.ViewChannel,
            ],
          },
        ],
      });

      const clearembed = new Discord.EmbedBuilder()
        .setDescription(
          `${interaction.user}\n Merci d'être patient, notre équipe s'occupe de tout !`
        )
        .setColor("Blue");

      const deletebutton = new Discord.ActionRowBuilder().addComponents(
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
      const surbutton = new Discord.ActionRowBuilder()
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
    if (interaction.channel === null) return;
    if (!interaction.isCommand()) return;
    if (!bot.commands.has(interaction.commandName)) return;
    try {
      bot.commands.get(interaction.commandName).execute(bot, interaction);
    } catch (error) {
      console.error(error);
    }
  },
};

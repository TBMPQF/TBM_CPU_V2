const Discord = require("discord.js");
const User = require("../../models/experience");
const levelUp = require("../../models/levelUp");

const images = {
  "pierre": "https://zupimages.net/up/22/44/u8vr.png",
  "ciseaux": "https://zupimages.net/up/22/44/u9gk.png",
  "feuille": "https://zupimages.net/up/22/44/wkqx.png"
};

module.exports = {
  name: "chifoumi",
  description: "丨𝐉eux pierre, feuille, ciseaux.",
  longDescription: ` 𝐓u penses pouvoir battre le bot à un jeu aussi simple que pierre, feuille, ciseaux ? 𝐂'est mignon...\n𝐀vec cette commande, tu peux non seulement tester ta chance, mais aussi parier ton précieux XP. 𝐎ui, tu as bien lu, de l'XP ! 💸\n\n𝐂omment ça marche ? 𝐓u choisis entre **pierre**, **feuille** ou **ciseaux**, puis tu mises entre **5** et **1000 XP**. \n𝐌ais attention, le bot est rusé (et un peu tricheur parfois). 𝐈l a 60% de chances de te battre. 𝐃onc si tu perds, ne dis pas que tu n'as pas été prévenu ! 🤷‍♂️\n\n𝐒i tu gagnes, c'est jackpot ! 𝐒i tu perds… eh bien, tu seras allégé d'un peu d'XP. 𝐌ais, au moins, tu auras tenté ta chance comme un(e) vrai(e) guerrier(e). 💪\n\n𝐀h, et si tu es à court d'XP, inutile de tricher avec des mises impossibles, le bot le saura (parce qu'il est omniscient, évidemment). 𝐀lors, prêt(e) à tenter le tout pour le tout ? 🏆`,
  dm: false,
  permission: 'Aucune',
  options: [
    {
      type: 3,
      name: "choix",
      description: "pierre, feuille ou ciseaux ?",
      required: true,
    },
    {
      type: 4,
      name: "mise",
      description: "𝐂ombien d'XP veux-tu parier ?",
      required: true,
    },
  ],

  async execute(interaction) {
    let joueursH = interaction.options.getString("choix").toLowerCase();
    let mise = interaction.options.getInteger("mise");

    if (!["pierre", "feuille", "ciseaux"].includes(joueursH)) {
      return await interaction.reply({
        content: "𝐓u as cru pouvoir gagner comme ça.. ? 𝐉oue uniquement : **pierre**, **feuille** ou **ciseaux**.",
        ephemeral: true
      });
    }

    if (mise < 5 || mise > 1000) {
      return await interaction.reply({
        content: "𝐋a mise doit être entre \`5\` et \`1000\` XP.",
        ephemeral: true
      });
    }

    let joueursB;
    if (Math.random() < 0.6) { //Plus c'est haut, plus le bot gagne !
      switch (joueursH) {
        case "pierre":
          joueursB = "feuille";
          break;
        case "feuille":
          joueursB = "ciseaux";
          break;
        case "ciseaux":
          joueursB = "pierre";
          break;
      }
    } else {
      let joueursB1 = ["pierre", "feuille", "ciseaux"];
      let punchradom = Math.floor(Math.random() * joueursB1.length);
      joueursB = joueursB1[punchradom];
    }

    let thumbUrl = images[joueursB];

    await interaction.deferReply();

    let user = await User.findOne({ userID: interaction.user.id, serverID: interaction.guild.id });
    if (!user) {
      user = new User({ userID: interaction.user.id, serverID: interaction.guild.id, username: interaction.user.username });
    }

    if (user.xp < mise) {
      return await interaction.editReply(`:no_entry_sign: **𝐓u n'as pas assez d'__XP__ pour cette mise.**\n𝐓u as seulement ${user.xp.toLocaleString()} XP disponible.`);
    }

    let Embed = new Discord.EmbedBuilder();

    let gameResult;
    let color;
    let xpChange = 0;

    if (joueursH === joueursB) {
      gameResult = "É-GA-LI-TÉ";
      color = "Grey";
    } else if (
      (joueursH === "pierre" && joueursB === "ciseaux") ||
      (joueursH === "feuille" && joueursB === "pierre") ||
      (joueursH === "ciseaux" && joueursB === "feuille")
    ) {
      gameResult = "𝐆AGNÉ";
      color = "Green";
      xpChange = mise;
    } else {
      gameResult = "𝐏ERDU";
      color = "Red";
      xpChange = -mise;
    }

    user.xp += xpChange;
    await levelUp(interaction, user, user.xp);

    Embed.setColor(color)
      .setDescription(
        `${gameResult === "É-GA-LI-TÉ" ? "𝐀rf, on est connecté" : gameResult === "GAGNÉ" ? "𝐁ien joué" : "Désolé"} \`${interaction.user.username}\` ${xpChange=== 0 ? "" : xpChange > 0 ? `! \`+${xpChange} XP.\`` : `... \`-${-xpChange} XP.\``}\n\n𝐓u as joué \*\*${joueursH}\*\* donc tu as \`${gameResult}\`.`
      )
      .setThumbnail(thumbUrl)
      .setFooter({
        text: `𝐓u as maintenant : ${user.xp.toLocaleString()} XP.`,
        iconURL: interaction.user.displayAvatarURL({
          dynamic: true,
          size: 512,
        })
      })
      const sentMessage = await interaction.editReply({ embeds: [Embed] });
      setTimeout(() => sentMessage.delete(), 30000);
  },
};

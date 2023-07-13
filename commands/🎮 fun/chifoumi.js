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
  description: "丨Jeux pierre, feuille, ciseaux.",
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
      description: "Combien d'XP voulez-vous parier ?",
      required: true,
    },
  ],

  async execute(interaction) {
    let joueursH = interaction.options.getString("choix").toLowerCase();
    let mise = interaction.options.getInteger("mise");

    if (!["pierre", "feuille", "ciseaux"].includes(joueursH)) {
      return await interaction.reply("Veuillez entrer une option valide (pierre, feuille, ciseaux).");
    }

    if (mise < 5 || mise > 1000) {
      return await interaction.reply("La mise doit être entre \`5\` et \`1000\` XP.");
    }

    let joueursB;
    if (Math.random() < 0.7) { 
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

    let user = await User.findOne({ userID: interaction.user.id });
    if (!user) {
      user = new User({ userID: interaction.user.id, username: interaction.user.username });
    }

    if (user.xp < mise) {
      return await interaction.editReply("**Vous n'avez pas assez d'XP pour cette mise.**");
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
      gameResult = "GAGNÉ";
      color = "Green";
      xpChange = mise;
    } else {
      gameResult = "PERDU";
      color = "Red";
      xpChange = -mise;
    }

    user.xp += xpChange;
    await levelUp(interaction, user, user.xp);

    Embed.setColor(color)
      .setDescription(
        `${gameResult === "É-GA-LI-TÉ" ? "Arf, on est connecté" : gameResult === "GAGNÉ" ? "Bien joué" : "Désolé"} \`${interaction.user.username}\` ${xpChange=== 0 ? "" : xpChange > 0 ? `! \`+${xpChange} XP.\`` : `... \`-${-xpChange} XP.\``}\n\nTu as joué \*\*${joueursH}\*\* donc tu as \`${gameResult}.\``
      )
      .setThumbnail(thumbUrl)
      .setFooter({
        text: `Tu as maintenant : ${user.xp.toLocaleString()} XP.`,
        iconURL: interaction.user.displayAvatarURL({
          dynamic: true,
          size: 512,
        })
      })
    return await interaction.editReply({ embeds: [Embed] });
  },
};
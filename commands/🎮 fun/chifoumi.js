const Discord = require("discord.js");
const Levels = require("discord-xp");

module.exports = {
  name: "chifoumi",
  description: "丨Jeux pierre, feuille, ciseaux",
  dm: false,
  options: [
    {
      type: 3,
      name: "choice",
      description: "Jeux pierre, feuille, ciseaux",
      required: true,
    },
  ],

  async execute(bot, interaction) {
    let joueursH = interaction.options.getString("choice");

    let joueursB1 = ["pierre", "feuille", "ciseaux"];

    let punchradom = Math.floor(Math.random() * joueursB1.length);
    let joueursB = joueursB1[punchradom];

    await interaction.deferReply();

    if (joueursH === "pierre" && joueursB === "feuille") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let LoseXP = Math.floor(Math.random() * 1) + 5;
      Levels.subtractXp(interaction.user.id, interaction.guild.id, LoseXP);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `Désolé \`${interaction.user.username}\`.. \`-5 XP\`\n\nTu as joué \*\*${joueursH}\*\* et tu as \`PERDU\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/wkqx.png")
        .setFooter({
          text: `Tu as maintenant : ${users.xp - 5} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    } else if (joueursH === "pierre" && joueursB === "pierre") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Grey")
        .setDescription(
          `Arf, on est connecté \`${interaction.user.username}\`\n\nTu as joué \*\*${joueursH}\*\*, il y a \`É-GA-LI-TÉ\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/u8vr.png")
        .setFooter({
          text: `Tu as toujours : ${users.xp} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    } else if (joueursH === "pierre" && joueursB === "ciseaux") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let WinXP = Math.floor(Math.random() * 1) + 5;
      Levels.appendXp(interaction.user.id, interaction.guild.id, WinXP);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `Bien joué \`${interaction.user.username}\` ! \`+5 XP\`\n\nTu as joué \*\*${joueursH}\*\* donc tu as \`GAGNÉ\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/u9gk.png")
        .setFooter({
          text: `Tu as maintenant : ${users.xp + 5} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    }

    if (joueursH === "feuille" && joueursB === "pierre") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let WinXP = Math.floor(Math.random() * 1) + 5;
      Levels.appendXp(interaction.user.id, interaction.guild.id, WinXP);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `Bien joué \`${interaction.user.username}\` ! \`+5 XP\`\n\nTu as joué \*\*${joueursH}\*\* donc tu as \`GAGNÉ\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/u8vr.png")
        .setFooter({
          text: `Tu as maintenant : ${users.xp + 5} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    } else if (joueursH === "feuille" && joueursB === "feuille") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Grey")
        .setDescription(
          `Arf, on est connecté \`${interaction.user.username}\`\n\nTu as joué \*\*${joueursH}\*\*, il y a \`É-GA-LI-TÉ\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/wkqx.png")
        .setFooter({
          text: `Tu as toujours : ${users.xp} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    } else if (joueursH === "feuille" && joueursB === "ciseaux") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let LoseXP = Math.floor(Math.random() * 1) + 5;
      Levels.subtractXp(interaction.user.id, interaction.guild.id, LoseXP);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `Désolé \`${interaction.user.username}\`.. \`-5 XP\`\n\nTu as joué \*\*${joueursH}\*\* et tu as \`PERDU\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/u9gk.png")
        .setFooter({
          text: `Tu as maintenant : ${users.xp - 5} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    }

    if (joueursH === "ciseaux" && joueursB === "pierre") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let LoseXP = Math.floor(Math.random() * 1) + 5;
      Levels.subtractXp(interaction.user.id, interaction.guild.id, LoseXP);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `Désolé \`${interaction.user.username}\`.. \`-5 XP\`\n\nTu as joué \*\*${joueursH}\*\* et tu as \`PERDU\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/u8vr.png")
        .setFooter({
          text: `Tu as maintenant : ${users.xp - 5} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    } else if (joueursH === "ciseaux" && joueursB === "ciseaux") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Grey")
        .setDescription(
          `Arf, on est connecté \`${interaction.user.username}\`\n\nTu as joué \*\*${joueursH}\*\*, il y a \`É-GA-LI-TÉ\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/u9gk.png")
        .setFooter({
          text: `Tu as toujours : ${users.xp} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    } else if (joueursH === "ciseaux" && joueursB === "feuille") {
      let users = await Levels.fetch(interaction.user.id, interaction.guild.id);
      let WinXP = Math.floor(Math.random() * 1) + 5;
      Levels.appendXp(interaction.user.id, interaction.guild.id, WinXP);
      let Embed = new Discord.EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `Bien joué \`${interaction.user.username}\` ! \`+5 XP\`\n\nTu as joué \*\*${joueursH}\*\* donc tu as \`GAGNÉ\``
        )
        .setThumbnail("https://zupimages.net/up/22/44/wkqx.png")
        .setFooter({
          text: `Tu as maintenant : ${users.xp + 5} XP`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.followUp({ embeds: [Embed] });
    }

    if (
      joueursH !== "feuille" ||
      joueursH !== "ciseaux" ||
      joueursH !== "pierre"
    ) {
      let choice = interaction.options.getString("choice");
      let Embed = new Discord.EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `Mmh. Tenter de gagner avec \`${choice}\` n'est pas très intelligent ${interaction.user.username}.. Essaye plutôt : \`pierre\`, \`feuille\` ou \`ciseaux\`. :see_no_evil:`
        )
        .setThumbnail(
          interaction.user.displayAvatarURL({ dynamic: true, size: 32 })
        );

      return await interaction.followUp({ embeds: [Embed] });
    }
  },
};

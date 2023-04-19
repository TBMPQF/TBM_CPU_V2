const Discord = require("discord.js");

module.exports = {
  name: "métiers",
  description: "丨𝐄nvoi l'embed des 𝐌étiers.",

  async execute(interaction) {
    const MetierNW = new Discord.EmbedBuilder()
      .setColor("#b3c7ff")
      .setTitle("`丨𝐌étiers 𝐍ew 𝐖orld丨`")
      .setImage("https://zupimages.net/up/22/45/eb68.png")
      .setDescription(
        `Tu ne sais pas comment monter ton métier ? Laisse nous te guider, tu dois juste séléctionner le métier que tu veux monter et regarder la recette proposé (celle-ci peut venir à être modifier. Elle n'est pas forcémenet la meilleure mais l'une des plus "facile")`
      );

    const SelectMenu = new Discord.ActionRowBuilder().addComponents(
      new Discord.SelectMenuBuilder()
        .setCustomId("CHOIX")
        .setPlaceholder("𝐐uel métier veux-tu monter ?")
        .addOptions(
          {
            label: "丨𝐓annerie",
            emoji: "1040599302990483568",
            value: "TANNERIE",
          },
          {
            label: "丨𝐓issage",
            emoji: "1040602789123981312",
            value: "TISSAGE",
          },
          {
            label: "丨𝐅onderie",
            emoji: "1040624421251076166",
            value: "FONDERIE",
          },
          {
            label: "丨𝐌enuisier",
            emoji: "1040624481422549002",
            value: "MENUISIER",
          },
          {
            label: "丨𝐓ailleur de pierre",
            emoji: "1040624536237912195",
            value: "TAILLEUR",
          },
          {
            label: "丨𝐉oaillerie",
            emoji: "1040674127675134014",
            value: "JOALLERIE",
          },
          {
            label: "丨𝐅abrication d'arme",
            emoji: "1038566586077950013",
            value: "ARME",
          },
          {
            label: "丨𝐅abrication d'armure",
            emoji: "1040676995991879712",
            value: "ARMURE",
          },
          {
            label: "丨𝐈ngénierie",
            emoji: "1038566586077950013",
            value: "INGENIERIE",
          },
          {
            label: "丨𝐀rts Obscurs",
            emoji: "1040613305141710869",
            value: "ARTS",
          },
          {
            label: "丨𝐂uisine",
            emoji: "1040616285551214732",
            value: "CUISINE",
          },
          {
            label: "丨𝐀meublement",
            emoji: "1040612490339426396",
            value: "AMEUBLEMENT",
          }
        )
    );
    if (typeof interaction.reply === 'function') {
      interaction.reply({
        embeds: [MetierNW],
        components: [SelectMenu],
      });
    } else {
      interaction.channel.send({
        embed: MetierNW,
        components: [SelectMenu],
      });
    }
  },
};

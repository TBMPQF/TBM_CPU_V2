const { Discord, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "CHOIX",
  async execute(interaction) {
    if (interaction.isStringSelectMenu()) {
      const selectedOption = interaction.values[0];

      switch (selectedOption) {
        case "LOG":
          const logEmbed = new EmbedBuilder()
            .setTitle("Option LOG")
            .setDescription("Contenu de l'option LOG")
            .setColor("#b3c7ff");
          await interaction.reply({ embeds: [logEmbed] });
          break;

        case "REGLEMENT":
          const reglementEmbed = new EmbedBuilder()
            .setTitle("Option REGLEMENT")
            .setDescription("Contenu de l'option REGLEMENT")
            .setColor("#b3c7ff");
          await interaction.reply({ embeds: [reglementEmbed] });
          break;

        case "WELCOME":
          const WELCOMEEmbed = new EmbedBuilder()
            .setTitle("Option WELCOME")
            .setDescription("Contenu de l'option WELCOME")
            .setColor("#b3c7ff");
          await interaction.reply({ embeds: [WELCOMEEmbed] });
          break;

        case "IMPLICATION":
          const IMPLICATIONEmbed = new EmbedBuilder()
            .setTitle("Option IMPLICATION")
            .setDescription("Contenu de l'option IMPLICATION")
            .setColor("#b3c7ff");
          await interaction.reply({ embeds: [IMPLICATIONEmbed] });
          break;

        case "SUGGESTION":
          const SUGGESTIONEmbed = new EmbedBuilder()
            .setTitle("Option SUGGESTION")
            .setDescription("Contenu de l'option SUGGESTION")
            .setColor("#b3c7ff");
          await interaction.reply({ embeds: [SUGGESTIONEmbed] });
          break;

        case "DAILY":
          const DAILYEmbed = new EmbedBuilder()
            .setTitle("Option DAILY")
            .setDescription("Contenu de l'option DAILY")
            .setColor("#b3c7ff");
          await interaction.reply({ embeds: [DAILYEmbed] });
          break;

        case "ROLES":
          const ROLESEmbed = new EmbedBuilder()
            .setTitle("Option ROLES")
            .setDescription("Contenu de l'option ROLES")
            .setColor("#b3c7ff");
          await interaction.reply({ embeds: [ROLESEmbed] });
          break;

        default:
          await interaction.reply("Option invalide");
          break;
      }
    }
  },
};

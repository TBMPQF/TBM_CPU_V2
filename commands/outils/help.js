const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "help",
  description: "丨Affiche la liste des commandes.",
  dm: false,
  permission: 8,

  async execute(interaction, client) {
    const helpEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Liste des Commandes')
      .setDescription('Voici une liste des commandes disponibles :')
      .setTimestamp()
      .setFooter(`Cordialement, l'équipe ${interaction.guild.name}`, interaction.guild.iconURL());

    const commands = client.commands;

    commands.forEach((command) => {
      helpEmbed.addField(command.name, command.description, true);
    });

    interaction.reply({ embeds: [helpEmbed] });
  },
};
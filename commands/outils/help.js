const Discord = require("discord.js");

module.exports = {
  name: "help",
  description: "丨𝐀ffiche toutes les commandes disponibles.",
  longDescription: ` 𝐁esoin d'un coup de pouce pour naviguer dans les méandres des commandes ? 𝐓u es au bon endroit !\n\n𝐒eule chose que tu as à faire, c'est de sélectionner une commande dans le menu déroulant. 𝐒uivi de cela, tu découvriras ses secrets, astuces, et autres joyeusetés ! 𝐂e n'est pas juste un simple affichage, c'est une véritable aventure où chaque commande a son propre charme et ses propres fonctionnalités. 𝐓u pourrais même trouver des commandes qui vont transformer ton expérience sur le serveur en un jeu d'enfant ! 🎮\n\n𝐌ême si certaines commandes sont si puissantes qu'elles pourraient t'apprendre à jongler avec les rôles comme un pro. 🤹‍♂️ 𝐂e sera comme une chasse au trésor, mais au lieu de trouver de l'or, tu obtiendras des outils pour briller sur le serveur ! ✨`,
  dm: false,
  permission: "Aucune",

  async execute(interaction, bot) {
    const commands = bot.commands.map(command => ({
      name: command.name,
      description: command.description || 'Pas de description disponible',
      longDescription: command.longDescription || command.description || 'Pas de description disponible'
    }));

    const helpMenu = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId('HELP_MENU')
        .setPlaceholder('𝐒électionne une commande.')
        .addOptions(commands.map(cmd => ({
          label: cmd.name,
          description: cmd.description,
          value: cmd.name
        })))
    );

    const HelpEmbed = new Discord.EmbedBuilder()
        .setDescription(
            `𝐁esoin d'un coup de pouce ? 𝐔tilise le menu déroulant et plonge dans les mystères des commandes du bot. \n𝐒électionne une commande, découvre ses secrets cachés, et deviens un véritable maître du serveur. \n\n𝐀ttention, certaines commandes pourraient te transformer en pro de Discord ! 😏`
        )
      .setColor("#b3c7ff");

    await interaction.reply({
      embeds: [HelpEmbed],
      components: [helpMenu],
    });

    const filter = i => i.customId === 'HELP_MENU' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      const selectedCommand = commands.find(cmd => cmd.name === i.values[0]);

      if (selectedCommand) {
        const commandEmbed = new Discord.EmbedBuilder()
          .setColor("#b3c7ff")
          .setDescription(`𝐂ommande : **\`${selectedCommand.name}\`** \n\n◟ ${selectedCommand.longDescription}`);
        
        await i.update({ embeds: [commandEmbed], components: [helpMenu] });
      }
    });

    setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
        }
      }, 60000);
  },
};

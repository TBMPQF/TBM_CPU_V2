const { EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
  name: "mute",
  description: "丨Mute un utilisateur.",
  dm: false,
  permission: 8,
  options: [
    {
      type: 6,
      name: "utilisateur",
      description: "丨Qui veux-tu mute ?",
      required: true,
    },
    {
      type: 3,
      name: "temps",
      description: "Combien de temps veux-tu le mute ?",
      required: true,
    },
    {
        type: 3,
        name: "raison",
        description: "La raison pour laquelle il est muté.",
        required: true,
    }
  ],

  async execute(interaction) {
    const target = interaction.options.getMember("utilisateur");
    const time = interaction.options.getString("temps");
    const raison = interaction.options.getString("raison");

    if (!target) {
      return interaction.reply({
        content: "Veuillez mentionner un utilisateur à mute.",
        ephemeral: true,
      });
    }

    const role = interaction.guild.roles.cache.find(
      (r) => r.name === "丨𝐌uted"
    );
    if (!role) {
      return interaction.reply({
        content:
          'Aucun rôle "丨𝐌uted" trouvé sur ce serveur. Veuillez en créer un et donner à ce rôle des permissions qui empêchent les utilisateurs de parler.',
        ephemeral: true,
      });
    }

    await target.fetch(true);
    if (target.roles.cache.has(role.id)) {
        return interaction.reply({
          content: `L'utilisateur ${target.user.tag} est déjà mute.`,
          ephemeral: true,
        });
    }

    await target.roles.add(role);

    const muteEmbed = new EmbedBuilder()
      .setTitle("Mute")
      .setDescription(`🚫丨${target}丨𝐓u viens d'être muté pendant \`${time}\` pour la raison suivant : \`${raison}\`\n𝐓u ne peux plus parler ni te connecté aux vocaux pendant cette période.`)
      .setColor("Red");

    await interaction.reply({ embeds: [muteEmbed], ephemeral: false });

    let muteTime = ms(time); // Le temps total de mute en millisecondes
    let remainingTime = muteTime; // Le temps restant de mute

    // Crée un intervalle qui est déclenché toutes les secondes
    let interval = setInterval(async () => {
        remainingTime -= 1000; // Retire une seconde du temps restant

        // Convertit le temps restant en minutes et secondes pour l'afficher
        let minutes = Math.floor(remainingTime / (60 * 1000));
        let seconds = ((remainingTime % (60 * 1000)) / 1000).toFixed(0);

        // Met à jour le message pour afficher le temps restant
        await interaction.editReply(`Temps restant du mute : ${minutes} minutes ${seconds} secondes.`);

        // Si le temps restant est 0, arrête l'intervalle et démute l'utilisateur
        if (remainingTime <= 0) {
            clearInterval(interval);
            await interaction.editReply(`Le mute de ${target.user.tag} est maintenant terminé.`);
            if (target.roles.cache.has(role.id)) {
                await target.roles.remove(role);
            }
        }
    }, 1000);
  },
};
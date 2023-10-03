const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
  } = require("discord.js");

module.exports = {
    name: "recherchemate",
    description: "丨𝐄nvoi l'embed de la recherche mate d'Apex Legends.",
    dm: false,
    permission: 8,
  
    async execute(interaction) {
      const serverId2 = interaction.guild.id;
      const rowApexMate = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("OPENVOC_APEX_BUTTON")
            .setEmoji("🎤")
            .setLabel("Ouvrir un salon vocal")
            .setStyle(ButtonStyle.Primary)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("SEARCHMATE_APEX_BUTTON")
            .setEmoji("🔎")
            .setLabel("Lancer une recherche")
            .setStyle(ButtonStyle.Danger)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("STATS_APEX_BUTTON")
            .setEmoji("📊")
            .setLabel("Statistiques Apex")
            .setStyle(ButtonStyle.Primary)
        );
  
      const RoleEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`――――――――∈ \`𝐀PEX 𝐋EGENDS\` ∋――――――――`)
        .setThumbnail("https://www.freepnglogos.com/uploads/apex-legends-logo-png/apex-game-png-logo-21.png")
        .setDescription("salut")
        .setFooter({
          text: `Cordialement, l'équipe ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });
      interaction.reply({
        embeds: [RoleEmbed],
        components: [rowApexMate],
      });
    },
  };
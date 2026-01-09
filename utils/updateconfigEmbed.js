const { EmbedBuilder } = require("discord.js");

/**
 * @param {Interaction} interaction
 * @param {string} label
 * @param {string} value
 */

async function updateConfigEmbed(interaction, label, value) {
  const msg = interaction.message;
  if (!msg?.embeds?.length) return;

  const embed = EmbedBuilder.from(msg.embeds[0]);

  const regex = new RegExp(
    `📌 \\*\\*${label}\\*\\* : \`.*?\``,
    "u"
  );

  embed.setDescription(
    embed.data.description.replace(
      regex,
      `📌 **${label}** : \`${value}\``
    )
  );

  await msg.edit({
    embeds: [embed],
    components: msg.components
  });
}

module.exports = { updateConfigEmbed };
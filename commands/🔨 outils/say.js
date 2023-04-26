const Discord = require("discord.js");

module.exports = {
  name: "say",
  description: "丨Parle à la place du Bot.",
  dm: false,
  permission: 8,
  options: [
    {
      type: 3,
      name: "message",
      description: "丨Quel message envoyer avec le bot ?",
      required: true,
    },
  ],

  async execute(bot, interaction) {
    try {
      let messages = interaction.options.getString("message");
      return interaction.reply({ content: `${messages}` });
    } catch (err) {
      console.log(err);
    }
  },
};

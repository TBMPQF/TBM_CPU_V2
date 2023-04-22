const bot = require("discord.js");
const {
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonBuilder,
} = require("discord.js");
const Levels = require("discord-xp");

bot.config = require("../config.json");

const ROLE_LEVELS = {
  PREMIERE_CLASSE: 2,
  CAPORAL: 5,
  CAPORAL_CHEF: 10,
  SERGENT: 15,
  SERGENT_CHEF: 20,
  ADJUDANT: 25,
  ADJUDANT_CHEF: 30,
  MAJOR: 35,
  ASPIRANT: 40,
  SOUS_LIEUTENANT: 45,
  LIEUTENANT: 50,
};

function assignRole(level, member) {
  const { roles } = member.guild;

  const roleMapping = [
    { level: ROLE_LEVELS.PREMIERE_CLASSE, roleId: "811724918630645790" },
    { level: ROLE_LEVELS.CAPORAL, roleId: "813795565708115988" },
    { level: ROLE_LEVELS.CAPORAL_CHEF, roleId: "813795488285327362" },
    { level: ROLE_LEVELS.SERGENT, roleId: "813795598943518732" },
    { level: ROLE_LEVELS.SERGENT_CHEF, roleId: "813795648791904296" },
    { level: ROLE_LEVELS.ADJUDANT, roleId: "813795701708030014" },
    { level: ROLE_LEVELS.ADJUDANT_CHEF, roleId: "813795755080548393" },
    { level: ROLE_LEVELS.MAJOR, roleId: "813795805726113793" },
    { level: ROLE_LEVELS.ASPIRANT, roleId: "813795871661359124" },
    { level: ROLE_LEVELS.SOUS_LIEUTENANT, roleId: "813795921480908840" },
    { level: ROLE_LEVELS.LIEUTENANT, roleId: "813795963805761547" },
  ];

  const newRole = roleMapping.find((role) => role.level === level);

  if (newRole) {
    const currentRoleIndex = roleMapping.findIndex((role) => role.level === level);
    const previousRole = currentRoleIndex > 0 ? roleMapping[currentRoleIndex - 1] : null;

    member.roles.add(newRole.roleId).catch((error) =>
      console.error("Erreur lors de l'ajout du rôle :", error)
    );
    if (previousRole) {
      member.roles.remove(previousRole.roleId).catch((error) =>
        console.error("Erreur lors de la suppression du rôle :", error)
      );
    }
    return roles.cache.get(newRole.roleId).name;
  }

  return null;
}

module.exports = {
  name: "messageCreate",
  async execute(message, bot) {
    Levels.setURL(bot.config.mongourl);

    if (!message.guild) return;
    if (message.author.bot) return;

    const sendSMS = Math.floor(Math.random() * 1) + 1;
    Levels.appendSMS(message.author.id, message.guild.id, sendSMS);

    const randomAmountOfXp = Math.floor(Math.random() * 49) + 1;
    const hasLeveledUp = await Levels.appendXp(
      message.author.id,
      message.guild.id,
      randomAmountOfXp
    );

    if (hasLeveledUp) {
      const user = await Levels.fetch(message.author.id, message.guild.id);
      bot.channels.cache
        .get(`717154831823011890`)
        .send(
          `**${message.author}丨**Tu viens de passer au niveau **\`${user.level}\`** ! - :worm:`
        );
      const newRoleName = assignRole(user.level, message.member);
      if (newRoleName) {
        bot.channels.cache.get(`717154831823011890`).send(
          `**     丨**Tu débloques le grade ${newRoleName}. Félicitation ! :tada:`
        );
      }
    }
  

    //Salon suggestion qui se tranforme à chaque message en embed préparé.
    if (message.channel.id === "1045073140948152371") {
      let suggEmbed = new EmbedBuilder()
      .setColor("DarkVividPink")
      .setTitle("丨𝐒uggestion")
      .setDescription(`${message.content}`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields([
        {
          name: "𝐏roposé par :",
          value: message.author ? message.author.toString() : "Auteur inconnu",
          inline: true,
        },
        { name: "𝐏our", value: "0", inline: true },
        { name: "𝐂ontre", value: "0", inline: true },
      ]);
      const buttonY = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("ACCEPTSUGG")
            .setEmoji("✔️")
            .setStyle(ButtonStyle.Success)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId("NOPSUGG")
            .setEmoji("✖️")
            .setStyle(ButtonStyle.Danger)
        );

      bot.channels.cache
        .get("1045073140948152371")
        .send({ embeds: [suggEmbed], components: [buttonY] })
        .then((msg) => {
          msg.startThread({ name: `𝐒uggestion de ${message.author.username}` });
        });
      await message.delete();
    }
  },
};

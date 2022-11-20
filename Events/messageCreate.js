const bot = require("discord.js");
const Levels = require("discord-xp");
const date = new Date();

bot.config = require("../config.json");

module.exports = {
  name: "messageCreate",
  async execute(message, bot) {
    Levels.setURL(bot.config.mongourl);

    const premièreclasseRole =
      message.guild.roles.cache.get("811724918630645790");
    const caporalRole = message.guild.roles.cache.get("813795565708115988");
    const caporalchefRole = message.guild.roles.cache.get("813795488285327362");
    const sergentRole = message.guild.roles.cache.get("813795598943518732");
    const sergentchefRole = message.guild.roles.cache.get("813795648791904296");
    const adjudantRole = message.guild.roles.cache.get("813795701708030014");
    const adjudantchefRole =
      message.guild.roles.cache.get("813795755080548393");
    const majorRole = message.guild.roles.cache.get("813795805726113793");
    const aspirantRole = message.guild.roles.cache.get("813795871661359124");
    const souslieutnantRole =
      message.guild.roles.cache.get("813795921480908840");
    const lieutnantRole = message.guild.roles.cache.get("813795963805761547");

    if (!message.guild) return;
    if (message.author.bot) return;

    if (
      message.member.roles.cache.some(
        (role) => role.name === "✨丨𝐄lite 𝐒ecrète"
      )
    ) {
      const randomAmountOfXp = Math.floor(Math.random() * 499) + 1;
      const hasLeveledUp = await Levels.appendXp(
        message.author.id,
        message.guild.id,
        randomAmountOfXp
      );
    }

    if (date.getDay() == 6) {
      const randomAmountOfXp = Math.floor(Math.random() * 74) + 1;
      const hasLeveledUp = await Levels.appendXp(
        message.author.id,
        message.guild.id,
        randomAmountOfXp
      );
    }

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
      if (user.level == 2) {
        bot.channels.cache
          .get(`717154831823011890`)
          .send(
            `**     丨**Tu débloques le grade ${premièreclasseRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("811724918630645790"))
          .then(message.member.roles.remove("825023017645899822"));
      }
      if (user.level == 5) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${caporalRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795565708115988"))
          .then(message.member.roles.remove("811724918630645790"));
      }
      if (user.level == 10) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${caporalchefRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795488285327362"))
          .then(message.member.roles.remove("813795565708115988"));
      }
      if (user.level == 15) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${sergentRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795598943518732"))
          .then(message.member.roles.remove("813795488285327362"));
      }
      if (user.level == 20) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${sergentchefRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795648791904296"))
          .then(message.member.roles.remove("813795598943518732"));
      }
      if (user.level == 25) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${adjudantRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795701708030014"))
          .then(message.member.roles.remove("813795648791904296"));
      }
      if (user.level == 30) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${adjudantchefRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795755080548393"))
          .then(message.member.roles.remove("813795701708030014"));
      }
      if (user.level == 35) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${majorRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795805726113793"))
          .then(message.member.roles.remove("813795755080548393"));
      }
      if (user.level == 40) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${aspirantRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795871661359124"))
          .then(message.member.roles.remove("813795805726113793"));
      }
      if (user.level == 45) {
        message.channel
          .send(
            `**     丨**Tu débloques le grade ${souslieutnantRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795921480908840"))
          .then(message.member.roles.remove("813795871661359124"));
      }
      if (user.level == 50) {
        message.channel
          .send(
            `**     丨**Tu débloques le dernier et glorieux grade ${lieutnantRole}. Félicitation ! :tada:`
          )
          .then(message.member.roles.add("813795963805761547"))
          .then(message.member.roles.remove("813795921480908840"));
      }
    }
  },
};

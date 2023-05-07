const roleRewards = require("./roleRewards");
const Discord = require("discord.js");

async function levelUp(obj, user, newXP) {
  const newLevel = Math.floor(0.1 * Math.sqrt(newXP));

  if (user.level < newLevel) {
    user.level = newLevel;

    const levelUpChannel = obj.guild.channels.cache.find(
      (channel) => channel.name === "🏆丨𝐈mplications"
    );

    const author =
      obj instanceof Discord.Message ? obj.author : obj.user;

    if (levelUpChannel) {
      levelUpChannel.send(
        `**${author}丨** 𝐓u viens de passer au niveau **\`${newLevel}\`** ! - :worm: !`
      );
    }

    const roleReward = roleRewards.find((reward) => reward.level === newLevel);
    if (roleReward) {
      const role = obj.guild.roles.cache.find(
        (r) => r.name === roleReward.roleName
      );
      const previousRoleReward = roleRewards.find(
        (reward) => reward.level === newLevel - 1
      );
      if (previousRoleReward) {
        const previousRole = obj.guild.roles.cache.find(
          (r) => r.name === previousRoleReward.roleName
        );
        if (previousRole) {
          await obj.member.roles.remove(previousRole);
        }
      }
      if (role) {
        const rolesToRemove = roleRewards.filter((reward) => reward.level < newLevel);
      
        for (const previousReward of rolesToRemove) {
          const previousRole = obj.guild.roles.cache.find(
            (r) => r.name === previousReward.roleName
          );
          if (previousRole) {
            await obj.member.roles.remove(previousRole);
          }
        }
      
        await obj.member.roles.add(role);
        levelUpChannel.send(
          `**        丨** 𝐓u débloques le grade ${role}. Félicitation ! - :tada:`
        );
      }
    }
  }

  user.xp = newXP;
  await user.save();
}

module.exports = levelUp;
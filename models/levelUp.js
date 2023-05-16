const roleRewards = require("./roleRewards");
const Discord = require("discord.js");

async function levelUp(obj, user, newXP) {
  const newLevel = Math.floor(0.1 * Math.sqrt(newXP));
  
  const levelUpChannel = obj.guild.channels.cache.find((channel) => channel.name === "🏆丨𝐈mplications");
  const levelDownChannel = obj.guild.channels.cache.find((channel) => channel.name === "🏆丨𝐈mplications");
  const author = obj instanceof Discord.Message ? obj.author : obj.user;

  if (user.level < newLevel) {
    user.level = newLevel;

    if (levelUpChannel) {
      levelUpChannel.send(
        `**${author}丨** 𝐓u viens de passer au niveau **\`${newLevel}\`** ! - :worm: !`
      );
    }

    if(newLevel !== 1) {
      handleRole(obj, newLevel, levelUpChannel, "up");
    }

  } else if (user.level > newLevel) {
    user.level = newLevel;

    if (levelDownChannel) {
      levelDownChannel.send(
        `**${author}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`** à cause de tes pari pourris... La prochaine fois tu feras attention !`
      );
    }

    handleRole(obj, newLevel, levelDownChannel, "down");
  }

  user.xp = newXP;
  await user.save();
}

async function handleRole(obj, newLevel, channel, direction) {
  const roleReward = roleRewards.find((reward) => reward.level === newLevel);
  if (roleReward) {
    const role = obj.guild.roles.cache.find((r) => r.name === roleReward.roleName);
    const previousRoleReward = roleRewards.find((reward) => reward.level === newLevel - (direction === "up" ? 1 : -1));
    if (previousRoleReward) {
      const previousRole = obj.guild.roles.cache.find((r) => r.name === previousRoleReward.roleName);
      if (previousRole) {
        await obj.member.roles.remove(previousRole);
      }
    }
    if (role) {
      const rolesToRemove = roleRewards.filter((reward) => (direction === "up" ? reward.level < newLevel : reward.level > newLevel));
    
      for (const previousReward of rolesToRemove) {
        const previousRole = obj.guild.roles.cache.find((r) => r.name === previousReward.roleName);
        if (previousRole) {
          await obj.member.roles.remove(previousRole);
        }
      }
    
      await obj.member.roles.add(role);
      channel.send(
        `**        丨** 𝐓u ${(direction === "up" ? "débloques le" : "es rétrogradé au")} grade ${role}. ${(direction === "up" ? "Félicitation" : "Courage")} ! - :${(direction === "up" ? "tada" : "muscle")}:`
      );
    }
  }
}

module.exports = levelUp;
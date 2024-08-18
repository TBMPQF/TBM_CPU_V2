const Discord = require("discord.js");
const MAX_LEVEL = 51;
const ServerConfig = require("../models/serverConfig");
const ServerRole = require("../models/serverRole");
const LEVELS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

async function getRoleRewards(serverID) {
  const serverRole = await ServerRole.findOne({ serverID: serverID });
  let roleRewards = [[], []];
  if (serverRole) {
    roleRewards[0] = serverRole.prestige0Roles.map((roleId, i) => ({
      level: i + 1,
      roleId: roleId,
    }));
    roleRewards[1] = serverRole.prestige1Roles.map((roleId, i) => ({
      level: i + 1,
      roleId: roleId,
    }));
  }
  return roleRewards;
}
async function levelUp(obj, user, newXP) {
  const serverConfig = await ServerConfig.findOne({ serverID: obj.guild.id });
  if (!serverConfig) {
    return;
  }
  const implicationChannelID = serverConfig.implicationsChannelID;
  const levelUpChannel = obj.guild.channels.cache.get(implicationChannelID);
  const levelDownChannel = obj.guild.channels.cache.get(implicationChannelID);
  let newLevel = Math.floor(0.1 * Math.sqrt(newXP));
  const author = obj instanceof Discord.Message ? obj.author : obj.user;
  const roleRewards = await getRoleRewards(obj.guild.id);
  const oldPrestige = user.prestige || 0;
  if (newLevel >= MAX_LEVEL) {
    user.prestige = oldPrestige + 1;
    newLevel = 0;
    user.xp = 0;
    user.falconix = (user.falconix || 0) + 1;
    if (levelUpChannel) {
      levelUpChannel.send(
        `**${author}丨**𝐈𝐍-𝐂𝐑𝐎-𝐘𝐀-𝐁𝐋𝐄丨𝐓u viens de passer au 𝐏restige **\`${user.prestige}\`** ! - :star: !`
      );
    }
    const previousPrestigeRoleRewards = roleRewards[oldPrestige];
    for (let reward of previousPrestigeRoleRewards) {
      const previousRole = obj.guild.roles.cache.find(
        (r) => r.name === reward.roleName
      );
      if (previousRole) {
        await obj.member.roles.remove(previousRole);
      }
    }
    handleRole(obj, 1, levelUpChannel, "up", user.prestige);
  } else {
    if (user.level < newLevel) {
      user.level = newLevel;
      user.xp = newXP;
      if (levelUpChannel) {
        levelUpChannel.send(
          `**${author}丨** 𝐓u viens de passer au niveau **\`${newLevel}\`** ! - :worm: !`
        );
      }
      handleRole(obj, newLevel, levelUpChannel, "up", user.prestige);
    } else if (user.level > newLevel) {
      user.level = newLevel;
      user.xp = newXP;
      if (levelDownChannel) {
        levelDownChannel.send(
          `**${author}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`**... 𝐋a prochaine fois tu feras attention !`
        );
      }
      handleRole(obj, newLevel, levelDownChannel, "down", user.prestige);
    }
  }
  user.level = newLevel;
  await user.save();
}
async function handleRole(obj, newLevel, channel, direction, prestige) {
  const roleRewards = await getRoleRewards(obj.guild.id);
  const currentPrestigeRoleRewards = roleRewards[prestige] || [];
  const roleIndex = LEVELS.indexOf(newLevel);
  
  if (roleIndex !== -1) {
    if (direction === "up") {
      const newRoleReward = currentPrestigeRoleRewards[roleIndex];
      if (newRoleReward) {
        const newRole = obj.guild.roles.cache.get(newRoleReward.roleId);
        if (newRole) {
          await obj.member.roles.add(newRole);
          if (newLevel !== 1) {
            channel.send(
              `**        丨** 𝐓u débloques le grade ${newRole}. 𝐅élicitation ! - :tada:`
            );
          }
        }
      }
      if (roleIndex > 0) {
        const oldRoleReward = currentPrestigeRoleRewards[roleIndex - 1];
        if (oldRoleReward) {
          const oldRole = obj.guild.roles.cache.get(oldRoleReward.roleId);
          if (oldRole) {
            await obj.member.roles.remove(oldRole);
          }
        }
      }
    } else if (direction === "down") {
      const oldRoleReward = currentPrestigeRoleRewards[roleIndex + 1];
      if (oldRoleReward) {
        const oldRole = obj.guild.roles.cache.get(oldRoleReward.roleId);
        if (oldRole) {
          await obj.member.roles.remove(oldRole);
        }
      }
      const newRoleReward = currentPrestigeRoleRewards[roleIndex];
      if (newRoleReward) {
        const newRole = obj.guild.roles.cache.get(newRoleReward.roleId);
        if (newRole) {
          await obj.member.roles.add(newRole);
          channel.send(
            `**        丨** 𝐓u es rétrogradé au grade ${newRole}. Courage ! - :muscle:`
          );
        }
      }
    }
  }
  if (newLevel === 1) {
    return;
  }
}

module.exports = levelUp;

const Discord = require("discord.js");
const MAX_LEVEL = 50;
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

  if (newLevel > MAX_LEVEL) {
    newLevel = MAX_LEVEL;
    const oldPrestige = user.prestige || 0;
    user.prestige = oldPrestige + 1;

    if (levelUpChannel) {
      levelUpChannel.send(
        `**${author}丨** 𝐈𝐍𝐂𝐑𝐎𝐘𝐀𝐁𝐋𝐄 ! 𝐓u viens de passer au 𝐏restige **\`${user.prestige}\`** ! - :star: !`
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
  }

  if (user.level < newLevel) {
    user.level = newLevel;

    if (levelUpChannel) {
      levelUpChannel.send(
        `**${author}丨** 𝐓u viens de passer au niveau **\`${newLevel}\`** ! - :worm: !`
      );
    }

    if (newLevel !== 1) {
      handleRole(obj, newLevel, levelUpChannel, "up", user.prestige);
    }
  } else if (user.level > newLevel) {
    user.level = newLevel;

    if (levelDownChannel) {
      levelDownChannel.send(
        `**${author}丨** 𝐓u viens de descendre au niveau **\`${newLevel}\`** à cause de tes pari pourris... La prochaine fois tu feras attention !`
      );
    }

    handleRole(obj, newLevel, levelDownChannel, "down", user.prestige);
  }

  if (newLevel >= MAX_LEVEL) {
    user.xp = 0;
    user.level = 0;
  } else {
    user.xp = newXP;
  }

  await user.save();
}

async function handleRole(obj, newLevel, channel, direction, prestige) {
  const roleRewards = await getRoleRewards(obj.guild.id);

  const currentPrestigeRoleRewards = roleRewards[prestige] || [];
  const roleIndex = LEVELS.indexOf(newLevel);

  if (roleIndex !== -1) {
    const roleReward = currentPrestigeRoleRewards[roleIndex];

    if (roleReward) {
      const role = obj.guild.roles.cache.get(roleReward.roleId);

      if (direction === "up") {
        const previousRoleReward = currentPrestigeRoleRewards[roleIndex - 1];

        if (previousRoleReward) {
          const previousRole = obj.guild.roles.cache.get(
            previousRoleReward.roleId
          );

          if (previousRole) {
            await obj.member.roles.remove(previousRole);
          }
        }
      } else if (direction === "down") {
        const previousRoleReward = currentPrestigeRoleRewards[roleIndex];

        if (previousRoleReward) {
          const previousRole = obj.guild.roles.cache.get(
            previousRoleReward.roleId
          );

          if (previousRole) {
            await obj.member.roles.remove(previousRole);
          }
        }
      }

      if (role) {
        await obj.member.roles.add(role);
        channel.send(
          `**        丨** 𝐓u ${
            direction === "up" ? "débloques le" : "es rétrogradé au"
          } grade ${role}. ${
            direction === "up" ? "Félicitation" : "Courage"
          } ! - :${direction === "up" ? "tada" : "muscle"}:`
        );
      }
    }
  }
}

module.exports = levelUp;

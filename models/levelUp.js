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

  // Gestion du prestige
  if (newLevel >= MAX_LEVEL) {
    user.prestige = oldPrestige + 1;
    newLevel = 0; // Réinitialisation du niveau à 1
    user.xp = 0;   // Réinitialisation de l'XP à 0

    if (levelUpChannel) {
      levelUpChannel.send(
        `**${author}丨** INCROYABLE ! Tu viens de passer au Prestige **\`${user.prestige}\`** ! - :star: !`
      );
    }

    // Gestion des rôles pour le prestige
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
    // Gestion des montées et descentes de niveau
    if (user.level < newLevel) {
      user.level = newLevel;
      user.xp = newXP; // Mettre à jour l'XP

      if (levelUpChannel) {
        levelUpChannel.send(
          `**${author}丨** Tu viens de passer au niveau **\`${newLevel}\`** ! - :worm: !`
        );
      }

      handleRole(obj, newLevel, levelUpChannel, "up", user.prestige);
    } else if (user.level > newLevel) {
      user.level = newLevel;
      user.xp = newXP; // Mettre à jour l'XP

      if (levelDownChannel) {
        levelDownChannel.send(
          `**${author}丨** Tu viens de descendre au niveau **\`${newLevel}\`**... La prochaine fois tu feras attention !`
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
      // Ajoute le rôle du nouveau niveau
      const newRoleReward = currentPrestigeRoleRewards[roleIndex];
      if (newRoleReward) {
        const newRole = obj.guild.roles.cache.get(newRoleReward.roleId);
        if (newRole) {
          await obj.member.roles.add(newRole);
          channel.send(
            `**        丨** 𝐓u débloques le grade ${newRole}. Félicitation ! - :tada:`
          );
        }
      }
      // Retire le rôle du niveau précédent
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
      // Retire le rôle du niveau précédent
      const oldRoleReward = currentPrestigeRoleRewards[roleIndex + 1];
      if (oldRoleReward) {
        const oldRole = obj.guild.roles.cache.get(oldRoleReward.roleId);
        if (oldRole) {
          await obj.member.roles.remove(oldRole);
        }
      }
      // Ajoute le rôle du nouveau niveau
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
}

module.exports = levelUp;

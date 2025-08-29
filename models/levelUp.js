const Discord = require("discord.js");
const mongoose = require("mongoose");
const ServerConfig = require("../models/serverConfig");
const ServerRole   = require("../models/serverRole");
const User = mongoose.models.User || require("../models/experience");

const LMAX = 50;
const LEVELS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

function prestigeFactor(p) { return 1 + 0.15 * Math.max(0, p || 0); }

function xpAtLevel(L, p) {
  const pf = prestigeFactor(p);
  const base = (Math.max(0, L)) / 0.1;
  return Math.pow(base, 2) * pf;
}

function levelFromXP(xp, p) {
  const pf = prestigeFactor(p);
  const raw = Math.floor(0.1 * Math.sqrt(Math.max(0, xp) / pf));
  return (p > 0) ? Math.max(1, raw) : raw;
}

function normalizeStored(val) {
  if (!val) return { id: undefined, name: undefined };
  if (Array.isArray(val)) return { id: val[0], name: val[1] };
  if (typeof val === "string") return { id: val, name: undefined };
  return { id: undefined, name: undefined };
}

async function fetchRoleRewardsByPrestige(serverID) {
  const doc = await ServerRole.findOne({ serverID });
  const out = {}; for (let i = 0; i <= 10; i++) out[i] = [];
  if (!doc) return out;

  for (let i = 0; i <= 10; i++) {
    const data = doc[`prestige${i}Roles`];

    if (data && typeof data.get === "function") {
      data.forEach((rawVal, lvlKey) => {
        const { id, name } = normalizeStored(rawVal);
        const lvl = Number(lvlKey);
        if (Number.isFinite(lvl) && id) out[i].push({ level: lvl, roleId: id, roleName: name || "" });
      });
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      Object.entries(data).forEach(([lvlKey, rawVal]) => {
        const { id, name } = normalizeStored(rawVal);
        const lvl = Number(lvlKey);
        if (Number.isFinite(lvl) && id) out[i].push({ level: lvl, roleId: id, roleName: name || "" });
      });
    } else if (Array.isArray(data)) {
      LEVELS.forEach((lvl, idx) => {
        const id = data[idx];
        if (id) out[i].push({ level: lvl, roleId: id, roleName: "" });
      });
    }

    out[i].sort((a, b) => a.level - b.level);
  }
  return out;
}

function pickRewardForLevel(rewards, level) {
  let chosen = null;
  for (const r of rewards) { if (r.level <= level) chosen = r; else break; }
  return chosen;
}

async function applyPrestigeRole(member, rewards, chosen) {
  const allRoleIds = rewards.map(r => r.roleId).filter(Boolean);
  const cache = member.roles.cache;

  const toRemove = allRoleIds.filter(id => (!chosen || id !== chosen.roleId) && cache.has(id));
  if (toRemove.length) {
    try { await member.roles.remove(toRemove); } catch (e) {
      console.warn("[roles] remove failed:", e?.message);
    }
  }

  if (chosen) {
    let roleObj = member.guild.roles.cache.get(chosen.roleId);
    if (!roleObj) {
      try { roleObj = await member.guild.roles.fetch(chosen.roleId); } catch {}
    }
    if (!roleObj) {
      console.warn(`[roles] inconnu dans le serveur: ${chosen.roleId}`);
      return;
    }
    if (!roleObj.editable) {
      console.warn(`[roles] non éditable (hiérarchie/perms): ${roleObj.name} (${roleObj.id})`);
      return;
    }
    if (!cache.has(roleObj.id)) {
      try { await member.roles.add(roleObj); } catch (e) {
        console.warn("[roles] add failed:", e?.message);
      }
    }
  }
}

async function levelUp(obj, userDoc, newXP) {
  const guild = obj.guild;
  const member = obj.member;
  const authorUser = obj.author ?? obj.user ?? member?.user;
  if (!guild || !member || !authorUser) return;

  const serverConfig = await ServerConfig.findOne({ serverID: guild.id });
  if (!serverConfig) return;

  const chId = serverConfig.implicationsChannelID;
  const levelUpChannel = chId ? guild.channels.cache.get(chId) : null;
  const levelDownChannel = levelUpChannel;

  const fresh = await User.findOne({ userID: userDoc.userID, serverID: guild.id });
  if (!fresh) return;

  const p = fresh.prestige || 0;
  const oldLevel = Math.max(p > 0 ? 1 : 0, fresh.level || 0);
  const prevXp = fresh.xp ?? 0;
  const deltaXP = (newXP ?? 0) - prevXp;
  const targetRaw = levelFromXP(newXP, p);
  const target = Math.min(targetRaw, LMAX + 1);

  const prestigeThreshold = xpAtLevel(LMAX + 1, p);
  if (newXP >= prestigeThreshold) {
    const res = await User.updateOne(
      {
        userID: fresh.userID,
        serverID: guild.id,
        prestige: p,
        level: { $lte: LMAX },
        xp: { $gte: prestigeThreshold },
      },
      {
        $inc: { prestige: 1, falconix: 1 },
        $set: { level: 1, xp: 0 },
      }
    );

    if (res.modifiedCount > 0) {
      const newPrestige = p + 1;

      userDoc.prestige = newPrestige;
      userDoc.level = 1;
      userDoc.xp = 0;

      if (levelUpChannel) {
        levelUpChannel.send(`**${authorUser}丨** 𝐓u viens de passer au Prestige **\`${newPrestige}\`** ! - ⭐`);
      }

      const rewardsByPrestige = await fetchRoleRewardsByPrestige(guild.id);
      const prevRewards = rewardsByPrestige[p] || [];
      const prevIds = prevRewards.map(r => r.roleId).filter(Boolean);
      if (prevIds.length) await member.roles.remove(prevIds).catch(() => {});

      const newRewards = rewardsByPrestige[newPrestige] || [];
      const chosen = pickRewardForLevel(newRewards, 1);
      await applyPrestigeRole(member, newRewards, chosen);

      if (levelUpChannel && chosen) {
        const roleObj = guild.roles.cache.get(chosen.roleId);
        if (roleObj) levelUpChannel.send(`**丨** 𝐓u débloques le grade ${roleObj}. 𝐅élicitations ! - 🎉`);
      }
    }
    return;
  }

  if (target > oldLevel && target <= LMAX) {
      const res = await User.updateOne(
        { userID: fresh.userID, serverID: guild.id, level: { $lt: target } },
        { $set: { level: target, xp: newXP } }
      );

      const after = await User.findOne({ userID: fresh.userID, serverID: guild.id });
      const effectiveLevel = Math.max(p > 0 ? 1 : 0, after?.level ?? oldLevel);

      userDoc.level = effectiveLevel;
      userDoc.xp    = newXP;

      if (levelUpChannel && effectiveLevel > oldLevel) {
        levelUpChannel.send(`**${authorUser}丨** 𝐓u viens de passer au niveau **\`${effectiveLevel}\`** ! - :worm:`);
      }

      const rewardsByPrestige = await fetchRoleRewardsByPrestige(guild.id);
      const rewards = rewardsByPrestige[p] || [];
      const chosen  = pickRewardForLevel(rewards, effectiveLevel);

      const hadBefore = chosen ? member.roles.cache.has(chosen.roleId) : false;

      await applyPrestigeRole(member, rewards, chosen);
      await member.fetch(true).catch(() => {});

      if (levelUpChannel && chosen && !hadBefore && effectiveLevel !== 1) {
        const roleObj = guild.roles.cache.get(chosen.roleId) || await guild.roles.fetch(chosen.roleId).catch(() => null);
        if (roleObj) levelUpChannel.send(`**丨** 𝐓u débloques le grade ${roleObj}. 𝐅élicitations ! - 🎉`);
      }
      return;
    }

  if (target < oldLevel && deltaXP < 0) {
    const clamped = Math.max(p > 0 ? 1 : 0, target);
    const res = await User.updateOne(
      { userID: fresh.userID, serverID: guild.id, prestige: p, level: oldLevel },
      { $set: { level: clamped, xp: newXP } }
    );

    if (res.modifiedCount > 0) {
      userDoc.level = clamped;
      userDoc.xp = newXP;

      if (levelDownChannel) {
        levelDownChannel.send(`**${authorUser}丨** 𝐓u descends au niveau **\`${clamped}\`**… Courage !`);
      }

      const rewardsByPrestige = await fetchRoleRewardsByPrestige(guild.id);
      const rewards = rewardsByPrestige[p] || [];
      const chosen  = pickRewardForLevel(rewards, clamped);
      await applyPrestigeRole(member, rewards, chosen);
    }
    return;
  }

  await User.updateOne(
    { userID: fresh.userID, serverID: guild.id, prestige: p, level: oldLevel },
    { $set: { xp: newXP } }
  );
  userDoc.xp = newXP;
}

module.exports = levelUp;

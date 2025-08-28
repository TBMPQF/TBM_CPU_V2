const { EmbedBuilder } = require("discord.js");
const ComplianceQueue  = require("../models/complianceQueue");
const ServerConfig     = require("../models/serverConfig");
const ServerRoleMenu   = require("../models/serverRoleMenu");
const TBM_SERVER_ID = "716810235985133568";

const gameRoleCache = new Map();
const GAME_ROLE_CACHE_TTL_MS = 15 * 60 * 1000;

const GAME_ROLE_NAMES_FALLBACK = [
  "Apex Legends", "Rocket League", "Palworld", "Minecraft",
  "Call of Duty", "New World", "Discord JS"
];

function stripInvisible(s) {
  return String(s || "")
    .replace(/[\u200B-\u200F\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function sameName(a, b) { return stripInvisible(a) === stripInvisible(b); }
async function getGameRoleIDs(serverID) {
  const cached = gameRoleCache.get(serverID);
  const now = Date.now();
  if (cached && cached.exp > now) return cached.ids;

  const doc = await ServerRoleMenu.findOne({ serverID }).lean().catch(() => null);
  const ids = new Set();
  if (doc?.menus?.length) {
    for (const menu of doc.menus) {
      if (!Array.isArray(menu.roles)) continue;
      for (const r of menu.roles) {
        if (r?.roleId) ids.add(r.roleId);
      }
    }
  }

  gameRoleCache.set(serverID, { ids, exp: now + GAME_ROLE_CACHE_TTL_MS });
  return ids;
}
function hasCompliantRoles(member, cfg, gameRoleIDs) {
  const reglementOk = cfg.roleReglementID
    ? member.roles.cache.has(cfg.roleReglementID)
    : (cfg.roleReglementName
        ? member.roles.cache.some(r => sameName(r.name, cfg.roleReglementName))
        : false);

  let gameOk = false;
  if (gameRoleIDs?.size) {
    gameOk = [...gameRoleIDs].some(id => member.roles.cache.has(id));
  } else {
    gameOk = GAME_ROLE_NAMES_FALLBACK.some(name =>
      member.roles.cache.some(r => sameName(r.name, name))
    );
  }

  return { ok: reglementOk && gameOk, reglementOk, gameOk };
}
async function sendKickLog(guild, member, sc, doc, state) {
  const logChannel = sc?.logChannelID ? guild.channels.cache.get(sc.logChannelID) : null;
  if (!logChannel) return;

  const missing = [];
  if (!state.reglementOk) missing.push("rôle règlement");
  if (!state.gameOk)      missing.push("≥ 1 rôle de jeu");

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setTitle("Expulsion pour non conformité")
    .setDescription([
      `**Membre :** <@${member.id}> (${member.id})`,
      `**Raison :** Non conformité après échéance : manque ${missing.join(" + ")}.`
    ].join("\n"))
    .addFields(
      { name: "Arrivé",   value: doc?.joinedAt   ? `<t:${Math.floor(new Date(doc.joinedAt).getTime()/1000)}:f>`   : "—", inline: true },
      { name: "Rappel",   value: doc?.remindAt   ? `<t:${Math.floor(new Date(doc.remindAt).getTime()/1000)}:f>`   : "—", inline: true },
      { name: "Échéance", value: doc?.deadlineAt ? `<t:${Math.floor(new Date(doc.deadlineAt).getTime()/1000)}:f>` : "—", inline: true },
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}
async function processOne(bot, doc) {
  const guild = bot.guilds.cache.get(doc.serverID);
  if (!guild || guild.id !== TBM_SERVER_ID) {
    await ComplianceQueue.deleteOne({ _id: doc._id });
    return;
  }

  let member = guild.members.cache.get(doc.userID);
  if (!member) {
    try { member = await guild.members.fetch(doc.userID); }
    catch { await ComplianceQueue.deleteOne({ _id: doc._id }); return; }
  }

  const sc = await ServerConfig.findOne({ serverID: guild.id }).lean();
  if (!sc) { await ComplianceQueue.deleteOne({ _id: doc._id }); return; }

  const gameIDs = await getGameRoleIDs(guild.id);
  const state = hasCompliantRoles(member, sc, gameIDs);

  if (state.ok) { await ComplianceQueue.deleteOne({ _id: doc._id }); return; }

  const now = Date.now();

  if (!doc.reminded && doc.remindAt && now >= new Date(doc.remindAt).getTime()) {
    try {
      const missing = [];
      if (!state.reglementOk) missing.push("accepter le règlement");
      if (!state.gameOk)      missing.push("choisir au moins **un** rôle de jeu");
      const list = missing.length ? `Il te manque : ${missing.join(" + ")}.` : "";

      await member.send(
        "丨𝐒alutation !\n" +
        "Pour accéder aux salons, merci d’__accepter le règlement__ et de __prendre au moins un rôle de jeu__.\n" +
        (sc.reglementChannelID ? `• Règlement : <#${sc.reglementChannelID}>\n` : "") +
        (sc.roleChannelID     ? `• Rôles : <#${sc.roleChannelID}>\n` : "") +
        (list ? `\n${list}\n` : "") +
        "\n𝐌erci !"
      ).catch(() => {});
    } catch {}
    await ComplianceQueue.updateOne({ _id: doc._id }, { $set: { reminded: true } });
  }

  if (doc.deadlineAt && now >= new Date(doc.deadlineAt).getTime()) {
    const state2 = hasCompliantRoles(member, sc, gameIDs);
    if (!state2.ok) {
      const missing = [];
      if (!state2.reglementOk) missing.push("rôle règlement");
      if (!state2.gameOk)      missing.push("≥ 1 rôle de jeu");
      const reason = `Non conformité après échéance : manque ${missing.join(" + ")}.`;
      try { await member.kick(reason); } catch {}
      await sendKickLog(guild, member, sc, doc, state2);
    }
    await ComplianceQueue.deleteOne({ _id: doc._id });
  }
}
function startComplianceTicker(bot) {
  const TICK_MS = 15 * 60 * 1000;
  const run = async () => {
    const now = Date.now();
    const batch = await ComplianceQueue.find({
      serverID: TBM_SERVER_ID,
      $or: [
        { reminded: false, remindAt: { $lte: new Date(now) } },
        { deadlineAt: { $lte: new Date(now) } }
      ]
    }).limit(100).lean();

    if (!batch.length) return;

    for (const doc of batch) {
      await processOne(bot, doc);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  setTimeout(run, 30 * 1000);
  setInterval(run, TICK_MS);
}

module.exports = { startComplianceTicker };

const path = require("path");
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const User = require("../../models/experience");
const { longDescription } = require("../modération/setconfig");

const MEDAL_GOLD_PNG   = "https://twemoji.maxcdn.com/v/latest/72x72/1f947.png";
const MEDAL_SILVER_PNG = "https://twemoji.maxcdn.com/v/latest/72x72/1f948.png";
const MEDAL_BRONZE_PNG = "https://twemoji.maxcdn.com/v/latest/72x72/1f949.png";
const MIC_PNG          = "https://twemoji.maxcdn.com/v/latest/72x72/1f3a4.png";
const FLAME_PNG        = "https://twemoji.maxcdn.com/v/latest/72x72/1f525.png";
const MSG_PNG          = "https://twemoji.maxcdn.com/v/latest/72x72/1f4ac.png";

try {
  const fontPath = path.resolve(__dirname, "../../utils/NotoSansMath-Regular.ttf");
  if (GlobalFonts?.registerFromPath) GlobalFonts.registerFromPath(fontPath, "FalconMath");
  else if (GlobalFonts?.register)     GlobalFonts.register(fontPath, "FalconMath");
} catch (e) {
  console.warn("[rank] Impossible d’enregistrer la police:", e?.message);
}

const FALCON_BG_URL = "https://i.postimg.cc/Zn88HV3f/Falcon23.png";
const FALCONIX_EMOJI_URL = "https://cdn.discordapp.com/emojis/1186719745106513971.png?size=64&quality=lossless";

const PRESTIGE_BADGES = [
  "https://i.postimg.cc/mZpjd60n/p1.png",
  "https://i.postimg.cc/ZK1cmvYF/p2.png",
  "https://i.postimg.cc/7LNMSB3m/p3.png",
  "https://i.postimg.cc/rmn1PKY4/p4.png",
  "https://i.postimg.cc/5NFBs95H/p5.png",
  "https://i.postimg.cc/Nj61wNzB/p6.png",
  "https://i.postimg.cc/bvq1YQ7b/p7.png",
  "https://i.postimg.cc/nzz7Bnch/p8.png",
  "https://i.postimg.cc/3RcGZzdC/p9.png",
  "https://i.postimg.cc/qq63DQKf/p10.png",
];
const PRESTIGE_ICON_URL = PRESTIGE_BADGES[0] || "https://i.postimg.cc/Zn88HV3f/Falcon23.png";

const theme = {
  bg: "#0f1216",
  card: "#1b2028",
  accentBlue: "#9CCBFF",
  accentGold: "#F5C243",
  accentGoldDark: "#E3A923",
  track: "rgba(255,255,255,0.12)",
  text: "#ffffff",
  subtext: "#c9d2e3",
  ring: "#ffffffff",
};

module.exports = {
  name: "rank",
  description: "丨𝐀ffiche ton niveau d'expérience.",
  longDescription: ` 𝐋e panneau de contrôle de ton profil !
    𝐀vec \`/rank\`, affiche une carte ultra-propre de tes stats : 
    • 𝐍iveau actuel, barre de progression et 𝐗𝐏 requise pour le prochain palier.  
    • 𝐏restige & badges (ça brille, oui).  
    • 𝐂lassement sur le serveur, histoire de flex.  
    • 𝐓emps passé en vocal, nombre de messages et ton solde 𝐅alconix.  
    • 𝐒érie 𝐃aily maximale atteinte (🔥 record personnel).

    𝐔tile pour suivre ta montée, comparer avec les autres et te fixer des objectifs.
    𝐏romis : aucune publicité ciblée, juste ton égo bien placé. 🚀`,
  dm: false,
  permission: "Aucune",
  async execute(interaction) {
    const guild = interaction.guild;
    const target = interaction.user;
    const user = await User.findOne({ userID: target.id, serverID: guild.id });

    if (!user) {
      return interaction.reply({
        content: "𝐓u veux que j'affiche quoi ? 𝐈l faut envoyer des messages avant !",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });

    const allUsers = await User.find({ serverID: guild.id }).sort({ prestige: -1, xp: -1 });
    const position = allUsers.findIndex((u) => u.userID === target.id) + 1;

    const prestigeFactor = (p) => 1 + 0.15 * Math.max(0, p || 0);
    const pf = prestigeFactor(user.prestige || 0);

    const xpReq = (lvl) => Math.pow(lvl / 0.1, 2) * pf;

    const nextLevel = user.level + 1;
    const xpRequiredForNextLevel = xpReq(nextLevel);
    const xpAtCurrentLevel = xpReq(user.level);
    const currentLevelXP = Math.max(0, (user.xp || 0) - xpAtCurrentLevel);
    const xpRequiredForCurrentLevel = Math.max(1, xpRequiredForNextLevel - xpAtCurrentLevel);

    const totalXP = Number.isFinite(user.careerXP)
      ? user.careerXP
      : (() => {
          const p = Math.max(0, user.prestige || 0);
          let total = 0;
          const base50 = Math.pow(50 / 0.1, 2);
          for (let i = 0; i < p; i++) total += (1 + 0.15 * i) * base50;
          return Math.round(total + Math.max(0, user.xp || 0));
        })();

    const voiceSec = Number(user.voiceTime ?? 0);
    const voiceMs  = Number.isFinite(voiceSec) ? voiceSec * 1000 : 0;

    const falconix = user.falconix ?? user.wallet ?? user.coins ?? 0;
    const msgCount = Number(user.messageCount ?? 0);

    const member = interaction.member ?? (await guild.members.fetch(target.id).catch(() => null));
    let roleName = "";
    let roleColor = theme.subtext;
    if (member) {
      const roles = member.roles.cache
        .filter(r => r.id !== guild.id && !r.managed);
      const top = roles.sort((a, b) => b.position - a.position).first();
      if (top) {
        roleName = top.name;
        roleColor = top.color ? `#${top.color.toString(16).padStart(6, "0")}` : theme.subtext;
      }
    }

    const buffer = await renderRankCard({
      tag: target.tag ?? target.username,
      avatarURL: target.displayAvatarURL({ extension: "png", size: 256, forceStatic: true }),
      level: user.level,
      prestige: user.prestige,
      xp: user.xp,
      nextLevelXP: xpRequiredForNextLevel,
      currentLevelXP,
      neededLevelXP: xpRequiredForCurrentLevel,
      totalXP,
      position,
      voiceMs,
      falconix,
      messages: msgCount,
      roleName,
      roleColor,
      maxDaily: user.maxDaily ?? 0,
    });

    const file = new AttachmentBuilder(buffer, { name: "rank.png" });
    const sent = await interaction.editReply({ files: [file] });
    setTimeout(() => { sent.delete().catch(() => {}); }, 30000);
  },
};

async function renderRankCard({
  tag, avatarURL, level, prestige, xp, nextLevelXP, currentLevelXP, neededLevelXP, totalXP, position,
  voiceMs, falconix, messages = 0, roleName = "", roleColor = theme.subtext, maxDaily = 0,
}) {
  const W = 920, H = 270;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  function drawStaticLightning(ctx, x, y, h, color) {
      ctx.save();

      // éclair plus clair que la barre
      function lighten(hex, amount = 60) {
        const n = parseInt(hex.replace("#", ""), 16);
        let r = Math.min(255, (n >> 16) + amount);
        let g = Math.min(255, ((n >> 8) & 255) + amount);
        let b = Math.min(255, (n & 255) + amount);
        return `rgb(${r},${g},${b})`;
      }

      const glow = lighten(color, 80);
      const core = lighten(color, 40);

      let cx = x;
      let cy = y;

      const segments = 6 + Math.floor(Math.random() * 3);
      const maxOffset = 10;

      // --- GLOW ---
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let i = 0; i < segments; i++) {
        cx += (Math.random() - 0.5) * maxOffset;
        cy += h / segments;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // --- CORE ---
      cx = x;
      cy = y;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = core;
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let i = 0; i < segments; i++) {
        cx += (Math.random() - 0.5) * maxOffset;
        cy += h / segments;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      ctx.restore();
  }
  function splitRoleGlyph(name) {
    if (!name) return { hasBar: false, rest: "" };
    const trimmed = String(name).trimStart();
    if (trimmed.startsWith("丨")) {
      return { hasBar: true, rest: trimmed.replace(/^丨\s*/, "") };
    }
    return { hasBar: false, rest: trimmed };
  }
  function normalizeMathBold(str = "") {
    return Array.from(str).map(ch => {
      const cp = ch.codePointAt(0);

      // A–Z
      if (cp >= 0x1D400 && cp <= 0x1D419)
        return String.fromCharCode(0x41 + (cp - 0x1D400));

      // a–z
      if (cp >= 0x1D41A && cp <= 0x1D433)
        return String.fromCharCode(0x61 + (cp - 0x1D41A));

      // 0–9
      if (cp >= 0x1D7CE && cp <= 0x1D7D7)
        return String.fromCharCode(0x30 + (cp - 0x1D7CE));

      return ch;
    }).join("");
  }

  // ===== FOND arrondi =====
  ctx.save();
  roundRectPath(ctx, 0, 0, W, H, 26);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, theme.bg);
  bg.addColorStop(1, "#131821");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ===== PANNEAU =====
  const PANEL = { x: 14, y: 14, w: W - 28, h: H - 28, r: 20 };
  fillRoundRect(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r, theme.card);

  // Filigrane faucon (clip au panneau)
  try {
    const falcon = await loadImage(FALCON_BG_URL);
    const fw = Math.min(W * 0.55, falcon.width);
    const fh = fw * (falcon.height / falcon.width);
    ctx.save();
    roundRectPath(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r);
    ctx.clip();
    ctx.globalAlpha = 0.14;
    ctx.drawImage(falcon, W - fw - 30, (H - fh) / 2, fw, fh);
    ctx.globalAlpha = 1;
    ctx.restore();
  } catch {}

  // Flamme maxDaily (si > 0)
  await drawMaxDailyFlame(ctx, PANEL, maxDaily);

  // ===== AVATAR =====
  const SHIFT = -30;
  const AVA = 112;
  const ax = 36, ay = (H - AVA) / 2 + SHIFT;
  const avatar = await loadImage(avatarURL);
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax + AVA / 2, ay + AVA / 2, AVA / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, ax, ay, AVA, AVA);
  ctx.restore();

  // Anneau doré
  ctx.lineWidth = 6;
  ctx.strokeStyle = roleColor || theme.ring;
  ctx.beginPath();
  ctx.arc(ax + AVA / 2, ay + AVA / 2, AVA / 2 + 3, 0, Math.PI * 2);
  ctx.stroke();

  // ===== TEXTES (haut) =====
  ctx.fillStyle = theme.text;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;

  // Pseudo
  ctx.font = "900 22px FalconMath, Arial, sans-serif";
  const name = firstMathBold(truncate(tag, 28));
  ctx.fillText(name, 170, 88 + SHIFT);

  // Position + médaille
  const nameWidth = ctx.measureText(name).width;
  const posX = 170 + nameWidth + 12;
  const posLabel = ordinalAbbrevFR(position);
  ctx.font = "900 22px FalconMath, Arial, sans-serif";
  ctx.fillStyle = theme.subtext;
  ctx.fillText(posLabel, posX, 88 + SHIFT);

  let medalUrl = null;
  if (position === 1) medalUrl = MEDAL_GOLD_PNG;
  else if (position === 2) medalUrl = MEDAL_SILVER_PNG;
  else if (position === 3) medalUrl = MEDAL_BRONZE_PNG;

  let tailX = posX + ctx.measureText(posLabel).width;
  if (medalUrl) {
    try {
      const medal = await loadImage(medalUrl);
      const mSize = 20;
      const mX = tailX + 6;
      const mY = 70 + SHIFT;
      ctx.drawImage(medal, mX, mY, mSize, mSize);
      tailX = mX + mSize;
    } catch {}
  }

  // Rôle (petit rond + texte coloré)
  function splitRoleGlyph(name) {
  if (!name) return { glyph: null, rest: "" };
  const trimmed = String(name).trimStart();
  if (trimmed.startsWith("丨")) {
    return { glyph: "丨", rest: trimmed.replace(/^丨\s*/, "") };
  }
  // ajoute ici d'autres variantes si tu en utilises : "┃", "❘", etc.
  return { glyph: null, rest: trimmed };
}

// Rôle (glyphe + texte dans la couleur du rôle)
  const roleRawName = roleName && roleName !== "@everyone" ? roleName : "";
  const { hasBar, rest } = splitRoleGlyph(roleRawName);
  const roleText = rest
    ? truncate(normalizeMathBold(rest), 22)
    : "";
  const color = roleColor || theme.subtext;

  if (roleText || hasBar) {
    const baseX = tailX + 16;
    const baseY = 86 + SHIFT;

    ctx.save();

    let textX = baseX;

    if (hasBar) {
      const barH = 18;
      const barW = 3;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      ctx.fillRect(
        baseX,
        baseY - barH / 2 + 1,
        barW,
        barH
      );

      ctx.shadowBlur = 0;
      textX += barW + 10;
    }

    ctx.font = "600 18px Inter, Segoe UI, Arial, sans-serif";
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(roleText, textX, baseY);

    ctx.restore();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = theme.subtext;
  ctx.font = "600 18px FalconMath, Arial, sans-serif";
  ctx.fillText(`${firstMathBold("Level")} : ${level}`, 170, 118 + SHIFT);
  ctx.fillText(`${firstMathBold("XP")} : ${k(xp)} / ${k(nextLevelXP)}    ${firstMathBold("Total")} : ${k(totalXP)}`, 170, 144 + SHIFT);

  const barX = 170, barY = 172 + SHIFT, barW = W - barX - 36, barH = 30;
  fillRoundRect(ctx, barX, barY, barW, barH, barH / 2, theme.track);
  const pct = Math.max(0, Math.min(1, !neededLevelXP ? 1 : currentLevelXP / neededLevelXP));
  const grad = ctx.createLinearGradient(barX, barY, barX + Math.max(barH, barW * pct), barY);
  grad.addColorStop(0, roleColor);
  grad.addColorStop(1, roleColor);
  fillRoundRect(ctx, barX, barY, Math.max(barH, barW * pct), barH, barH / 2, grad);
  if (pct > 0.05) {
    const lightningCount = Math.max(
      1,
      Math.floor(pct * 8)
    );

    const usableWidth = barW * pct;

    for (let i = 0; i < lightningCount; i++) {
      const lx = barX + 10 + Math.random() * (usableWidth - 20);
      drawStaticLightning(
        ctx,
        lx,
        barY + 4,
        barH - 8,
        roleColor
      );
    }
  }

  const prestigeCount = Math.max(0, Number(prestige) || 0);
  if (prestigeCount > 0) {
    const badgesSize = 30;
    const gapTop = barY + barH + 6;
    const pillH = 36;
    const pillY = H - 22 - pillH;
    const gapBottom = pillY - 6;
    const badgesY = Math.floor(gapTop + (gapBottom - gapTop - badgesSize) / 2);

    await drawPrestigeBadges(ctx, {
      count: prestigeCount,
      right: PANEL.x + PANEL.w - 14,
      y: badgesY,
      size: badgesSize,
      gap: 8,
    });
  }

  const pillH2 = 36;
  const pillY2 = H - 22 - pillH2;
  const PILL_GAP = 12;

  const vocalLabel = firstMathBold("Vocal");
  const vocalValue = formatVoiceJHMS(voiceMs);

  const msgLabel   = firstMathBold("Messages");
  const msgValue   = (Number(messages) || 0).toLocaleString("fr-FR");

  const falcLabel  = firstMathBold("Falconix");
  const falcValue  = formatFalconix(falconix);

  const pillX1 = 36;
  const vocalW = Math.ceil(measurePillWidth(ctx, vocalLabel, vocalValue, { divider: true }));

  const pillX2 = pillX1 + vocalW + PILL_GAP;
  const msgW   = Math.ceil(measurePillWidth(ctx, msgLabel, msgValue, { divider: true }));

  const pillX3 = pillX2 + msgW + PILL_GAP;
  const falcWDesired = measurePillWidth(ctx, falcLabel, falcValue, { divider: true });
  const availableForFalc = Math.max(0, (W - 18) - pillX3 - PILL_GAP);
  const falcW = Math.ceil(Math.min(falcWDesired, availableForFalc));

  await drawPillWithIcon(ctx, pillX1, pillY2, vocalW, pillH2, MIC_PNG,  vocalLabel, vocalValue, { divider: true });
  await drawPillWithIcon(ctx, pillX2, pillY2, msgW,   pillH2, MSG_PNG,  msgLabel,   msgValue,   { divider: true });
  if (falcW > 0) {
    await drawPillWithIcon(ctx, pillX3, pillY2, falcW, pillH2, FALCONIX_EMOJI_URL, falcLabel, falcValue, { divider: true });
  }

  return canvas.toBuffer("image/png");
}

async function drawPillWithIcon(ctx, x, y, w, h, iconUrl, label, value, opts = {}) {
  const { divider = false } = opts;

  fillRoundRect(ctx, x, y, w, h, h / 2, "rgba(255,255,255,0.06)");

  const s = 20;
  const ix = x + 10;
  const iy = y + (h - s) / 2;
  try {
    const img = await loadImage(iconUrl);
    ctx.drawImage(img, ix, iy, s, s);
  } catch {}

  let tx = ix + s + 10;

  if (divider) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(tx - 6, y + 6, 2, h - 12);
    ctx.restore();
  }

  ctx.font = "600 14px FalconMath, Inter, Segoe UI, Arial, sans-serif";
  ctx.fillStyle = theme.subtext;
  ctx.fillText(label, tx, y + h / 2 + 5);

  ctx.font = "700 16px FalconMath, Inter, Segoe UI, Arial, sans-serif";
  ctx.fillStyle = theme.text;
  const vw = ctx.measureText(value).width;
  ctx.fillText(value, x + w - vw - 14, y + h / 2 + 5);
}

async function drawPrestigeBadges(ctx, { count, right, y, size = 30, gap = 8 }) {
  if (!Number.isFinite(count) || count <= 0) return;

  let x = right - size;
  for (let p = 1; p <= count; p++) {
    const url = PRESTIGE_BADGES[p - 1] ?? PRESTIGE_ICON_URL;
    try {
      const img = await loadImage(url);
      const scale = Math.max(size / img.width, size / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = x + (size - dw) / 2;
      const dy = y + (size - dh) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, size, size);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } catch {}
    x -= (size + gap);
  }
}

function fillRoundRect(ctx, x, y, w, h, r, style) {
  ctx.beginPath();
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fillStyle = style;
  ctx.fill();
}

function truncate(str, max) { return str.length > max ? str.slice(0, max - 1) + "…" : str; }
function k(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 ? 1 : 0)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return `${Math.floor(n)}`;
}

function measurePillWidth(ctx, label, value, { divider = false } = {}) {
  const prev = ctx.font;
  ctx.font = "600 14px FalconMath, Inter, Segoe UI, Arial, sans-serif";
  const lw = ctx.measureText(label).width;
  ctx.font = "700 16px FalconMath, Inter, Segoe UI, Arial, sans-serif";
  const vw = ctx.measureText(value).width;
  ctx.font = prev;

  const icon = 20, leftPad = 10, gapIcon = 10, dividerSpace = divider ? 12 : 0, midGap = 18, rightPad = 14;
  return leftPad + icon + gapIcon + dividerSpace + lw + midGap + vw + rightPad;
}

function formatFalconix(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 5, maximumFractionDigits: 5 });
}

function formatVoiceJHMS(ms = 0) {
  if (!ms || ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}j`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);
  return parts.length ? parts.join(" ") : "0s";
}

function toMathBold(ch) {
  const cp = ch.codePointAt(0);
  if (cp >= 0x41 && cp <= 0x5A) return String.fromCodePoint(0x1D400 + (cp - 0x41));
  if (cp >= 0x61 && cp <= 0x7A) return String.fromCodePoint(0x1D41A + (cp - 0x61));
  if (cp >= 0x30 && cp <= 0x39) return String.fromCodePoint(0x1D7CE + (cp - 0x30));
  return ch;
}
function firstMathBold(label) {
  let done = false;
  return Array.from(label).map(c => {
    if (!done && /[A-Za-z0-9]/.test(c)) { done = true; return toMathBold(c); }
    return c;
  }).join("");
}
function ordinalAbbrevFR(n) { return n === 1 ? "1er" : `${n}e`; }

function roundRectPath(ctx, x, y, w, h, r = 0) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function computeFlameSizeForValue(ctx, rawNum, {
  base = 36,
  step = 3,
  min  = 45,
  max  = 70,
  ratio = 0.64,
  fontScale = 0.40,
} = {}) {
  const num = Math.max(0, Number(rawNum) || 0);
  const label = num.toLocaleString("fr-FR");
  const digits = String(Math.floor(num)).length;

  let size = Math.min(max, Math.max(min, base + step * Math.max(0, digits - 1)));
  let fontSize = Math.round(size * fontScale);

  const fits = () => ctx.measureText(label).width <= size * ratio;

  ctx.font = `800 ${fontSize}px FalconMath, Inter, Segoe UI, Arial, sans-serif`;
  while (!fits() && size < max) {
    size += 2;
    fontSize = Math.round(size * fontScale);
    ctx.font = `800 ${fontSize}px FalconMath, Inter, Segoe UI, Arial, sans-serif`;
  }
  while (!fits() && fontSize > 9) {
    fontSize -= 1;
    ctx.font = `800 ${fontSize}px FalconMath, Inter, Segoe UI, Arial, sans-serif`;
  }

  return { size, fontSize, label };
}

async function drawMaxDailyFlame(ctx, PANEL, maxDaily) {
  const num = Number(maxDaily) || 0;
  if (num <= 0) return;

  const pad = 14;
  const { size: flameSize, fontSize, label } = computeFlameSizeForValue(ctx, num);

  const flameX = PANEL.x + PANEL.w - pad - flameSize;
  const flameY = PANEL.y + pad;

  ctx.save();
  roundRectPath(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r);
  ctx.clip();

  try {
    const img = await loadImage(FLAME_PNG);
    ctx.globalAlpha = 0.85;
    ctx.drawImage(img, flameX, flameY, flameSize, flameSize);
    ctx.globalAlpha = 1;
  } catch {}

  const cx = flameX + flameSize / 2;
  const cy = flameY + flameSize * 0.65;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${fontSize}px FalconMath, Inter, Segoe UI, Arial, sans-serif`;
  ctx.lineWidth = Math.max(1.5, fontSize / 7);
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.strokeText(label, cx, cy);
  ctx.fillStyle = "#fff";
  ctx.fillText(label, cx, cy);

  ctx.restore();
}

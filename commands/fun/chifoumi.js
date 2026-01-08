// ✨ Commande Chifoumi – IA Adaptative + Anti-spam
// 🎨 RÉPONSE IMAGE via @napi-rs/canvas (SANS EMBED)

const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { AttachmentBuilder } = require("discord.js");
const User = require("../../models/experience");
const levelUp = require("../../models/levelUp");

const COOLDOWN = 10_000;
const cooldowns = new Map();
const iaMemory = new Map();

const images = {
  pierre: "https://zupimages.net/up/22/44/u8vr.png",
  feuille: "https://zupimages.net/up/22/44/wkqx.png",
  ciseaux: "https://zupimages.net/up/22/44/u9gk.png"
};

module.exports = {
  name: "chifoumi",
  description: "丨𝐉eux pierre, feuille, ciseaux.",
  longDescription: ` 𝐓u penses pouvoir battre le bot à un jeu aussi simple que pierre, feuille, ciseaux ? 𝐂'est mignon...\n𝐀vec cette commande, tu peux non seulement tester ta chance, mais aussi parier ton précieux XP. 𝐎ui, tu as bien lu, de l'XP ! 💸\n\n𝐂omment ça marche ? 𝐓u choisis entre **pierre**, **feuille** ou **ciseaux**, puis tu mises entre **5** et **1000 XP**. \n𝐌ais attention, le bot est rusé (et un peu tricheur parfois). 𝐈l a 60% de chances de te battre. 𝐃onc si tu perds, ne dis pas que tu n'as pas été prévenu ! 🤷‍♂️\n\n𝐒i tu gagnes, c'est jackpot ! 𝐒i tu perds… eh bien, tu seras allégé d'un peu d'XP. 𝐌ais, au moins, tu auras tenté ta chance comme un(e) vrai(e) guerrier(e). 💪\n\n𝐀h, et si tu es à court d'XP, inutile de tricher avec des mises impossibles, le bot le saura (parce qu'il est omniscient, évidemment). 𝐀lors, prêt(e) à tenter le tout pour le tout ? 🏆`,
  dm: false,
  permission: 'Aucune',
  options: [
    {
      type: 3,
      name: "choix",
      description: "pierre, feuille ou ciseaux ?",
      required: true,
    },
    {
      type: 4,
      name: "mise",
      description: "𝐂ombien d'XP veux-tu parier ?",
      required: true,
    },
  ],

  async execute(interaction) {
    const userId = interaction.user.id;
    const serverId = interaction.guild.id;

    const last = cooldowns.get(userId);
    if (last && Date.now() - last < COOLDOWN) {
      return interaction.reply({ content: "⏳丨Doucement…", ephemeral: true });
    }
    cooldowns.set(userId, Date.now());

    const joueursH = interaction.options.getString("choix").toLowerCase();
    const mise = interaction.options.getInteger("mise");

    if (!images[joueursH]) return interaction.reply({ content: "❌ Choix invalide", ephemeral: true });

    await interaction.deferReply();

    if (!iaMemory.has(userId)) iaMemory.set(userId, { pierre: 0, feuille: 0, ciseaux: 0 });
    iaMemory.get(userId)[joueursH]++;

    const favorite = Object.entries(iaMemory.get(userId)).sort((a,b)=>b[1]-a[1])[0][0];
    const counter = { pierre: "feuille", feuille: "ciseaux", ciseaux: "pierre" };

    const joueursB = Math.random() < 0.7 ? counter[favorite] : Object.keys(images)[Math.floor(Math.random()*3)];

    let user = await User.findOne({ userID: userId, serverID: serverId });
    if (!user) user = new User({ userID: userId, serverID: serverId, xp: 0 });

    if (user.xp < mise) return interaction.editReply("🚫 XP insuffisant");

    let result = "ÉGALITÉ", xpChange = 0;
    if (joueursH !== joueursB) {
      if (counter[joueursB] === joueursH) { result = "GAGNÉ"; xpChange = mise; }
      else { result = "PERDU"; xpChange = -mise; }
    }

    if (xpChange > 0 && Math.random() < 0.05) xpChange *= 3;

    user.xp += xpChange;
    await user.save();
    await levelUp(interaction, user, user.xp);

    // 🎨 CANVAS
    const canvas = createCanvas(900, 300);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Sans";
    ctx.fillText("CHIFOUMI – IA ADAPTATIVE", 30, 50);

    ctx.font = "24px Sans";
    ctx.fillText(`Joueur : ${interaction.user.username}`, 30, 100);
    ctx.fillText(`Résultat : ${result}`, 30, 140);
    ctx.fillText(`XP : ${xpChange >= 0 ? "+" : ""}${xpChange}`, 30, 180);
    ctx.fillText(`XP total : ${user.xp}`, 30, 220);

    const imgBot = await loadImage(images[joueursB]);
    ctx.drawImage(imgBot, 650, 80, 180, 180);

    const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "chifoumi.png" });

    const msg = await interaction.editReply({ files: [attachment] });
    setTimeout(() => msg.delete().catch(() => {}), 30_000);
  }
};

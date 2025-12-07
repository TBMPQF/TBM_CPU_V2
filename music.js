const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const yts = require('yt-search');
const Music = require("./models/music");
const Genius = require('genius-lyrics');
const config = require("./config.json");
const Client = new Genius.Client(config.genius_api);

module.exports = (bot) => {
  const distube = new DisTube(bot, {
    plugins: [new YtDlpPlugin()],
    emitNewSongOnly: true,
  });
  module.exports = distube;

  let EMBED_UPDATE_LOCK = false;

  const autoDjEnabled = new Map();
  const autoDjHistory = new Map();
  const isAutoOn = (gid) => autoDjEnabled.get(gid) === true;
  const setAuto  = (gid, v) => autoDjEnabled.set(gid, !!v);

  const DEFAULT_THUMB = "https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj";

  function getSongThumb(input) {
    let url = null;
    const song = (input && typeof input === 'object') ? input : null;

    if (song) {
      url = song.thumbnail || song.thumbnailUrl || song.thumbnailURL ||
            (Array.isArray(song.thumbnails) && song.thumbnails[0]?.url) || null;
      if (!url && song.url) {
        const id = youtubeIdFromUrl(song.url);
        if (id) url = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }
      if (!url && song.id) {
        url = `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg`;
      }
    } else if (typeof input === 'string') {
      const id = youtubeIdFromUrl(input);
      if (id) url = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }

    return url || DEFAULT_THUMB;
  }
  function youtubeIdFromUrl(url = "") {
    try {
      if (!url) return null;
      const m1 = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
      if (m1) return m1[1];
      const m2 = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
      if (m2) return m2[1];
      return null;
    } catch { return null; }
  }
  function canonicalSongId(songOrUrl) {
    if (!songOrUrl) return null;
    if (typeof songOrUrl === 'string') return youtubeIdFromUrl(songOrUrl) || songOrUrl.trim();
    return youtubeIdFromUrl(songOrUrl.url) || songOrUrl.id || songOrUrl.streamURL || null;
  }
  function rememberPlay(gid, songOrUrl) {
    const id = canonicalSongId(songOrUrl);
    if (!id) return;
    if (!autoDjHistory.has(gid)) autoDjHistory.set(gid, new Set());
    autoDjHistory.get(gid).add(String(id));
  }
  const parseTsToSeconds = (ts) => {
    if (typeof ts === 'number') return ts;
    if (!ts || typeof ts !== 'string') return 0;
    const parts = ts.split(':').map(n => parseInt(n, 10) || 0);
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if (parts.length === 2) return parts[0]*60 + parts[1];
    return 0;
  };
  const looksLikeOfficialMusic = (title = "") => {
    const t = String(title).toLowerCase();
    const bad = /(live|cover|lyrics?|instrumental|remix|nightcore|sped ?up|slowed|8d|mix|compilation)/i;
    const good = /(official|audio|topic)/i;
    return !bad.test(t) || good.test(t);
  };
  function normalizeTitle(t = "") {
    return String(t)
      .toLowerCase()
      .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ")
      .replace(/\b(official|video|4k|hd|lyrics?|ft\.?|feat\.?|remaster(?:ed)?|audio|topic)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const TITLE_STOP = new Set([
    'official','lyrics','audio','topic','remix','mix','edit','version','live','cover',
    'video','hd','4k','feat','ft','pt','part','instrumental',
    'everyday','normal','guy','crew'
  ]);
  function tokensFromTitle(t = "") {
    const base = normalizeTitle(t)
      .replace(/[^a-z0-9\s]/gi, " ")
      .replace(/\b(?:pt|part)\s*\d+\b/gi, " ")
      .replace(/\b(ii+|iv|v|vi+|x+)\b/gi, " ")
      .replace(/\b\d+\b/g, " ")
      .trim();
    const toks = base.split(/\s+/).filter(Boolean);
    return toks.filter(tok => tok.length > 1 && !TITLE_STOP.has(tok));
  }
  function seriesKey(t = "") {
    return tokensFromTitle(t).join(' ');
  }
  function jaccardSim(aTokens, bTokens) {
    const A = new Set(aTokens), B = new Set(bTokens);
    let inter = 0; for (const x of A) if (B.has(x)) inter++;
    const union = A.size + B.size - inter;
    return union ? inter / union : 0;
  }
  function tooSimilarTitle(a = "", b = "") {
    const ta = tokensFromTitle(a), tb = tokensFromTitle(b);
    if (!ta.length || !tb.length) return false;
    return jaccardSim(ta, tb) >= 0.5; // seuil strict
  }
  async function pickRelatedTrack(guildId, currentSong) {
    try {
      if (!currentSong) return null;

      const { cleanedTitle, artistFromTitle, titleFromTitle, uploader } = parseArtistAndTitle(currentSong);
      const queries = [];
      if (artistFromTitle && titleFromTitle) queries.push(`${artistFromTitle} ${titleFromTitle}`);
      queries.push(cleanedTitle);
      if (uploader) queries.push(`${cleanedTitle} ${uploader}`);

      const seen = autoDjHistory.get(guildId) || new Set();
      const currentId = canonicalSongId(currentSong);
      const currentTitle = currentSong?.name || currentSong?.title || "";
      const currentSeries = seriesKey(currentTitle);
      const queue = distube.getQueue(guildId);
      const recent = (queue?.previousSongs || []).slice(-4).map(s => s?.name || s?.title || "");

      for (const q of [...new Set(queries)].filter(Boolean)) {
        const { videos } = await yts.search(q);
        if (!Array.isArray(videos)) continue;

        const candidate = videos
          .filter(v => v.type === 'video')
          .filter(v => {
            const sec = v.duration?.seconds ?? parseTsToSeconds(v.duration?.timestamp);
            return sec >= 90 && sec <= 600;
          })
          .filter(v => looksLikeOfficialMusic(v.title))
          .find(v => {
            const vid = v.videoId || youtubeIdFromUrl(v.url);
            if (vid && (vid === currentId || seen.has(String(vid)))) return false;

            const candTitle = v.title || "";
            if (seriesKey(candTitle) === currentSeries) return false;      // même série
            if (tooSimilarTitle(candTitle, currentTitle)) return false;    // trop similaire courant
            for (const t of recent) {
              if (seriesKey(candTitle) === seriesKey(t)) return false;     // même série que récents
              if (tooSimilarTitle(candTitle, t)) return false;             // trop similaire récents
            }
            return true;
          });

        if (candidate) return { url: candidate.url, title: candidate.title };
      }
    } catch (_) {}
    return null;
  }
  function getRequesterId(song) {
    return (
      song?.user?.id ||
      song?.member?.id ||
      song?.metadata?.requestedBy?.id ||
      song?.metadata?.requestedBy ||
      null
    );
  }
  async function purgeLeaverSongs(guildId, userId) {
    const queue = distube.getQueue(guildId);
    if (!queue || !Array.isArray(queue.songs) || queue.songs.length === 0) return;

    const before = queue.songs.length;
    const kept = queue.songs.filter((s, idx) => idx === 0 || getRequesterId(s) !== userId);
    if (kept.length === before) return;

    queue.songs = kept;
    await updateMusicEmbed(queue.textChannel, guildId).catch(() => {});
  }
  const formatDuration = (duration) => {
    const parts = duration.split(':');
    if (parts.length === 2) return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
    if (parts.length === 3) return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0') + ':' + parts[2].padStart(2, '0');
    return duration;
  };
  const pauseIcon = "⏸️";
  async function ackSilently(interaction) {
    if (!interaction.deferred && !interaction.replied) {
      try { await interaction.deferUpdate(); } catch {}
    }
  }
  async function ephemeralError(interaction, content) {
    try { await interaction.followUp({ content, ephemeral: true }); } catch {}
  }
  function normalizeTitleForLyrics(t) {
    return String(t || '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\b(official|video|4k|hd|lyrics?|ft\.?|feat\.?|remaster(?:ed)?)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  function parseArtistAndTitle(song) {
    const raw = song?.name || "";
    const cleaned = normalizeTitleForLyrics(raw);
    const dashSplit = cleaned.split(/\s[-–—]\s/);
    let artistFromTitle = null, titleFromTitle = null;

    if (dashSplit.length >= 2) {
      artistFromTitle = dashSplit[0].trim();
      titleFromTitle  = dashSplit.slice(1).join(' - ').trim();
    }

    const uploader = song?.uploader?.name || song?.uploader || song?.author || null;

    return {
      cleanedTitle: cleaned,
      artistFromTitle,
      titleFromTitle,
      uploader
    };
  }
  function buildLyricsQueries(song) {
    const { cleanedTitle, artistFromTitle, titleFromTitle, uploader } = parseArtistAndTitle(song);
    const base = [cleanedTitle];

    const candidates = new Set(base);
    if (artistFromTitle && titleFromTitle) {
      candidates.add(`${artistFromTitle} ${titleFromTitle}`);
      candidates.add(`${titleFromTitle} ${artistFromTitle}`);
    }
    if (uploader) {
      candidates.add(`${cleanedTitle} ${uploader}`);
      if (artistFromTitle) candidates.add(`${artistFromTitle} ${cleanedTitle}`);
      if (titleFromTitle) candidates.add(`${titleFromTitle} ${uploader}`);
    }
    return Array.from(candidates).filter(Boolean);
  }
  async function fetchLyricsWithFallbacks(queries) {
    for (const q of queries) {
      try {
        const results = await Client.songs.search(q);
        if (!results || results.length === 0) continue;
        for (const res of results) {
          let text = await res.lyrics();
          if (text && text.length > 0) return { text, title: res.fullTitle };
        }
      } catch (_) {}
    }
    return null;
  }
  const lyricsState = new Map();
  function songKeyOf(song) {
    return canonicalSongId(song) || normalizeTitle(song?.name || song?.title || "");
  }
  async function precheckLyricsForCurrent(guildId, song, textChannel) {
    try {
      const key = songKeyOf(song);
      const cached = lyricsState.get(guildId);
      if (cached && cached.songKey === key) return;

      const queries = buildLyricsQueries(song);
      const best = await fetchLyricsWithFallbacks(queries);
      lyricsState.set(guildId, {
        songKey: key,
        available: !!best,
        title: best?.title || null,
        text: best?.text || null
      });

      if (textChannel) await updateMusicEmbed(textChannel, guildId).catch(() => {});
    } catch (e) {
      const key = songKeyOf(song);
      lyricsState.set(guildId, { songKey: key, available: false, title: null, text: null });
    }
  }
  function resetAutoDj(gid) {
    try {
      setAuto(gid, false);
      autoDjHistory.delete(gid);
    } catch (_) {}
  }

  distube
    .on('playSong', async (queue, song) => {
      song.name = song.name
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\b(official|video|4k|hd|lyrics|ft\.|feat\.|remastered|audio)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      try { rememberPlay(queue.textChannel.guild.id, song); } catch {}

      if (!EMBED_UPDATE_LOCK) {
        await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
      }

      // Pré-check lyrics pour (dé)griser le bouton
      precheckLyricsForCurrent(queue.textChannel.guild.id, song, queue.textChannel).catch(() => {});
    })
    .on('addSong', async (queue, song) => {
      song.name = song.name
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\b(official|video|4k|hd|lyrics|ft\.|feat\.|remastered|audio)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!EMBED_UPDATE_LOCK) {
        await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
      }
    })
    .on('finish', async (queue) => {
      const guildId = queue.textChannel.guild.id;

      if (isAutoOn(guildId)) {
        try {
          const last = (queue.previousSongs && queue.previousSongs[queue.previousSongs.length - 1]) || queue.songs?.[0] || null;
          const next = await pickRelatedTrack(guildId, last);
          const guild = await bot.guilds.fetch(guildId).catch(() => null);
          const vc = guild?.members?.me?.voice?.channel;

          if (next && vc) {
            await distube.play(vc, next.url, { member: guild.members.me, textChannel: queue.textChannel });
            await updateMusicEmbed(queue.textChannel, guildId);
            return;
          }
        } catch (e) {
          console.error("[MUSIC] AutoDJ error:", e?.message);
        }
      }

      await updateMusicEmbed(queue.textChannel, guildId);
      disconnectIfEmpty(queue);
    })
    .on('empty', async (queue) => {
      await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
      disconnectIfEmpty(queue);
    })
    .on('disconnect', () => {
    })
    .on('error', (channel, error) => {
      console.error(`[MUSIC] Error in ${channel?.name || 'unknown'}: ${error}`);
    });

  bot.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const serverId = interaction.guild.id;

    try {
      switch (interaction.customId) {
        case 'PLAY_PAUSE_TOGGLE':
        case 'PLAY_MUSIC':
        case 'PAUSE_MUSIC':
          await handlePlayPauseToggle(interaction, serverId);
          break;
        case 'STOP_MUSIC':
          await handleStopMusic(interaction, serverId);
          break;
        case 'NEXT_MUSIC':
          await handleNextMusic(interaction, serverId);
          break;
        case 'LYRICS_MUSIC':
          await handleLyricsMusic(interaction, serverId);
          break;
        case 'AUTODJ_TOGGLE':
          await handleAutoDjToggle(interaction, serverId);
          break;
      }
    } catch (error) {
      console.error("[MUSIC] Error handling interaction:", error);
    }
  });

  async function handlePlayPauseToggle(interaction, serverId) {
    await ackSilently(interaction);
    const voiceChannel    = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;
    const queue           = distube.getQueue(serverId);

    if (!voiceChannel) return;

    if (!queue || !queue.songs?.length) {
      const stored = songQueues.get(serverId);
      if (!stored || stored.length === 0) return;

      try {
        EMBED_UPDATE_LOCK = true;
        await playStoredSongs(serverId, voiceChannel, interaction.member, interaction.channel);
      } catch (e) {
        console.error("[MUSIC] Erreur lecture musiques stockées :", e);
      } finally {
        EMBED_UPDATE_LOCK = false;
        await updateMusicEmbed(interaction.channel, serverId).catch(()=>{});
      }
      return;
    }

    try {
      if (queue.playing && !queue.paused) {
        distube.pause(queue);
        queue.paused = true;
      } else {
        distube.resume(queue);
      }
      await updateMusicEmbed(interaction.channel, serverId);
    } catch (error) {
      console.error("[MUSIC] Erreur toggle play/pause :", error);
    }
  }
  async function handleStopMusic(interaction, serverId) {
    await ackSilently(interaction);

    const voiceChannel    = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;
    const queue           = distube.getQueue(serverId);

    if (!voiceChannel) {
      return ephemeralError(interaction, ":microphone2:丨𝐓u dois être dans un salon vocal pour **arrêter la musique** !");
    }
    if (!botVoiceChannel) {
      return;
    }
    if (botVoiceChannel.id !== voiceChannel.id) {
      return ephemeralError(interaction, ":lock:丨𝐋e bot joue **dans un autre salon vocal**. 𝐕iens dans le même pour **arrêter**.");
    }

    try {
      if (queue) {
        distube.stop(interaction.guild);
        resetAutoDj(serverId);
        await updateMusicEmbedInitial(interaction.channel, serverId).catch(() => {});
        disconnectIfEmpty(queue);
      }
    } catch (error) {
      console.error("[MUSIC] Error stopping music:", error);
      return ephemeralError(interaction, "[MUSIC] :x: 𝐄rreur lors de l'arrêt de la musique.");
    }
  }
  async function handleNextMusic(interaction, serverId) {
    await ackSilently(interaction);

    const voiceChannel    = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;
    const queue           = distube.getQueue(serverId);

    if (!voiceChannel) return ephemeralError(interaction, ":microphone2:丨𝐓u dois être dans un salon vocal pour **passer la musique** !");
    if (!queue)        return ephemeralError(interaction, ":no_entry_sign:丨𝐈l n'y a **aucune musique**.");
    if (!botVoiceChannel || botVoiceChannel.id !== voiceChannel.id) {
      return ephemeralError(interaction, ":lock:丨𝐋e bot joue **dans un autre salon vocal**.");
    }

    try {
      if (queue.songs.length > 1) {
        await updateMusicEmbed(interaction.channel, serverId, { previewIndex: 1 });
        await distube.skip(interaction.guild);
        await updateMusicEmbed(interaction.channel, serverId);
        return;
      }

      if (isAutoOn(serverId)) {
        const base = queue.songs[0] || (queue.previousSongs && queue.previousSongs[queue.previousSongs.length - 1]) || null;
        const next = await pickRelatedTrack(serverId, base);
        if (next) {
          const previewThumb = getSongThumb(next.url);
          await updateMusicEmbed(interaction.channel, serverId, { previewTitle: next.title, previewThumb });
          await distube.play(voiceChannel, next.url, { member: interaction.member, textChannel: interaction.channel });
          await distube.skip(interaction.guild);
          await updateMusicEmbed(interaction.channel, serverId);
          return;
        }
      }

      return ephemeralError(interaction, ":no_entry_sign:丨𝐈l n'y a **pas de musique suivante**.");
    } catch (error) {
      console.error("[MUSIC] Error skipping song:", error);
      return ephemeralError(interaction, "[MUSIC] :x: 𝐄rreur lors du passage à la musique suivante.");
    }
  }
  async function handleLyricsMusic(interaction, serverId) {
    if (!interaction.deferred && !interaction.replied) {
      try { await interaction.deferReply({ ephemeral: true }); } catch {}
    }

    const queue = distube.getQueue(serverId);
    if (!queue || queue.songs.length === 0) {
      try { await interaction.editReply({ content: ":no_entry_sign:丨𝐀ucune musique n'est en cours de lecture." }); } catch {}
      return;
    }

    const currentSong = queue.songs[0];
    const key = songKeyOf(currentSong);
    const cached = lyricsState.get(serverId);

    let lyricsText = null, lyricsTitle = null;

    if (cached && cached.songKey === key && cached.available && cached.text) {
      lyricsText = cached.text;
      lyricsTitle = cached.title || currentSong.name;
    } else {
      const queries = buildLyricsQueries(currentSong);
      const best = await fetchLyricsWithFallbacks(queries);
      if (!best) {
        try { await interaction.editReply({ content: ":x:丨𝐈mpossible de trouver les paroles de cette chanson." }); } catch {}
        return;
      }
      lyricsText = best.text;
      lyricsTitle = best.title;
      lyricsState.set(serverId, { songKey: key, available: true, title: best.title, text: best.text });
    }

    let lyrics = lyricsText || "";
    const cutAtFirstSection = lyrics.replace(/^[\s\S]*?(?=\[(?:verse|chorus|intro|outro|bridge|hook)[^\]]*\])/i, '');
    if (cutAtFirstSection !== lyrics) lyrics = cutAtFirstSection;
    lyrics = lyrics
      .replace(/^\s*\d+\s+contributors.*$/gmi, '')
      .replace(/^\s*translations.*$/gmi, '')
      .replace(/^\s*you might also like.*$/gmi, '')
      .replace(/^\s*\d*\s*embed\s*$/gmi, '')
      .replace(/\r/g, '')
      .replace(/^\s*\[[^\]]*]\s*/gm, "");

    const MAX_PAGE_LEN = 3800;
    const paragraphs = lyrics.split(/\n\s*\n/);
    const pages = [];
    let buf = "";

    for (const p of paragraphs) {
      if ((buf + (buf ? "\n\n" : "") + p).length > MAX_PAGE_LEN) {
        if (buf) pages.push(buf);
        if (p.length > MAX_PAGE_LEN) {
          let chunk = "";
          for (const line of p.split("\n")) {
            if ((chunk + "\n" + line).length > MAX_PAGE_LEN) {
              pages.push(chunk);
              chunk = line;
            } else {
              chunk += (chunk ? "\n" : "") + line;
            }
          }
          if (chunk) pages.push(chunk);
          buf = "";
        } else {
          buf = p;
        }
      } else {
        buf = buf ? (buf + "\n\n" + p) : p;
      }
    }
    if (buf) pages.push(buf);
    if (pages.length === 0) pages.push("…");

    let pageIndex = 0;
    const makeEmbed = (idx) =>
      new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`🎤 Paroles — ${lyricsTitle}`)
        .setDescription(pages[idx])
        .setFooter({ text: `Page ${idx + 1} / ${pages.length} • 𝐂ordialement, l'équipe ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() });

    const makeRow = (idx) => {
      const prev = new ButtonBuilder()
        .setCustomId('LYRICS_PREV')
        .setLabel('◀️ Précédent')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(idx === 0);
      const next = new ButtonBuilder()
        .setCustomId('LYRICS_NEXT')
        .setLabel('Suivant ▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(idx >= pages.length - 1);
      return new ActionRowBuilder().addComponents(prev, next);
    };

    try {
      await interaction.editReply({ embeds: [makeEmbed(pageIndex)], components: [makeRow(pageIndex)] });
    } catch {}

    const msg = await interaction.fetchReply().catch(() => null);
    if (!msg) return;

    const collector = msg.createMessageComponentCollector({
      time: 120000,
      filter: (i) => i.user.id === interaction.user.id
    });

    collector.on('collect', async (i) => {
      try {
        if (i.customId === 'LYRICS_PREV') {
          pageIndex = Math.max(0, pageIndex - 1);
          await i.update({ embeds: [makeEmbed(pageIndex)], components: [makeRow(pageIndex)] });
        } else if (i.customId === 'LYRICS_NEXT') {
          pageIndex = Math.min(pages.length - 1, pageIndex + 1);
          await i.update({ embeds: [makeEmbed(pageIndex)], components: [makeRow(pageIndex)] });
        }
      } catch {}
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({
          components: [new ActionRowBuilder().addComponents(
            ButtonBuilder.from(makeRow(pageIndex).components[0]).setDisabled(true),
            ButtonBuilder.from(makeRow(pageIndex).components[1]).setDisabled(true)
          )]
        }).catch(()=>{});
      } catch {}
    });
  }
  async function handleAutoDjToggle(interaction, serverId) {
    await ackSilently(interaction);

    const userVC = interaction.member.voice.channel;
    const botVC  = interaction.guild.members.me.voice.channel;
    if (botVC && userVC && botVC.id !== userVC.id) {
      return ephemeralError(interaction, ":lock:丨𝐕iens dans le même salon vocal que le bot pour changer le **mode Auto**.");
    }

    const newVal = !isAutoOn(serverId);
    setAuto(serverId, newVal);
    await updateMusicEmbed(interaction.channel, serverId);
  }

  bot.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.id !== '1136327173343559810') return;

    const { videos } = await yts.search(message.content);
    if (videos.length === 0) {
      await message.channel.send({
        embeds: [new EmbedBuilder().setColor("Purple").setDescription("丨𝐀ucun résultat trouvé.")]
      }).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
      await message.delete().catch(()=>{});
      return;
    }

    const song = {
      url: videos[0].url,
      title: videos[0].title
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\b(official|video|4k|hd|lyrics|ft\.|feat\.|remastered|audio)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim(),
      duration: `\`${formatDuration(videos[0].duration.timestamp)}\``,
      addedBy: message.author.id
    };

    const voiceChannel    = message.member.voice.channel;
    const queue           = distube.getQueue(message.guild.id);
    const botVoiceChannel = message.guild.members.me.voice.channel;

    try {
      if (queue) {
        if (!botVoiceChannel || !voiceChannel || botVoiceChannel.id !== voiceChannel.id) {
          await message.react('🔒').catch(()=>{});
          setTimeout(() => message.delete().catch(()=>{}), 5000);
          return;
        }

        await distube.play(voiceChannel, song.url, {
          member: message.member,
          textChannel: message.channel,
        });

      } else {
        await storeSongForLaterPlayback(song, message.guild.id, message.channel);
      }

      await updateMusicEmbed(message.channel, message.guild.id);
    } catch (error) {
      console.error(`[MUSIC] Error queuing/storing song: ${error.message}`);
      await message.channel.send({
        embeds: [new EmbedBuilder()
          .setColor("Red")
          .setDescription(":x:丨𝐔n problème est survenu lors de l'ajout de la musique. 𝐎n regarde ça !")]
      }).then(msg => setTimeout(() => msg.delete().catch(()=>{}), 5000)).catch(()=>{});
    }

    await message.delete().catch(()=>{});
  });

  const songQueues = new Map();

  async function storeSongForLaterPlayback(song, guildId, textChannel) {
    if (!songQueues.has(guildId)) songQueues.set(guildId, []);
    songQueues.get(guildId).push(song);
    await updateMusicEmbed(textChannel, guildId);
  }

  const MAX_PLAYLIST_SIZE = 50;
  const MAX_CHAR_LIMIT    = 5000;

  async function updateMusicEmbed(channel, guildId, opts = {}) {
    try {
      let guild = channel.guild || await bot.guilds.fetch(guildId);
      if (!guild) throw new Error(`[MUSIC] Impossible de récupérer la guilde : ${guildId}`);

      const queue = distube.getQueue(guildId);
      let playlistText = "";
      let characterCount = 0;
      let songCount = 0;

      const previewIndex = Number.isInteger(opts.previewIndex) ? opts.previewIndex : null;
      const previewTitle = typeof opts.previewTitle === 'string' ? opts.previewTitle : null;

      const hasQueue = !!(queue && Array.isArray(queue.songs) && queue.songs.length > 0);
      const hasTemp  = songQueues.has(guildId) && songQueues.get(guildId).length > 0;

      if (hasQueue) {
        if (previewIndex !== null && queue.songs[previewIndex]) {
          for (let i = previewIndex; i < queue.songs.length; i++) {
            const s = queue.songs[i];
            const line = `${(i - previewIndex) + 1}丨${s.name} - \`${s.formattedDuration}\``;
            if (characterCount + line.length > MAX_CHAR_LIMIT || songCount >= MAX_PLAYLIST_SIZE) break;
            playlistText += (songCount === 0 ? `**${line}**\n` : `${line}\n`);
            characterCount += line.length;
            songCount++;
          }
        }
        else if (previewTitle) {
          const head = `1丨${previewTitle} - \`…\``;
          playlistText += `**${head}**\n`;
          characterCount += head.length;
          songCount++;
        }
        else {
          for (const [index, song] of queue.songs.entries()) {
            const isPaused = queue.paused && index === 0;
            const songText = `${index + 1}丨${song.name} - \`${isPaused ? pauseIcon : song.formattedDuration}\``;
            if (characterCount + songText.length > MAX_CHAR_LIMIT || songCount >= MAX_PLAYLIST_SIZE) break;
            playlistText += (index === 0 ? `**${songText}**\n` : `${songText}\n`);
            characterCount += songText.length;
            songCount++;
          }
        }
      } else if (hasTemp) {
        const tempQueue = songQueues.get(guildId);
        for (const [index, song] of tempQueue.entries()) {
          const songText = `${index + 1}丨${song.title} - ${song.duration}`;
          if (characterCount + songText.length > MAX_CHAR_LIMIT || songCount >= MAX_PLAYLIST_SIZE) break;

          playlistText += (index === 0 ? `**${songText}**\n` : `${songText}\n`);
          characterCount += songText.length;
          songCount++;
        }
      } else {
        playlistText = "**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.\n𝐔ne fois la playlist crée, n'oublie pas d'être dans le même salon que le BOT pour intéragir avec les différents boutons. (:";
      }

      const guildName = guild.name;
      const guildIcon = guild.iconURL() ?? null;

      let thumb = DEFAULT_THUMB;
      if (hasQueue) {
        if (previewIndex !== null && queue.songs[previewIndex]) {
          thumb = getSongThumb(queue.songs[previewIndex]);
        } else if (previewTitle && opts.previewThumb) {
          thumb = opts.previewThumb;
        } else {
          thumb = getSongThumb(queue.songs[0]);
        }
      }

      const newEmbed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle("――――――――∈ `MUSIQUES` ∋――――――――")
        .setThumbnail(thumb)
        .setDescription(playlistText + (hasQueue ? `\n\n> 🔁 𝐌ode 𝐀utoDJ : **${isAutoOn(guildId) ? "Activé" : "Désactivé"}**` : ""))
        .setFooter({ text: `𝐂ordialement, l'équipe ${guildName}`, iconURL: guildIcon });

      let components = [];

      if (hasQueue) {
        const isPlaying = !!(queue.playing && !queue.paused);
        const current   = queue.songs[0];
        const key       = songKeyOf(current);
        const lstate    = lyricsState.get(guildId);
        const lyricsOk  = !!(lstate && lstate.songKey === key && lstate.available === true);

        const rowMain = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('PLAY_PAUSE_TOGGLE')
            .setLabel(isPlaying ? '⏸️' : '▶️')
            .setStyle(isPlaying ? ButtonStyle.Secondary : ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('NEXT_MUSIC')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(false),
          new ButtonBuilder()
            .setCustomId('STOP_MUSIC')
            .setLabel('⏹️')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('AUTODJ_TOGGLE')
            .setLabel('🔁')
            .setStyle(isAutoOn(guildId) ? ButtonStyle.Success : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('LYRICS_MUSIC')
            .setLabel('📜')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!lyricsOk)
        );

        components = [rowMain];
      } else {
        const rowPlayOnly = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('PLAY_PAUSE_TOGGLE').setLabel('▶️').setStyle(ButtonStyle.Success)
        );
        components = [rowPlayOnly];
      }

      const musicEntry = await Music.findOne({ guildId });
      if (musicEntry) {
        const message = await channel.messages.fetch(musicEntry.messageId).catch(()=>null);
        if (message) await message.edit({ embeds: [newEmbed], components }).catch(()=>{});
      } else {
        const msg = await channel.send({ embeds: [newEmbed], components }).catch(()=>null);
        if (msg) {
          await Music.create({ guildId, channelId: channel.id, messageId: msg.id });
        }
      }
    } catch (error) {
      console.error("[MUSIC] Erreur lors de la mise à jour de l'embed :", error.message);
    }
  }
  async function disconnectIfEmpty(queue) {
    try {
      const serverId = queue.textChannel.guild.id;
      const guild = await bot.guilds.fetch(serverId);
      if (!guild) throw new Error(`[MUSIC] Impossible de récupérer la guilde : ${serverId}`);

      const botMember = guild.members.me;
      const voiceChannel = botMember?.voice?.channel;

      if (voiceChannel) {
        await botMember.voice.disconnect().catch(()=>{});
        await updateMusicEmbedInitial(queue.textChannel, serverId);
      }
    } catch (error) {
      console.error("[MUSIC] Erreur dans disconnectIfEmpty :", error.message);
    }
  }
  async function updateMusicEmbedInitial(channel, serverId) {
    try {
      let guild = channel.guild || await bot.guilds.fetch(serverId);
      if (!guild) throw new Error(`[MUSIC] Impossible de récupérer la guilde : ${serverId}`);

      const guildName = guild.name;
      const guildIcon = guild.iconURL() ?? null;

      const initialEmbed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle("――――――――∈ `MUSIQUES` ∋――――――――")
        .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
        .setDescription("**𝐋a playlist est vide pour le moment**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.\n𝐔ne fois la playlist crée, n'oublie pas d'être dans le même salon que le BOT pour intéragir avec les différents boutons. (:")
        .setFooter({
          text: `𝐂ordialement, l'équipe ${guildName}`,
          iconURL: guildIcon,
        });

      const rowPlayOnly = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('PLAY_PAUSE_TOGGLE').setLabel('▶️').setStyle(ButtonStyle.Success)
      );

      const musicEntry = await Music.findOne({ guildId: serverId });
      if (musicEntry) {
        const ch = await guild.channels.fetch(musicEntry.channelId).catch(()=>null);
        if (!ch) return;
        const msg = await ch.messages.fetch(musicEntry.messageId).catch(()=>null);
        if (msg) await msg.edit({ embeds: [initialEmbed], components: [rowPlayOnly] }).catch(()=>{});
      } else {
        const msg = await channel.send({ embeds: [initialEmbed], components: [rowPlayOnly] }).catch(()=>null);
        if (msg) {
          await Music.create({
            guildId: serverId,
            channelId: channel.id,
            messageId: msg.id,
          });
        }
      }
    } catch (error) {
      console.error("[MUSIC] Erreur lors de la remise à zéro de l'embed :", error.message);
    }
  }
  async function playStoredSongs(guildId, voiceChannel, member, textChannel) {
    const queue = songQueues.get(guildId);
    if (queue && queue.length > 0) {
      for (const song of queue) {
        try {
          await distube.play(voiceChannel, song.url, {
            member,
            textChannel,
          });
        } catch (error) {
          console.error(`[MUSIC] Error playing stored song (${song.title}):`, error);
        }
      }
      songQueues.delete(guildId);
    }
  }

  bot.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      if (!newState.channelId && oldState.channelId) {
        const userId = oldState.member.id;
        const guildId = oldState.guild.id;
        await purgeLeaverSongs(guildId, userId);
      }
    } catch(e) {
      console.error("[MUSIC] voiceStateUpdate purge error:", e?.message);
    }
  });
};

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

    const formatDuration = (duration) => {
        const parts = duration.split(':');
        if (parts.length === 2) {
            return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
        } else if (parts.length === 3) {
            return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0') + ':' + parts[2].padStart(2, '0');
        }
        return duration;
    };
    const pauseIcon = "⏸️";

    distube
        .on('playSong', async (queue, song) => {
            song.name = song.name
                .replace(/\([^)]*\)/g, '')  
                .replace(/\[[^\]]*\]/g, '') 
                .replace(/\{[^}]*\}/g, '')  
                .replace(/\b(official|video|4k|hd|lyrics|ft\.|feat\.|remastered|audio)\b/gi, '') 
                .replace(/\s{2,}/g, ' ')  
                .trim();

            await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
        })
        .on('addSong', async (queue, song) => {
            song.name = song.name
                .replace(/\([^)]*\)/g, '')  
                .replace(/\[[^\]]*\]/g, '') 
                .replace(/\{[^}]*\}/g, '')  
                .replace(/\b(official|video|4k|hd|lyrics|ft\.|feat\.|remastered|audio)\b/gi, '') 
                .replace(/\s{2,}/g, ' ')  
                .trim();

            await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
        })
        .on('finish', async (queue) => {
            await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
            disconnectIfEmpty(queue);
        })
        .on('empty', async (queue) => {
            await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
            disconnectIfEmpty(queue);
        })
        .on('disconnect', () => console.log('Disconnected from the voice channel.'))
        .on('error', (channel, error) => {
            console.error(`[MUSIC] Error in ${channel.name}: ${error}`);
        });

    bot.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;
        const serverId = interaction.guild.id;

        try {
            switch (interaction.customId) {
                case 'PLAY_MUSIC':
                    await handlePlayMusic(interaction, serverId);
                    break;
                case 'STOP_MUSIC':
                    await handleStopMusic(interaction, serverId);
                    break;
                case 'NEXT_MUSIC':
                    await handleNextMusic(interaction, serverId);
                    break;
                case 'PAUSE_MUSIC':
                    await handlePauseMusic(interaction, serverId);
                    break;
                case 'LYRICS_MUSIC':
                    await handleLyricsMusic(interaction, serverId);
                    break;
            }
        } catch (error) {
            console.error("[MUSIC] Error handling interaction:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: "[MUSIC] :x: An error occurred while processing your request.", ephemeral: true });
            }
        }
    });

    async function handlePlayMusic(interaction, serverId) {
        const voiceChannel = interaction.member.voice.channel;
        const botVoiceChannel = interaction.guild.members.me.voice.channel;
    
        if (!voiceChannel) {
            await interaction.reply({ content: ":microphone2:丨𝐓u dois être dans un salon vocal pour jouer de la musique !", ephemeral: true });
            return;
        }
    
        const queue = distube.getQueue(serverId);
        if (!queue || queue.songs.length === 0) {
            if (!botVoiceChannel) {
                try {
                    await playStoredSongs(serverId, voiceChannel, interaction.member, interaction.channel);
                } catch (error) {
                    console.error("[MUSIC] Erreur lors de la lecture des musiques stockées :", error);
                    if (!interaction.replied) {
                        await interaction.followUp({ content: "[MUSIC] :x: Une erreur est survenue lors de la lecture des musiques stockées.", ephemeral: true });
                    }
                }
            } else {
                await interaction.reply({ content: ":x: Le bot est déjà dans un autre salon vocal.", ephemeral: true });
            }
        } else {
            try {
                distube.resume(queue);
                await updateMusicEmbed(interaction.channel, serverId);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.deferUpdate();
                }
            } catch (error) {
                console.error("[MUSIC] Erreur lors de la reprise de la musique :", error);
                if (!interaction.replied) {
                    await interaction.followUp({ content: "[MUSIC] :x: Une erreur est survenue lors de la reprise de la musique.", ephemeral: true });
                }
            }
        }
    }
    async function handleStopMusic(interaction, serverId) {
        const queue = distube.getQueue(serverId);
    
        if (!queue || queue.songs.length === 0) {
            await interaction.reply({ content: ":no_entry_sign:丨𝐋a playlist est maintenant vide et la musique est arrêtée. 𝐉e quitte le salon vocal !", ephemeral: true });
        } else {
            await interaction.deferReply({ ephemeral: true });
            try {
                distube.stop(interaction.guild);
                await interaction.editReply({ content: ":no_entry_sign:丨𝐋a musique a été arrêtée et la playlist vidée. 𝐉e quitte le salon vocal !", ephemeral: true });
                disconnectIfEmpty(queue);
            } catch (error) {
                console.error("[MUSIC] Error stopping music:", error);
                await interaction.editReply({ content: "[MUSIC] :x: Une erreur est survenue lors de l'arrêt de la musique.", ephemeral: true });
            }
        }
    }
    async function handleNextMusic(interaction, serverId) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const queue = distube.getQueue(serverId);
            if (!queue || queue.songs.length <= 1) {
                await interaction.editReply({ content: ":no_entry_sign:丨𝐈l n'y a pas de musique suivante dans la playlist.", ephemeral: true });
                return;
            }
    
            await distube.skip(interaction.guild);
            await updateMusicEmbed(interaction.channel, serverId);
            await interaction.deleteReply();
        } catch (error) {
            console.error("[MUSIC] Error skipping song:", error);
            await interaction.editReply({ content: "[MUSIC] :x: Une erreur est survenue lors du passage à la musique suivante.", ephemeral: true });
        }
    }
    async function handlePauseMusic(interaction, serverId) {
        const voiceChannel = interaction.member.voice.channel;
        const botVoiceChannel = interaction.guild.members.me.voice.channel;
    
        if (!voiceChannel) {
            await interaction.reply({ content: ":microphone2:丨𝐓u dois être dans un salon vocal pour mettre la musique en pause ! 𝐂oquin.", ephemeral: true });
            return;
        }
    
        if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
            await interaction.reply({ content: ":no_entry:丨𝐓u dois être dans le même salon vocal que le bot pour mettre la musique en pause !", ephemeral: true });
            return;
        }
    
        const queue = distube.getQueue(serverId);
        if (!queue || !queue.playing) {
            await interaction.reply({ content: ":no_entry_sign:丨𝐈l n'y a aucune musique en cours de lecture à mettre en pause.", ephemeral: true });
        } else if (queue.paused) {
            await interaction.reply({ content: ":pause_button:丨𝐋a musique est déjà en pause.", ephemeral: true });
        } else {
            try {
                distube.pause(queue);
                queue.paused = true;
                await updateMusicEmbed(interaction.channel, serverId);
                await interaction.deferUpdate();
            } catch (error) {
                console.error("[MUSIC] Erreur lors de la mise en pause de la musique :", error);
                await interaction.reply({ content: "[MUSIC] :x: Une erreur est survenue lors de la mise en pause de la musique.", ephemeral: true });
            }
        }
    }
    async function handleLyricsMusic(interaction, serverId) {
        const queue = distube.getQueue(serverId);
    
        if (!queue || queue.songs.length === 0) {
            await interaction.reply({ content: ":no_entry_sign:丨𝐀ucune musique n'est en cours de lecture.", ephemeral: true });
            return;
        }
    
        const currentSong = queue.songs[0];
        const songName = currentSong.name;
    
        try {
            await interaction.deferReply({ ephemeral: true });
    
            const searches = await Client.songs.search(songName);
            const firstSong = searches[0];
            let lyrics = await firstSong.lyrics();
    
            if (!lyrics) {
                await interaction.editReply({ content: ":x:丨𝐈mpossible de trouver les paroles de cette chanson." });
                return;
            }
    
            // Supprimer le texte entre crochets [ ] au début des paroles
            lyrics = lyrics.replace(/^\[.*?\]\s*/g, "");
    
            const lyricsParts = lyrics.match(/[\s\S]{1,4096}/g) || [];
            const hasMultipleParts = lyricsParts.length > 1;
    
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor("Purple")
                    .setTitle(`Paroles de ${firstSong.fullTitle}${hasMultipleParts ? " - Partie 1" : ""}`)
                    .setDescription(lyricsParts[0])
                    .setFooter({
                        text: `Cordialement, l'équipe${interaction.guild.name}`,
                        iconURL: interaction.guild.iconURL(),
                    })
                ]
            });
    
            for (let i = 1; i < lyricsParts.length; i++) {
                await interaction.followUp({
                    embeds: [new EmbedBuilder()
                        .setColor("Purple")
                        .setTitle(`Paroles de ${firstSong.fullTitle} - Partie ${i + 1}`)
                        .setDescription(lyricsParts[i])
                        .setFooter({
                            text: `Cordialement, l'équipe${interaction.guild.name}`,
                            iconURL: interaction.guild.iconURL(),
                        })
                    ],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error("[MUSIC] Erreur lors de la récupération des paroles :", error);
            await interaction.editReply({ content: ":x:丨𝐈mpossible de trouver les paroles de cette chanson." });
        }
    }

    bot.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.channel.id !== '1136327173343559810') return;
    
        const { videos } = await yts.search(message.content);
        if (videos.length === 0) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription("丨𝐀ucun résultat trouvé.")] })
                .then(msg => setTimeout(() => msg.delete(), 5000));
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
            duration: `\`${formatDuration(videos[0].duration.timestamp)}\``
        };
    
        const voiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
    
        if (voiceChannel) {
            try {
                await distube.play(voiceChannel, song.url, {
                    member: message.member,
                    textChannel: message.channel,
                });
                console.log(`[MUSIC] Added to queue: ${song.title}`);
                await updateMusicEmbed(message.channel, message.guild.id);
            } catch (error) {
                console.error(`[MUSIC] Error playing song: ${error.message}`);
                await message.channel.send({ embeds: [new EmbedBuilder().setColor("Red").setDescription(":x:丨𝐔n problème est survenu lors de l'ajout de la musique à la file d'attente.")] });
            }
        } else {
            await storeSongForLaterPlayback(song, message.guild.id, message.channel);
        }
    
        await message.delete();
    });

    const songQueues = new Map();

    async function storeSongForLaterPlayback(song, guildId, textChannel) {
        if (!songQueues.has(guildId)) {
            songQueues.set(guildId, []);
        }
        songQueues.get(guildId).push(song);
        await updateMusicEmbed(textChannel, guildId);
    }
    async function updateMusicEmbed(channel, guildId) {
        try {
            let guild = channel.guild || await bot.guilds.fetch(guildId);
            if (!guild) {
                throw new Error(`[MUSIC] Impossible de récupérer la guilde avec l'ID : ${guildId}`);
            }
            const queue = distube.getQueue(guildId);
            let playlistText = "";
    
            if (queue && queue.songs.length > 0) {
                playlistText = queue.songs.map((song, index) => {
                    const isPaused = queue.paused && index === 0;
                    const songText = `${index + 1}丨${song.name} - \`${isPaused ? pauseIcon : song.formattedDuration}\``;
                    return index === 0 ? `**${songText}**` : songText;
                }).join('\n');
            } else if (songQueues.has(guildId) && songQueues.get(guildId).length > 0) {
                const tempQueue = songQueues.get(guildId);
                playlistText = tempQueue.map((song, index) => {
                    const songText = `${index + 1}丨${song.title} - ${song.duration}`;
                    return index === 0 ? `**${songText}**` : songText;
                }).join('\n');
            } else {
                playlistText = "**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.";
            }
    
            const guildName = guild.name;
            const guildIcon = guild.iconURL() ?? null;
    
            const newEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle("――――――――∈ MUSIQUES ∋――――――――")
                .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
                .setDescription(playlistText)
                .setFooter({
                    text: `Cordialement, l'équipe${guildName}`,
                    iconURL: guildIcon,
                });
    
            const musicEntry = await Music.findOne({ guildId });
            if (musicEntry) {
                const message = await channel.messages.fetch(musicEntry.messageId);
                await message.edit({ embeds: [newEmbed] });
            } else {
                const msg = await channel.send({ embeds: [newEmbed] });
                await Music.create({
                    guildId: guildId,
                    channelId: channel.id,
                    messageId: msg.id,
                });
            }
        } catch (error) {
            console.error("[MUSIC] Erreur lors de la mise à jour de l'embed :", error.message);
        }
    }
    async function disconnectIfEmpty(queue) {
        try {
            const serverId = queue.textChannel.guild.id;
            const guild = await bot.guilds.fetch(serverId);
            if (!guild) {
                throw new Error(`[MUSIC] Impossible de récupérer la guilde avec l'ID : ${serverId}`);
            }
    
            const botMember = guild.members.me;
            const voiceChannel = botMember?.voice?.channel;
    
            if (voiceChannel) {
                await botMember.voice.disconnect();
                await updateMusicEmbedInitial(queue.textChannel, serverId);
            }
        } catch (error) {
            console.error("[MUSIC] Erreur dans la fonction disconnectIfEmpty :", error.message);
        }
    }
    async function updateMusicEmbedInitial(channel, serverId) {
        try {
            let guild = channel.guild || await bot.guilds.fetch(serverId);
            if (!guild) {
                throw new Error(`[MUSIC] Impossible de récupérer la guilde avec l'ID : ${serverId}`);
            }
    
            const guildName = guild.name;
            const guildIcon = guild.iconURL() ?? null;
    
            const initialEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle("――――――――∈ MUSIQUES ∋――――――――")
                .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
                .setDescription("**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.")
                .setFooter({
                    text: `Cordialement, l'équipe ${guildName}`,
                    iconURL: guildIcon,
                });
    
            const musicEntry = await Music.findOne({ guildId: serverId });
            if (musicEntry) {
                const channel = await guild.channels.fetch(musicEntry.channelId);
                const message = await channel.messages.fetch(musicEntry.messageId);
                await message.edit({ embeds: [initialEmbed] });
            } else {
                const msg = await channel.send({ embeds: [initialEmbed] });
                await Music.create({
                    guildId: serverId,
                    channelId: channel.id,
                    messageId: msg.id,
                });
            }
        } catch (error) {
            console.error("[MUSIC] Erreur lors de la remise à zéro de l'embed :", error.message);
        }
    }
    async function playStoredSongs(guildId, voiceChannel, member, textChannel) {
        const queue = songQueues.get(guildId);
        if (queue && queue.length > 0) {
            console.log(`[MUSIC] Playing stored songs for guild ${guildId}.`);
            for (const song of queue) {
                try {
                    console.log(`[MUSIC] Attempting to play: ${song.title} (${song.url})`);
                    await distube.play(voiceChannel, song.url, {
                        member: member,
                        textChannel: textChannel,
                    });
                    console.log(`[MUSIC] Started playing: ${song.title}`);
                } catch (error) {
                    console.error(`[MUSIC] Error playing stored song (${song.title}):`, error);
                }
            }
            songQueues.delete(guildId);
        } else {
            console.log("[MUSIC] No songs stored to play.");
        }
    }
};
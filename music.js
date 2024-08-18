const { EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const yts = require('yt-search');
const Music = require("./models/music");

module.exports = (bot) => {
    const distube = new DisTube(bot, {
        plugins: [new YtDlpPlugin()],
        emitNewSongOnly: true,
    });

    distube
        .on('playSong', async (queue, song) => {
            song.name = song.name
                .replace(/\([^)]*\)/g, '')  
                .replace(/\[[^\]]*\]/g, '') 
                .replace(/\{[^}]*\}/g, '')  
                .replace(/\b(official|video|4k|hd|lyrics|ft\.|feat\.|remastered|audio)\b/gi, '') 
                .replace(/\s{2,}/g, ' ')  
                .trim();

            console.log(`Playing song: ${song.name}`);
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

            console.log(`Added song: ${song.name}`);
            await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
        })
        .on('finish', async (queue) => {
            console.log('The playlist has finished.');
            await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
            disconnectIfEmpty(queue);
        })
        .on('empty', async (queue) => {
            console.log('The voice channel is empty, leaving.');
            await updateMusicEmbed(queue.textChannel, queue.textChannel.guild.id);
            disconnectIfEmpty(queue);
        })
        .on('disconnect', () => console.log('Disconnected from the voice channel.'))
        .on('error', (channel, error) => {
            console.error(`Error in ${channel.name}: ${error}`);
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
            }
        } catch (error) {
            console.error("Error handling interaction:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: ":x: An error occurred while processing your request.", ephemeral: true });
            }
        }
    });

    async function handlePlayMusic(interaction, serverId) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply({ content: ":microphone2: You need to be in a voice channel to play music!", ephemeral: true });
            return;
        }

        const queue = distube.getQueue(serverId);
        if (!queue || queue.songs.length === 0) {
            await interaction.reply({ content: ":snowflake: The playlist is currently empty.", ephemeral: true });
        } else {
            await interaction.deferReply();
            try {
                await distube.resume(queue);
                await interaction.editReply(":saxophone: Playing the music!");
            } catch (error) {
                console.error("Error playing music:", error);
                await interaction.editReply(":x: An error occurred while playing the music.");
            }
        }
    }
    async function handleStopMusic(interaction, serverId) {
        const queue = distube.getQueue(serverId);

        if (!queue || queue.songs.length === 0) {
            await interaction.reply(":no_entry_sign: The playlist is already empty and the music is stopped.");
        } else {
            await interaction.deferReply();
            try {
                distube.stop(interaction.guild);
                await interaction.editReply(":no_entry_sign: The music has been stopped and the playlist is now empty.");
                disconnectIfEmpty(queue);
            } catch (error) {
                console.error("Error stopping music:", error);
                await interaction.editReply(":x: An error occurred while stopping the music.");
            }
        }
    }
    async function handleNextMusic(interaction, serverId) {
        await interaction.deferReply();
        try {
            distube.skip(interaction.guild);
            await interaction.editReply(":next_track: Skipping to the next song!");
            await updateMusicEmbed(interaction.channel, serverId);
        } catch (error) {
            console.error("Error skipping song:", error);
            await interaction.editReply(":x: An error occurred while skipping to the next song.");
        }
    }

    bot.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.channel.id !== '1136327173343559810') return;
    
        const { videos } = await yts.search(message.content);
        if (videos.length === 0) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription("No results found")] })
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
            duration: videos[0].duration.timestamp
        };
    
        const voiceChannel = message.member.voice.channel;
        await distube.play(voiceChannel, song.url, {
            member: message.member,
            textChannel: message.channel,
        });
    
        await updateMusicEmbed(message, message.guild.id);
        await message.delete();
    });

    async function updateMusicEmbed(interaction, serverId) {
        try {
            let guild = interaction.guild || await bot.guilds.fetch(serverId);
            if (!guild) {
                throw new Error(`Impossible de récupérer la guilde avec l'ID : ${serverId}`);
            }
    
            const queue = distube.getQueue(serverId);
            let playlistText = "";
    
            if (queue && queue.songs.length > 0) {
                playlistText = queue.songs.map((song, index) => {
                    const songText = `\`${index + 1}\`丨${song.name} - \`${song.formattedDuration}\``;
                    return index === 0 ? `**${songText}**` : songText;
                }).join('\n');
            } else {
                playlistText = "**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.";
            }
    
            const guildName = guild.name;
            const guildIcon = guild.iconURL() ?? null;
    
            const newEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle("――――――――∈ `MUSIQUES` ∋――――――――")
                .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
                .setDescription(playlistText)
                .setFooter({
                    text: `Cordialement, l'équipe ${guildName}`,
                    iconURL: guildIcon,
                })
    
            const musicEntry = await Music.findOne({ serverId });
            if (musicEntry) {
                const channel = await guild.channels.fetch(musicEntry.channelId);
                const message = await channel.messages.fetch(musicEntry.messageId);
                await message.edit({ embeds: [newEmbed] });
            } else {
                const channel = interaction.channel;
                const msg = await channel.send({ embeds: [newEmbed] });
                await Music.create({
                    serverId,
                    channelId: channel.id,
                    messageId: msg.id,
                });
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'embed :", error.message);
        }
    }

    async function disconnectIfEmpty(queue) {
        try {
            const serverId = queue.textChannel.guild.id;
            console.log("Déconnexion si le salon est vide, ServerID :", serverId);
    
            const guild = await bot.guilds.fetch(serverId);
            if (!guild) {
                throw new Error(`Impossible de récupérer la guilde avec l'ID : ${serverId}`);
            }
    
            const botMember = guild.members.me;
            const voiceChannel = botMember?.voice?.channel;
    
            if (voiceChannel) {
                await botMember.voice.disconnect();
                console.log('Bot déconnecté avec succès du canal vocal.');
                await updateMusicEmbedInitial(queue.textChannel, serverId);
            } else {
                console.log("Le bot n'est pas dans un canal vocal.");
            }
        } catch (error) {
            console.error("Erreur dans la fonction disconnectIfEmpty :", error.message);
        }
    }

    async function updateMusicEmbedInitial(channel, serverId) {
        try {
            let guild = channel.guild || await bot.guilds.fetch(serverId);
            if (!guild) {
                throw new Error(`Impossible de récupérer la guilde avec l'ID : ${serverId}`);
            }
    
            const guildName = guild.name;
            const guildIcon = guild.iconURL() ?? null;
    
            const initialEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle("――――――――∈ `MUSIQUES` ∋――――――――")
                .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
                .setDescription("**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.")
                .setFooter({
                    text: `Cordialement, l'équipe ${guildName}`,
                    iconURL: guildIcon,
                })
    
            const musicEntry = await Music.findOne({ serverId });
            if (musicEntry) {
                const channel = await guild.channels.fetch(musicEntry.channelId);
                const message = await channel.messages.fetch(musicEntry.messageId);
                await message.edit({ embeds: [initialEmbed] });
            } else {
                const msg = await channel.send({ embeds: [initialEmbed] });
                await Music.create({
                    serverId,
                    channelId: channel.id,
                    messageId: msg.id,
                });
            }
        } catch (error) {
            console.error("Erreur lors de la remise à zéro de l'embed :", error.message);
        }
    }
};
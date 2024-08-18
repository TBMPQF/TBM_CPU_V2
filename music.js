const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const yts = require('yt-search');
const Music = require("./models/music");

module.exports = (bot) => {
    const distube = new DisTube(bot, {
        plugins: [new YtDlpPlugin()],
        emitNewSongOnly: true,
    });

    const queues = {};
    const inactivityTimeouts = {};

    function addSong(serverId, song) {
        if (!queues[serverId]) {
            queues[serverId] = [];
        }
        queues[serverId].push(song);
        clearTimeout(inactivityTimeouts[serverId]);
    }

    function getQueue(serverId) {
        return queues[serverId] || [];
    }

    function clearQueue(serverId) {
        queues[serverId] = [];
        startInactivityTimeout(serverId);
    }

    function removeFirstSong(serverId) {
        if (queues[serverId] && queues[serverId].length > 0) {
            const removedSong = queues[serverId].shift();
            if (queues[serverId].length === 0) {
                startInactivityTimeout(serverId);
            }
            return removedSong;
        }
        return null;
    }

    function startInactivityTimeout(serverId) {
        if (inactivityTimeouts[serverId]) clearTimeout(inactivityTimeouts[serverId]);

        inactivityTimeouts[serverId] = setTimeout(() => {
            const voiceChannel = bot.guilds.cache.get(serverId)?.me?.voice?.channel;
            if (voiceChannel) {
                voiceChannel.leave();
            }
        }, 30000);
    }

    // Gestion des interactions
    bot.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;

        const serverId = interaction.guild.id;
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply({ content: ":microphone2:丨𝐓u dois être dans un salon vocal pour lancer la playlist !", ephemeral: true });
            return;
        }

        const queue = getQueue(serverId);

        switch (interaction.customId) {
            case 'PLAY_MUSIC':
                if (queue.length === 0) {
                    await interaction.reply({ content: ":snowflake:丨𝐋a playlist est actuellement vide.", ephemeral: true });
                } else {
                    try {
                        await interaction.deferReply();
                        const song = queue[0];
                        await distube.play(voiceChannel, song.url, {
                            member: interaction.member,
                            textChannel: interaction.channel,
                        });
                        await interaction.editReply(":saxophone:丨𝐉e lance la musique poulet !");
                        clearTimeout(inactivityTimeouts[serverId]);
                    } catch (error) {
                        console.error("Erreur lors de la lecture de la musique :", error);
                        await interaction.editReply(":x:丨Une erreur est survenue lors de la lecture de la musique.");
                    }
                }
                break;

            case 'STOP_MUSIC':
                try {
                    const queue = getQueue(serverId);
                
                    if (queue.length === 0) {
                        await interaction.reply(":no_entry_sign:丨La playlist est déjà vide et la musique est arrêtée.");
                    } else {
                        distube.stop(interaction.guild);
                        clearQueue(serverId);
                        await interaction.reply(":no_entry_sign:丨La musique a été arrêtée et la playlist est maintenant vide.");
                        await updateMusicEmbed(interaction, serverId);
                    }
                 } catch (error) {
                    console.error("Erreur lors de l'arrêt de la musique :", error);
                    await interaction.reply(":x:丨Une erreur est survenue lors de l'arrêt de la musique.");
                }
                break;

            case 'NEXT_MUSIC':
                try {
                    distube.skip(interaction.guild);
                    await interaction.reply(":next_track:丨𝐉'ai passé à la prochaine musique !");
                    await updateMusicEmbed(interaction, serverId);
                } catch (error) {
                    console.error("Erreur lors du passage à la prochaine musique :", error);
                    await interaction.reply(":x:丨Une erreur est survenue lors du passage à la prochaine musique.");
                }
                break;
        }
    });

    // Gestion des messages pour ajouter des chansons
    bot.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.channel.id !== '1136327173343559810') return;

        const { videos } = await yts.search(message.content);
        if (videos.length === 0) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor("Purple").setDescription("Aucun résultat trouvé")] }).then(msg => {
                setTimeout(() => msg.delete(), 5000);
            });
            return;
        }

        const song = {
            url: videos[0].url,
            title: videos[0].title,
            duration: videos[0].duration.timestamp
        };

        addSong(message.guild.id, song);

        await updateMusicEmbed(message, message.guild.id);
        await message.delete();
    });

    // Fonction pour mettre à jour l'embed de la playlist
    async function updateMusicEmbed(interaction, serverId) {
        const queue = getQueue(serverId);
        let playlistText = queue.map((song, index) => `\`${index + 1}\`丨${song.title} - \`${song.duration}\``).join('\n');

        const newEmbed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle(`――――――――∈ \`MUSIQUES\` ∋――――――――`)
            .setThumbnail("https://yt3.googleusercontent.com/ytc/APkrFKb-qzXQJhx650-CuoonHAnRXk2_wTgHxqcpXzxA_A=s900-c-k-c0x00ffffff-no-rj")
            .setDescription(playlistText || "**丨𝐋a playlist est vide pour le moment丨**\n\n**Écrit** dans le chat le nom de ta __musique préférée__ pour l'ajouter dans la playlist.")
            .setFooter({
                text: `Cordialement, l'équipe ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL(),
            });

        const musicEntry = await Music.findOne({ serverId });
        if (musicEntry) {
            const channel = await interaction.guild.channels.fetch(musicEntry.channelId);
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
    }
};

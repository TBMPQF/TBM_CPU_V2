const ApexStreamer = require('../../models/apexStreamer');

module.exports = {
    name: "addstreamer",
    description: "丨Ajoute l'utilisateur en tant que streamer dans la base de données.",
    dm: false,
    permission: 8,
    options: [
      {
        name: "twitchusername",
        description: "Le nom d'utilisateur Twitch.",
        type: 3,
        required: true
      },
      {
        name: "discorduser",
        description: "L'identifiant Discord de l'utilisateur.",
        type: 6,
        required: true
      }
    ],

    async execute(interaction) {
        try {
            const discordUser = interaction.options.getUser("discorduser");
            const twitchUsername = interaction.options.getString("twitchusername");
            let discordId = null;
            let discordUsername = null;

            if (discordUser) {
                discordId = discordUser.id;
                discordUsername = discordUser.tag;

                const existingUser = await ApexStreamer.findOne({ discordId: discordUser.id });
                if (existingUser) {
                    return interaction.reply('Cet utilisateur est déjà enregistré comme streamer dans la base de données.');
                }
            }

            const newUser = new ApexStreamer({
                discordId,
                discordUsername,
                discordServer: "『 𝐓𝐁𝐌𝐏𝐐𝐅ᴬᴹᴵᴸʸ 』",
                twitchUsername,
                isLive: false
            });

            await newUser.save();
            interaction.reply('L\'utilisateur a été ajouté comme streamer à la base de données.');

        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'utilisateur à la base de données:', error);
            interaction.reply(`**Une erreur est survenue lors de l'ajout en base de donnée -> contact mon créateur \`tbmpqf\`.**`);
        }
    }
}
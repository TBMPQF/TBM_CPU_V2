const {SlashCommandBuilder} = require ("discord.js")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord.js")

module.exports = async bot => {

    let commands = [];

    bot.commands.forEach(command => {

        function optionTypeToString(type) {
            const optionTypes = {
                1: 'SubCommand',
                2: 'SubCommandGroup',
                3: 'String',
                4: 'Integer',
                5: 'Boolean',
                6: 'User',
                7: 'Channel',
                8: 'Role',
                9: 'Mentionable',
                10: 'Number',
            };
            return optionTypes[type] || 'Unknown';
        }
        function addOptionByType(slashCommand, optionType, optionInfo) {
            switch (optionType) {
                case "SubCommand":
                    return slashCommand.addSubcommand(option => option.setName(optionInfo.name).setDescription(optionInfo.description));
                case "SubCommandGroup":
                    return slashCommand.addSubcommandGroup(option => option.setName(optionInfo.name).setDescription(optionInfo.description));
                case "String":
                    return slashCommand.addStringOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                case "Integer":
                    return slashCommand.addIntegerOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                case "Boolean":
                    return slashCommand.addBooleanOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                case "User":
                    return slashCommand.addUserOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                case "Channel":
                    return slashCommand.addChannelOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                case "Role":
                    return slashCommand.addRoleOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                case "Mentionable":
                    return slashCommand.addMentionableOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                case "Number":
                    return slashCommand.addNumberOption(option => option.setName(optionInfo.name).setDescription(optionInfo.description).setRequired(optionInfo.required));
                default:
                    throw new Error(`Unsupported option type: ${optionType}`);
            }
        }

        let slashcommand = new SlashCommandBuilder()
        .setName(command.name.toLowerCase())
        .setDescription(command.description)
        .setDMPermission(command.dm)
        .setDefaultMemberPermissions(command.permission === "Aucune" ? null : command.permission)

        if (command.options?.length >= 1) {
            for (let i = 0; i < command.options.length; i++) {
                const optionTypeStr = optionTypeToString(command.options[i].type);
                addOptionByType(slashcommand, optionTypeStr, {
                    name: command.options[i].name,
                    description: command.options[i].description,
                    required: command.options[i].required
                });
            }
        }
        commands.push(slashcommand)
    })

    const rest = new REST({version: "10"}).setToken(bot.token)

    await rest.put(Routes.applicationCommands(bot.user.id), {body: commands})
}

const api = require('../callAPI.js')
const cache = require("../cache")
const Discord = require('discord.js')

module.exports = {
    name: "refresh",
    description: "",
    args: ["region", "name"],
    async execute(interaction, args) {
        let playerName = ""
        let server = ""
        let region = ""
        let puuid = ""
        for(const i in args) {
            if (i === "0") server = args[i]
            else {
                if (i !== "1") playerName += " "
                playerName += args[i]
            }
        }
        if (!api.verifyServer(api.getRightServer(server))) {
            interaction.reply({
                embeds: [new Discord.MessageEmbed({
                    title: "Error",
                    description: "Server isn't right. Please use one of these :\n" + api.getServers(),
                    color: 0xff0000
                })]
            })
            return
        }

        server = api.getRightServer(server)
        puuid = await cache.getPuuidByName(server, playerName)
        if (puuid === undefined) {
            await interaction.reply({
                embeds: [new Discord.MessageEmbed({
                    title: "Error",
                    description: `The user **${playerName}** does not exist in ${server} !`
                })]
            })
            return
        }
        region = api.getRegionFromServer(server)

        await interaction.reply({
            embeds: [new Discord.MessageEmbed({title: `Refreshing ${playerName}...`})]
        })

        await cache.refreshProfileByPuuid(server, puuid)

        if (interaction.replied) {
            await interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed({
                        title: 'Refresh',
                        description: `The refresh has been completed.\n${playerName}'s data is now up to date.`,
                        color: 0x00FF00 // green
                    })
                ]
            })
        }
    }
}
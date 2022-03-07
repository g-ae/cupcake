const api = require('../callAPI.js')
const cache = require("../cache")

module.exports = {
    name: "refresh",
    description: "",
    args: ["region", "name"],
    async execute(interaction, args) {
        var playerName = ""
        var server = ""
        var region = ""
        var puuid = ""
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

        await cache.refreshProfileByPuuid()
    }
}
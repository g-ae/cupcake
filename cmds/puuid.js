const actions = require("../actions");
const fetch = require('cross-fetch');
const api = require("../callAPI");
const cache = require('../cache')
const { MessageEmbed, Message } = require("discord.js");

module.exports = {
    name: "puuid",
    description: "",
    args: ["name"],
    async execute(interaction, args) {
        var playerName = args.join(' ');

        const puuid = await cache.getPuuidByName('euw1', playerName)

        interaction.reply({embeds: [new MessageEmbed({
            title: playerName,
            description: puuid
        }).setFooter("Refreshed " + cache.getRefreshTimeByPuuid(puuid))]})
    }
}
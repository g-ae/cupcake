const actions = require("../actions");
const fetch = require('cross-fetch');
const api = require("../callAPI");
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "puuid",
    description: "",
    async execute(interaction, args) {
        var playerName = actions.getPlayerNameFromArgs(args);
        await fetch(api.getSummonerRequest(playerName))
        .then(r => {
            if (r.status == 200) {
                r.json().then(j => {
                    interaction.reply({embeds: [new MessageEmbed().setTitle(j.name).setDescription(j.puuid)]})
                })
            } else if (r.status == 403) {
                actions.ErreurCleAPI(interaction)
            } else {
                interaction.reply("autre")
            }
        })
    }
}
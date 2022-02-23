const actions = require("../actions");
const fetch = require('cross-fetch');
const api = require("../callAPI");
const { MessageEmbed, Message } = require("discord.js");

module.exports = {
    name: "puuid",
    description: "",
    args: ["name"],
    async execute(interaction, args) {
        var playerName = args.join(' ');
        await fetch(api.getSummonerRequest(playerName))
        .then(r => {
            if (r.status == 200) {
                r.json().then(j => {
                    interaction.reply({embeds: [new MessageEmbed({
                        title: j.name,
                        description: j.puuid
                    })]})
                })
            } else if (r.status == 403) actions.ErreurCleAPI(interaction) 
            else interaction.reply("autre")
        })
    }
}
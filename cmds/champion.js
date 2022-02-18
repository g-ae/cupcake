const Discord = require('discord.js');
const e = require("../emojis.json")

module.exports = {
    name: "champion",
    description: "",
    async execute(interaction, args) {
        interaction.reply(e[args.toString().trim().replace(/\s/g, '').toLowerCase()])
    }
}
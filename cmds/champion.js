const Discord = require('discord.js');
const e = require("../emojis.json")
const actions = require("../actions");
const api = require("../callAPI")

module.exports = {
    name: "champion",
    description: "",
    async execute(interaction, args) {
        const qry = args.toString().trim().replace(/\s/g, '').toLowerCase();
        var result = actions.findChampionEmoji(qry)
        const embed = new Discord.MessageEmbed()
        if (result.length == 0) {
            embed.setTitle("Error")
                .setDescription(`No champion with the name **${qry}** has been found.`)
                .setColor(0xFF0000)
        } else if (result.length == 1) {
            // result[0] == emoji
            var champName = result[0].toString().split(':')[1].split(':')[0]
            var champInfo = actions.getChampionFromName(champName)
            embed.setTitle(`${result[0]} ${champName}, ${champInfo.title}`)
                .setThumbnail(api.getChampionSquareIcon(champInfo.key))
                .setDescription(champInfo.tags.toString().replace(',',', '))
                .addFields(
                    {
                        name: "Health Points", value: `${champInfo.stats.hp} HP (+${champInfo.stats.hpperlevel} per level)`, inline: true
                    },
                    {
                        name: "Mana", value: /*champInfo.stats.mp*/ "mana", inline: true
                    }
                )
        } else {
            var desc = "";
            for(var c of result) {
                if (c != result[0]) desc += "\n"
                desc += c.charAt(0).toUpperCase() + c.slice(1)
            }
            embed.setTitle("What champion did you mean ? (retype the command)")
                .setDescription(desc)
        }
        interaction.reply({
            embeds: [embed],
            ephemeral: false
        })
    }
}
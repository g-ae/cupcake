const Discord = require('discord.js');
const actions = require("../actions");
const api = require("../callAPI")

module.exports = {
    name: "champion",
    description: "",
    args: ["name"],
    async execute(interaction, args) {
        // remove underscores and numbers from query
        const qry = args.toString().replace(/[_0-9\W]/g, '').toLowerCase();
        if (qry.length < 2) {
            interaction.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle("Error")
                        .setDescription("Please search for a champion using more than 2 letters.")
                        .setColor(0xff0000)
                ]
            })
            return
        }
        var result = actions.findChampionEmoji(qry)
        const embed = new Discord.MessageEmbed()
        if (result.length == 0) {
            const closest = actions.getClosestMatchChampionName(qry)
            var closestmatchstring = ""
            if (closest != undefined) {
                closestmatchstring = `Closest match: **${actions.capitalizeFirstLetter(closest)}**`
            }
            embed.setTitle("Error")
                .setDescription(`No champion with the name **${qry}** has been found.\n${closestmatchstring}`)
                .setColor(0xFF0000)
        } else if (result.length == 1) {
            // result[0] == emoji
            var champName = ""
            try {
                champName = result[0].toString().split(':')[1].split(':')[0]
            }
            catch(err) {
                embed.setTitle("Champion error")
                    .setColor(0xff0000)
                interaction.reply({
                    embeds: [embed]
                })
                return
            }
            const champInfo = actions.getChampionFromName(champName)
            var manaInfo = ""

            // MANA
            if (champInfo.stats.mp == 0) {
                manaInfo = `${champInfo.partype} isn't usable`
            } else {
                var manaRegen = ""
                var manaPerLevel = ""

                // manaRegen
                if (champInfo.stats.mpregen == 0) manaRegen = `No natural regen`
                else {
                    manaRegenPerLevel = ""
                    if (champInfo.stats.mpregenperlevel == 0) manaRegenPerLevel = "max"
                    else manaRegenPerLevel = `+ ${champInfo.stats.mpregenperlevel} per level`
                    manaRegen = `${champInfo.stats.mpregen} regen (${manaRegenPerLevel})`
                }

                // manaMax
                if (champInfo.stats.mpperlevel == 0) manaPerLevel = `max`;
                else manaPerLevel = `${champInfo.stats.mpperlevel} per level`

                manaInfo = `${champInfo.stats.mp} ${champInfo.partype} (${manaPerLevel})\n${manaRegen}`
            }

            // END RESULT
            embed.setTitle(`${result[0]} ${champInfo.name}, ${champInfo.title}`)
                .setThumbnail(api.getChampionSquareIcon(champInfo.key))
                .setDescription(champInfo.tags.toString().replace(',',', '))
                .addFields(
                    {   // HP + REGEN
                        name: "Health Points", value: `${champInfo.stats.hp} HP (+${champInfo.stats.hpperlevel} per level)\n${champInfo.stats.hpregen} (+ ${champInfo.stats.hpregenperlevel} regen per level)`, inline: true
                    },
                    {   // MANA OR ENERGY + REGEN
                        name: champInfo.partype, value: manaInfo, inline: true
                    },

                )
        } else {
            var desc = "";
            for(var c of result) {
                if (c != result[0]) desc += "\n"
                desc += actions.findChampionEmoji(c) + " " + actions.getChampionFromName(c).name
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
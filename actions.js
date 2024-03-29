const masteries = require("./emojis/masteries.json");
const champEmojis = require("./emojis/champions.json")
const fs = require('fs')
const champs = require("./data/champions.json").data;
const levenshtein = require('js-levenshtein');
const Discord = require('discord.js')

module.exports = {
    /**
     * Get data from a JSON file without using require() which caches everything it loads
     * @param file json file path
     * @returns json file's content
     */
    getDataFromJSON(file) {
        if (!fs.existsSync(file)) return undefined

        return JSON.parse(fs.readFileSync(file))
    },
    pluralOrNot(number) {
        if (number != 1) return "s"
        return ""
    },
    addSeparator(number) {
        var test = String(number)
        var final = ""

        if (test.length > 3) {
            var restant = test.length - 3
            if (restant > 3) {
                var restant2 = restant - 3
                final = `${test.substring(0, restant2)},${test.substring(restant2,restant)},${test.substring(restant,test.length)}`
            } else {
                final = `${test.substring(0, restant)},${test.substring(restant,test.length)}`
            }
            return final;
        } else {
            return number;
        }
    },
    getMasteryEmote(mastery) {
        switch(mastery) {
            case 4:
                return masteries.m4;
            case 5:
                return masteries.m5;
            case 6:
                return masteries.m6;
            case 7:
                return masteries.m7;
            default:
                return "";
        }
    },
    /**
     * Get champion : the method will first look in the JSON if the champion is there and if the version is correct, if not, it will fetch it from DDragon.
     * @param {String} idOrName Specifies the champion's ID or Name (ID is default) (Example of an ID: MonkeyKing for Wukong)
     * @param {Integer} id 
     * * if it's an id : 1  (MonkeyKing)
     * * if it's a name : 2 (Wukong)
     * * if it's a key : 3  (62)
     */
    getChampion(idKeyOrName, isId = 1) {
        switch(isId) {
            case 1:
                // if looking for ID (default)
                return this.getChampionFromId(idKeyOrName);
            case 2:
                // if looking for name
                return this.getChampionFromName(idKeyOrName);
            case 3:
                return this.getChampionFromKey(idKeyOrName)
            default:
                throw new Error("actions.js ERROR: getChampion\nisId parameter wrongly used.")
        }
    },
    getChampionFromId(id) {
        return champs[id]
    },
    getChampionFromKey(key) {
        for (const champ in champs) {
            if (champs[champ].key == key) {
                return champs[champ];
            }
        }
        return undefined;
    },
    getChampionFromName(name) {
        var replacedName = name.toString().toLowerCase().replace(/[^0-9a-z]/gi, '')
        for (const champ in champs) {
            if (champs[champ].name.toString().toLowerCase().replace(/[^0-9a-z]/gi, '') == replacedName) {
                return champs[champ];
            }
        }
        return undefined;
    },
    apiKeyError(interaction) {
        const e = new Discord.MessageEmbed({
            title: "Error",
            description: "The API key has an error. Contact an admin.",
            color: 0xFF0000
        })
        if (!interaction.replied) interaction.reply({ embeds: [ e ] })
        interaction.editReply({ embeds: [ e ] })
    },
    getRightQueueName(data) {
        switch(data){
            case "RANKED_SOLO_5x5":
                return "Ranked Solo/Duo"
            case "RANKED_FLEX_SR":
                return "Ranked Flex"
        }
    },
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    /**
     * Checks if champion exists in the emoji json
     * @param {String} name name of champion
     * @returns {Array} array with either only champion emoji (index 0) or all choices
     */
    findChampionEmoji(name) {
        const query = name.toString().replace(/[_0-9\W]/g, '').toLowerCase();
        var champs = []
        if (champEmojis.hasOwnProperty(query)) {
            champs.push(champEmojis[query])
            return champs
        } else {
            // if not in emojis
            for (var k in champEmojis) {
                if (["m4", "m5", "m6", "m7"].includes(k)) continue // mastery emojis not used
                if (k.includes(query)) {
                    champs.push(k)
                }
            }
            if (champs.length == 1) {
                return this.findChampionEmoji(champs[0])
            }
            return champs
        }
    },
    /**
     * Uses the Levenshtein's algorithm to compare two names
     * @param {String} name champion's name
     * @returns {String} champion name that is closest
     */
    getClosestMatchChampionName(name) {
        var bestmatchname = ""
        var bestmatchvalue = 10
        for (var champ of champs) {
            console.log(champ)
            var l = levenshtein(name, champ)
            if (bestmatchvalue > l) {
                bestmatchvalue = l
                bestmatchname = champ
            }
        }
        if (bestmatchvalue >= 4) return undefined
        return bestmatchname
    }
}
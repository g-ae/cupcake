const emojis = require("./emojis.json");
const champs = require("./data/champions.json").data;

module.exports = {
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
                return emojis.m4;
            case 5:
                return emojis.m5;
            case 6:
                return emojis.m6;
            case 7:
                return emojis.m7;
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
        if (isId == 1) {
            // if looking for ID
            var champ = this.getChampionFromId(idKeyOrName);
            console.log(champ);
        } else if (isId == 2) {
            // if looking for name
            var champ = this.getChampionFromName(idKeyOrName);
            console.log("name" + champ)
        } else if (isId == 3) {
            return this.getChampionFromKey(idKeyOrName)
        } else {
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
        for (const champ in champs) {
            if (champs[champ].name == name) {
                return champs[champ];
            }
        }
        return undefined;
    },
    getPlayerNameFromArgs(args) {
        return args.join(' ');
    },
    ErreurCleAPI(interaction) {
        interaction.editReply("La clé API est pétée fdp <@216308428828704769>")
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
    }
}
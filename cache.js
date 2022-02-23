const fs = require('fs')
const path = require('path')

module.exports = {
    /**
     * 
     * @param {String} matchId id of the match to check
     * @returns {Boolean} true if exists, false if not
     */
    isMatchSaved(matchId) {
        if (fs.existsSync(path.resolve(`./data/matchs/`, `${matchId}.json`))) return true
        return false
    },
    saveMatch(json, matchId) {
        if (!fs.existsSync("./data/matchs/")) fs.mkdirSync("./data/matchs")
        //console.log(matchId)
        if (this.isMatchSaved(matchId)) return

        fs.writeFileSync(path.resolve(`./data/matchs/`, `${matchId}.json`), JSON.stringify(json))
    },
    getSavedMatch(matchId) {
        if (this.isMatchSaved(matchId)) {
            return require(`./data/matchs/${matchId}.json`)
        }
        return undefined
    }
}
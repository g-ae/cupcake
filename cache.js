const fs = require('fs')
const path = require('path')
const fetch = require('cross-fetch');
const api = require('./callAPI')
const actions = require('./actions')

module.exports = {
    //#region match
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
    },
    //#endregion
    //#region profile by puuid
    /* profiles are saved under ./data/profiles/ in a folder with their puuid and username as json name, example:
    PUUID (Folder)
        NAME.json (summoner)
        mastery.json
        matches.json
        ranked.json
        creationTime.json
    */
    checkFolderExistsProfile() {
        if (!fs.existsSync("./data/")) fs.mkdirSync("./data/")
        if (!fs.existsSync("./data/profiles/")) fs.mkdirSync("./data/profiles/")
    },
    /**
     * Checks if a profile is already saved (by puuid)
     * @param {String} puuid 
     * @returns {Boolean} true if exists, false if not
     */
    isProfileSavedByPuuid(puuid) {
        if (fs.existsSync(`./data/profiles/${puuid}/`)) return true
        return false
    },
    /**
     * Checks if a profile is already saved (by name)
     * @param {String} name 
     * @returns {Boolean} true if exists, false if not
     */
    isProfileSavedByName(name) {
        for(var user of fs.readdirSync(`./data/profiles/`)) {
            if (fs.readdirSync(`./data/profiles/${user}/`).includes(`${name}.json`)) return true
        }
        return false
    },
    /**
     * 
     * @param {String} server
     * @param {String} puuid 
     * @returns profile in json
     */
    async saveProfile(server, puuid) {
        this.checkFolderExistsProfile();
        
        if (!this.isProfileSavedByPuuid(puuid)) {
            const r = await fetch(api.getSummonerRequestByPuuid(server, puuid))
            if (r.status != 200) return undefined
            const jSummoner = await (r).json()
            var name = jSummoner["name"]
            fs.mkdirSync(`./data/profiles/${puuid}/`)
            fs.writeFileSync(`./data/profiles/${puuid}/${name}.json`, JSON.stringify(jSummoner))
            console.log(`Saved user "${name}" of server "${server}"`)

            const jRanked = await (await fetch(api.getRankedEntries(server, jSummoner.id))).json()
            fs.writeFileSync(`./data/profiles/${puuid}/ranked.json`, JSON.stringify(jRanked))

            const jMastery = await (await fetch(api.getChampionMasteryRequest(server, jSummoner.id))).json()
            fs.writeFileSync(`./data/profiles/${puuid}/mastery.json`, JSON.stringify(jMastery))

            const jMatches = await (await fetch(api.getRecentMatchesId(api.getRegionFromServer(server), puuid))).json()
            fs.writeFileSync(`./data/profiles/${puuid}/matches.json`, JSON.stringify(jMatches))

            const time = new Date()
            const jTime = {
                "time": time.getTime()
            }
            fs.writeFileSync(`./data/profiles/${puuid}/creationTime.json`, JSON.stringify(jTime))
            return jSummoner
        }
        return undefined
    },
    getRefreshTimeByPuuid(puuid) {
        const epochCreated = this.getRefreshTimeEpochByPuuid(puuid)

        var seconds = Math.floor((new Date() - epochCreated) / 1000);
        
        var interval = seconds / 31536000;
        
        if (interval > 1) {
            return Math.floor(interval) + ` year${actions.pluralOrNot(Math.floor(interval))} ago`;
        }
        interval = seconds / 2592000;
        if (interval > 1) {
            return Math.floor(interval) + ` month${actions.pluralOrNot(Math.floor(interval))} ago`;
        }
        interval = seconds / 86400;
        if (interval > 1) {
            return Math.floor(interval) + ` day${actions.pluralOrNot(Math.floor(interval))} ago`;
        }
        interval = seconds / 3600;
        if (interval > 1) {
            return Math.floor(interval) + ` hour${actions.pluralOrNot(Math.floor(interval))} ago`;
        }
        interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + ` minute${actions.pluralOrNot(Math.floor(interval))} ago`;
        }
        return Math.floor(seconds) + ` second${actions.pluralOrNot(Math.floor(interval))} ago`;
    },
    getRefreshTimeEpochByPuuid(puuid) {
        return require(`./data/profiles/${puuid}/creationTime.json`)["time"]
    },
    getRankedEntriesByPuuid(puuid) {
        if (this.isProfileSavedByPuuid(puuid)) {
            for (var file of fs.readdirSync(`./data/profiles/${puuid}/`)) {
                if (file == "ranked.json") return require(file)
            }
        }

    },
    refreshProfileByPuuid(server, puuid) {
        if (fs.existsSync(`./data/profiles/${puuid}`)) fs.rmSync(`./data/profiles/${puuid}`, { recursive: true, force: true })
        this.saveProfile(server, puuid)
    },
    refreshProfileByName(server, name) {
        this.refreshProfileByPuuid(server, getProfileByName(server, name)["puuid"])
    },
    /**
     * Get an user's puuid by their name
     * @param {String} server 
     * @param {String} name 
     * @returns User's PUUID, or undefined if user doesn't exist
     */
    async getPuuidByName(server, name) {
        this.checkFolderExistsProfile();

        if (this.isProfileSavedByName(name)) {
            for (var user of fs.readdirSync(`./data/profiles/`)) {
                for (var file of fs.readdirSync(`./data/profiles/${user}/`)) {
                    if (file != "creationTime.json" && file != "mastery.json" && file != "matches.json" && file != "ranked.json") {
                        return require(`./data/profiles/${user}/${file}`)["puuid"]
                    } 
                }
            }
            return undefined
        } else {
            const sum = await (await fetch(api.getSummonerRequestByName(server, name))).json()
            const saved = await this.saveProfile(server, sum["puuid"])

            if (saved == undefined) return undefined
            return sum["puuid"]
        }
    },
    async getProfileByPuuid(server, puuid) {
        if (this.isProfileSavedByPuuid(puuid)) {
            for (var file of fs.readdirSync(`./data/profiles/${puuid}/`)) {
                if (file != "creationTime.json" && file != "mastery.json" && file != "matches.json" && file != "ranked.json") return require(`./data/profiles/${user}/${file}`)
            }
        } else {
            const j = await this.saveProfile(server, puuid)
            return j
        }
    },
    //#endregion
    //#region setup
    async setup(callback) {
        await this.fetchDDragonVersion(() => {
            this.setupAllChamps(() => {
                callback()
            })
        })
    },
    getDDragonVersion() {
        return require('./data/versionApi.json').DDragon
    },
    fetchDDragonVersion(callback){
        fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        .then(r => {
            r.json().then(j => {
                var json = {
                    "DDragon": j[0]
                };
                if (!fs.existsSync('./data/')) fs.mkdirSync('./data/')
                fs.writeFileSync(path.resolve(`./data/`, `versionApi.json`), JSON.stringify(json))
                callback()
            })
        })
    },
    setupAllChamps(callback){
        fetch(`http://ddragon.leagueoflegends.com/cdn/${this.getDDragonVersion()}/data/en_US/champion.json`)
        // ne contient pas toutes les infos : pour plus de détails prendre /champion/"Aatrox".json
        .then(r => {
            r.json().then(j => {
                fs.writeFileSync(path.resolve(`./data/`, `champions.json`), JSON.stringify(j))
                callback()
            })
        })
    }
    //#endregion
}
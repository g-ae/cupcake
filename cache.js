const fs = require('fs')
const path = require('path')
const fetch = require('cross-fetch');
const api = require('./callAPI')
const actions = require('./actions')

module.exports = {
    //#region match
    /**
     * Is the match saved
     * @param {String} matchId id of the match to check
     * @returns {Boolean} true if exists, false if not
     */
    isMatchSaved(matchId) {
        return fs.existsSync(path.resolve(`./data/matchs/`, `${matchId}.json`));
    },
    saveMatch(json, matchId) {
        if (!fs.existsSync("./data/matchs/")) fs.mkdirSync("./data/matchs")
        //console.log(matchId)
        if (this.isMatchSaved(matchId)) return

        fs.writeFileSync(path.resolve(`./data/matchs/`, `${matchId}.json`), JSON.stringify(json))
    },
    getSavedMatch(matchId) {
        if (this.isMatchSaved(matchId)) return require(`./data/matchs/${matchId}.json`)
        return undefined
    },
    async getLastMatchesByPuuid(puuid) {
        if (this.isProfileSavedByPuuid(puuid)) return require(`./data/profiles/${puuid}/matches.json`)
    },
    //#endregion
    //#region profile by puuid
    /* profiles are saved under ./data/profiles/ in a folder with their puuid and username as json name, example:
    PUUID (Folder)
        NAME#TAG.json (summoner)
        mastery.json
        matches.json
        ranked.json
        creationTime.json
    */
   /**
    * Checks if the /data/profiles folders exist.
    * If not, creates them
    * @returns {null}
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
        return fs.existsSync(`./data/profiles/${puuid}/`);
    },
    /**
     * Checks if a profile is already saved (by name)
     * @param {String} name 
     * @returns {Boolean} true if exists, false if not
     */
    isProfileSavedByName(name) {
        for(const user of fs.readdirSync(`./data/profiles/`)) {
            if (fs.readdirSync(`./data/profiles/${user}/`).includes(`${name}.json`)) return true
        }
        return false
    },
    /**
     * Saves the user's profile in local data JSON
     * @param {String} server user's server (ex: euw1)
     * @param {String} puuid user's account's puuid
     * @returns profile in json or undefined if wrong
     */
    async saveProfile(server, puuid) {
        this.checkFolderExistsProfile();
        
        if (!this.isProfileSavedByPuuid(puuid)) {
            const r = await fetch(api.getSummonerRequestByPuuid(server, puuid))
            if (parseInt(r.status) !== 200) return undefined
            const jSummoner = await (r).json()
            const jRiotAcc = await (await fetch(api.getAccountInfoByPuuid(api.getRegionFromServer(server), puuid))).json()
            const name = jRiotAcc["gameName"] + "#" + jRiotAcc["tagLine"]
            fs.mkdirSync(`./data/profiles/${puuid}/`)
            fs.writeFileSync(`./data/profiles/${puuid}/${name}.json`, JSON.stringify({
                id: jSummoner["id"],
                accountId: jSummoner["accountId"],
                puuid: jSummoner["puuid"],
                profileIconId: jSummoner["profileIconId"],
                summonerLevel: jSummoner["summonerLevel"],
                name: name,
                gameName: jRiotAcc["gameName"],
                tagLine: jRiotAcc["tagLine"],
                server: server
            }))
            console.log(`Saved user "${name}" of server "${server}"`)

            const jRanked = await (await fetch(api.getRankedEntries(server, jSummoner.id))).json()
            fs.writeFileSync(`./data/profiles/${puuid}/ranked.json`, JSON.stringify(jRanked))

            const jMastery = await (await fetch(api.getChampionMasteryRequestByPuuid(server, puuid))).json()
            const topChamps = []
            for (let i = 0; i <= 24; i++) {
                if (jMastery[i] === undefined) continue
                topChamps.push(jMastery[i]);
            }
            fs.writeFileSync(`./data/profiles/${puuid}/mastery.json`, JSON.stringify(topChamps))

            const jMatches = await (await fetch(api.getRecentMatchesId(api.getRegionFromServer(server), puuid))).json()
            fs.writeFileSync(`./data/profiles/${puuid}/matches.json`, JSON.stringify(jMatches))

            const time = new Date()
            fs.writeFileSync(`./data/profiles/${puuid}/creationTime.json`, JSON.stringify({
                "time": time.getTime()
            }))
            return jSummoner
        }
        return undefined
    },
    /**
     * How long ago was the user's account refreshed in seconds
     * @param {String} puuid 
     * @returns {number} Number of seconds
     */
    getRefreshTimeInSeconds(puuid) {
        const epochCreated = this.getRefreshTimeEpochByPuuid(puuid)

        return Math.floor((new Date() - epochCreated) / 1000)
    },
    getRefreshTimeByPuuid(puuid) {
        const epochCreated = this.getRefreshTimeEpochByPuuid(puuid)

        const seconds = Math.floor((new Date() - epochCreated) / 1000);
        
        let interval = seconds / 31536000;
        
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
        if (interval === 0) {
            return "just now"
        }
        return Math.floor(seconds) + ` second${actions.pluralOrNot(Math.floor(interval))} ago`;
    },
    /**
     * Get the time when the user's account was refreshed or created
     * @param {String} puuid User's puuid
     * @returns {number} epoch when the profile was refreshed
     */
    getRefreshTimeEpochByPuuid(puuid) {
        return actions.getDataFromJSON(`./data/profiles/${puuid}/creationTime.json`)["time"]
    },
    async getRankedEntriesByPuuid(puuid) {
        if (this.isProfileSavedByPuuid(puuid)) {
            return actions.getDataFromJSON(`./data/profiles/${puuid}/ranked.json`)
        }
    },
    async refreshProfileByPuuid(server, puuid) {
        console.log(`Refreshing ${puuid}`)
        if (fs.existsSync(`./data/profiles/${puuid}/`)) {
            fs.rmSync(`./data/profiles/${puuid}`, { recursive: true, force: true })
        }
        await this.saveProfile(server, puuid)
    },
    async refreshProfileByName(server, name) {
        await this.refreshProfileByPuuid(server, await this.getPuuidByName(server, name))
    },
    /**
     * Get a user's puuid by their name
     * @param {String} server 
     * @param {String} name 
     * @returns User's PUUID, or undefined if user doesn't exist
     */
    async getPuuidByName(server, name) {
        // Vérifie que le dossier avant profil existe
        this.checkFolderExistsProfile();

        // Si le profil est déjà sauvegardé
        if (this.isProfileSavedByName(name)) {
            // Pour chaque dossier d'utilisateur
            for (let user of fs.readdirSync(`./data/profiles/`)) {
                // Pour chaque dossier de chaque utilisateur
                for (let file of fs.readdirSync(`./data/profiles/${user}/`)) {
                    // Si le nom du fichier JSON = nom à trouver, OK
                    if (file === `${name}.json`) {
                        return actions.getDataFromJSON(`./data/profiles/${user}/${file}`)["puuid"]
                    }
                }
            }

            await this.refreshProfileByName(server, name)
        }

        // Fonctionne au 19.08.24
        const httpr = await fetch(api.getSummonerRequestByRID(api.getRegionFromServer(server), name))
        const sum = await (httpr).json()
        const saved = await this.saveProfile(server, sum["puuid"])

        console.log(sum["puuid"], saved)
        if (saved === undefined) return undefined
        return sum["puuid"]
    },
    async getProfileByPuuid(server, puuid) {
        if (this.isProfileSavedByPuuid(puuid)) {
            if (!await this.checkAllFilesOk(server, puuid)) {
                await this.saveProfile(server, puuid)
            }
            try {
                for (const file of fs.readdirSync(`./data/profiles/${puuid}/`)) {
                    if (file !== "creationTime.json" && file !== "mastery.json" && file !== "matches.json" && file !== "ranked.json") return actions.getDataFromJSON(`./data/profiles/${puuid}/${file}`)
                }
            } catch(err) {
                console.log("Doesn't exist for some reason")
            }
        }
        return await this.refreshProfileByPuuid(server, puuid)
    },
    async checkAllFilesOk(server, puuid) {
        if (this.isProfileSavedByPuuid(puuid)) {
            if (fs.readdirSync(`./data/profiles/${puuid}/`).length === 5) return true
        }
        await this.refreshProfileByPuuid(server, puuid)
        return await this.checkAllFilesOk(server, puuid)
    },
    async getMasteryByPuuid(server, puuid) {
        if (!this.isProfileSavedByPuuid(puuid)) await this.saveProfile(server, puuid)
        await this.checkAllFilesOk(server, puuid)
        return actions.getDataFromJSON(`./data/profiles/${puuid}/mastery.json`)
    },
    //#endregion
    //#region setup
    /**
     *
     * @returns {Promise<void>}
     */
    async setup() {
        try {
            await this.fetchDDragonVersion()
            await this.setupAllChamps();
        } catch(err) {
            console.log("An error occured :\n" + err)
        }
    },
    /**
     * Current DDragon version
     * @returns {String} DDragon version
     */
    getDDragonVersion() {
        return actions.getDataFromJSON('./data/versionApi.json').DDragon
    },
    /**
     * Fetch DDragon version from web
     * @returns {Promise<String>} DDragon version
     */
    async fetchDDragonVersion(){
        const data = await( await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json()

        if (!fs.existsSync('./data/')) fs.mkdirSync('./data/')
        await fs.promises.writeFile(path.resolve(`./data/`, `versionApi.json`), JSON.stringify({
            "DDragon": data[0]
        }))
        console.log("DDragon version is up to date.")
        return data[0]
    },
    async setupAllChamps(){
        const data = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${this.getDDragonVersion()}/data/en_US/champion.json`)).json()
        // ne contient pas toutes les infos : pour plus de détails prendre /champion/"Aatrox".json
        
        await fs.promises.writeFile(path.resolve(`./data/`, `champions.json`), JSON.stringify(data))
        console.log("Champion list is up to date.")
    },
    //#endregion
    
    //#region other
    getProfileIconURL(id){
        return `https://ddragon.leagueoflegends.com/cdn/${this.getDDragonVersion()}/img/profileicon/${id}.png`
    }
    //#endregion
}
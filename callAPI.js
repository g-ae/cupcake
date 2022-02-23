const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const server = "euw1";
const server2 = "europe";

const APIkey = "api_key=" + process.env.API_KEY;

module.exports = {
    getSummonerRequest(name){
        return `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?${APIkey}`;
    },
    getChampionMasteryRequest(summonerId){
        return `https://${server}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}?${APIkey}`;
    },
    getDDragonVersion() {
        var version = ""
        if (!fs.existsSync('./data/versionApi.json')) {
            version = this.fetchDDragonVersion(this.getDDragonVersion)
        } else {
            version = require('./data/versionApi.json').DDragon
        }
        if (version == undefined) {
            version = this.fetchDDragonVersion(this.getDDragonVersion)
        }
        return version
    },
    setupAllChamps(){
        fetch(`http://ddragon.leagueoflegends.com/cdn/${this.getDDragonVersion()}/data/en_US/champion.json`)
        // ne contient pas toutes les infos : pour plus de détails prendre /champion/"Aatrox".json
        .then(r => {
            r.json().then(j => {
                fs.writeFileSync(path.resolve(`./data/`, `champions.json`), JSON.stringify(j))
            })
        })
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

                return callback
            })
        })
    },
    getRiotAccountRequest(puuid) {
        return `https://${server2}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?${APIkey}`
    },
    getRankedEntries(encryptedSummonerId) {
        return `https://${server}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}?${APIkey}`;
    },
    /**
     * Gets an user's recent matches (only ids)
     * @param {String} puuid User's puuid
     * @param {Integer} count count of matches to return (defaults to 20) 
     */
    getRecentMatchesId(puuid, count = 20) {
        return `https://${server2}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}&${APIkey}`
    },
    getMatchDetails(matchId) {
        return `https://${server2}.api.riotgames.com/lol/match/v5/matches/${matchId}?${APIkey}`
    },
    /**
     * Gets URL to champion's square icon
     * @param {String} id 
     * @returns {String} url to champion's square icon
     */
    getChampionSquareIcon(id) {
        return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${id}.png`
    }
}
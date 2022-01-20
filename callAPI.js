// API KEY REGEN EVERY 24H : https://developer.riotgames.com/
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');
const champs = require('./champions.json').data
require('dotenv').config();
const champCmd = require("./cmds/champion");

const server = "euw1";
const server2 = "europe";

const APIkey = "?api_key=" + process.env.API_KEY;

module.exports = {
    getSummonerRequest(name){
        return `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}${APIkey}`;
    },
    getChampionMasteryRequest(summonerId){
        return `https://${server}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}${APIkey}`;
    },
    getDDragonVersion() {
        return require('./versionApi.json').DDragon;
    },
    getAllChamps(){
        fetch(`http://ddragon.leagueoflegends.com/cdn/${this.getDDragonVersion()}/data/en_US/champion.json`)
        // ne contient pas toutes les infos : pour plus de détails prendre /champion/"Aatrox".json
        .then(res => {
            res.json().then(json => {
                fs.writeFileSync(path.resolve(`./`, `champions.json`), JSON.stringify(json))
            })
        })
    },
    fetchDDragonVersion(){
        fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        .then(res => {
            res.json().then(j => {
                var json = {
                    "DDragon": j[0]
                };
                fs.writeFileSync(path.resolve(`./`, `versionApi.json`), JSON.stringify(json))
            })
        })
    },
    getRiotAccountRequest(puuid) {
        return `https://${server2}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}${APIkey}`
    }
}
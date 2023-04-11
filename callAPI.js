require('dotenv').config();
const serverlist = [ "eun1", "euw1", "ru", "tr1", "jp1", "kr", "la1", "la2", "na1", "br1", "oc1" ]
const APIkey = "api_key=" + process.env.API_KEY;

module.exports = {
    getServers(){
        return serverlist.join('\n')
    },
    /**
     * Checks if the server exists
     * @param {String} server server to check
     * @returns {Boolean} true if server OK, false if not
     */
    verifyServer(server) {
        return serverlist.includes(server);
    },
    /**
     * Looks for the right server.
     * @param {String} server server to write correctly
     * @returns server written correctly
     */
    getRightServer(server) {
        if (serverlist.includes(server)) return server

        for(const srv in serverlist) {
            if (server === srv.slice(0, srv.length - 2)) return server + "1"
        }

        return undefined
    },
    getRegionFromServer(server){
        if (server === undefined) return undefined
        switch(server) {
            case "br1":
            case "la1":
            case "la2":
            case "na1":
            case "oc1":
                return "americas"
            case "kr":
            case "jp1":
                return "asia"
            case "euw1":
            case "eun1":
            case "ru":
            case "tr1":
                return "europe"
            default:
                return undefined
        }
    },
    getSummonerRequestByName(server, name){
        return `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?${APIkey}`;
    },
    getSummonerRequestByPuuid(server, puuid) {
        return `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?${APIkey}`
    },
    getChampionMasteryRequest(server, summonerId){
        return `https://${server}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}?${APIkey}`;
    },
    getRankedEntries(server, encryptedSummonerId) {
        return `https://${server}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}?${APIkey}`;
    },
    /**
     * Gets a user's recent matches (only ids)
     * @param {String} region User's region
     * @param {String} puuid User's puuid
     * @param {Integer} count count of matches to return (defaults to 15)
     */
    getRecentMatchesId(region, puuid, count = 4) {
        return `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}&${APIkey}`
    },
    /**
     * 
     * @param {String} region region in which the match is
     * @param {String} matchId 
     * @returns 
     */
    getMatchDetails(region, matchId) {
        return `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}?${APIkey}`
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
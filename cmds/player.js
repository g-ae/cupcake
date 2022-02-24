const Discord = require('discord.js')
const api = require('../callAPI.js')
const fetch = require('cross-fetch')
const actions = require("../actions.js")
const e = require("../emojis.json")
const cache = require("../cache")
const { getPuuidByName } = require('../cache')
var gPlayerName = ""
var gServer = ""
var gRegion = ""
var gPuuid = ""

module.exports = {
    name: "player",
    description: "",
    args: ["region", "name"],
    async execute(interaction, args) {
        for(var i in args) {
            if (i == 0) gServer = args[i]
            else {
                if (i != 1) gPlayerName += " "
                gPlayerName += args[i]
            }
        }
        if (!api.verifyServer(api.getRightServer(gServer))) {
            interaction.reply({
                embeds: [new Discord.MessageEmbed({
                    title: "Error",
                    description: "Server isn't right. Please use one of these :\n" + api.getServers(),
                    color: 0xff0000
                })]
            })
            return
        } else {
            gServer = api.getRightServer(gServer)
            gPuuid = cache.getPuuidByName(gServer, gPlayerName)
            gRegion = api.getRegionFromServer(gServer)

            if (gPuuid == undefined) {
                interaction.reply({
                    embeds: [new Discord.MessageEmbed({
                        title: "Error",
                        description: `The user **${gPlayerName}** does not exist in this server !`
                    })]
                })
                return
            }
        }
        interaction.reply({
            embeds: [new Discord.MessageEmbed({title: `Loading ${gPlayerName}...`})]
        })
        
        // if there's no timeout, the code will keep going without waiting
        //setTimeout(() => { this.sendUserProfile(interaction, gPlayerName) }, 350);
        await this.sendUserProfile(interaction);
    },
    async sendUserProfile(interaction) {
        const jsum = await cache.getProfileByPuuid(gPuuid)
        const jranked = await cache.getRankedEntriesByPuuid(gPuuid)

        const embed = new Discord.MessageEmbed({
            title: jsum.name,
            description: `Level ${jsum.summonerLevel}`,
            thumbnail: api.getProfileIconURL(j.profileIconId)
        })
        for (nb in jranked) {
            embed.addFields({
                name: `Rank - ${actions.getRightQueueName(jranked[nb].queueType)}`,
                value: `${actions.capitalizeFirstLetter(jranked[nb].tier.toLowerCase())} ${jranked[nb].rank} - ${jranked[nb].leaguePoints} LP\n${jranked[nb].wins} wins\n${jranked[nb].losses} losses\n${parseFloat(jranked[nb].wins / (jranked[nb].wins + jranked[nb].losses) * 100).toFixed(2)}% win rate`
            })
        }
        //#endregion

        //#region Création boutons sous embed
        const row = new Discord.MessageActionRow()
            .addComponents(
                this.getRowButtonRefresh(),
                this.getRowButtonMasteries(),
                this.getRowButtonMatches()
            )
        interaction.editReply({
            embeds: [embed],
            components: [row]
        });

        const collector = interaction.channel.createMessageComponentCollector()
        collector.on('collect', (i) => {
            
            if (interaction.user.id === i.user.id) {
                collector.stop()
                switch(i.component.customId) {
                    case this.getCustomIdRefresh():
                        this.refreshUser(interaction)
                        break;
                    case this.getCustomIdMasteries():
                        this.sendTopMasteries(interaction, jsum.id) 
                        break;
                    case this.getCustomIdMatches():
                        this.sendUserMatches(interaction)
                        break;
                }
                if (i.component.customId == this.getCustomIdMasteries()) {
                } else if (i.component.customId == this.getCustomIdMatches()) {
                }
            } else {
                this.sendNotRightUserError(i)
            }
            i.deferUpdate()
        })
    },
    async sendTopMasteries(interaction, userId) {
        const topChamps = []
        fetch(api.getChampionMasteryRequest(gServer, userId))
        .then(res => {
            res.json().then(json => {
                for (i = 0; i <= 24; i++) {
                    if (json[i] == undefined) continue
                    topChamps.push(json[i]);
                }
                var reponse = "";
                for(var champ in topChamps) {
                    if (topChamps[champ] != topChamps[0]) reponse += `\n`;
                    const champName = actions.getChampion(topChamps[champ].championId, 3).name

                    reponse += `**${actions.findChampionEmoji(champName)} ${champName} :** ${actions.getMasteryEmote(topChamps[champ].championLevel)} ${actions.addSeparator(topChamps[champ].championPoints)} pts`
                }
                const embed = new Discord.MessageEmbed()
                    .setTitle(`${gPlayerName}'s top 25 masteries`)
                    .setDescription("Click on the mastery emote if you can't see it well.\n\n" + reponse)

                const row = new Discord.MessageActionRow()
                .addComponents(
                    this.getRowButtonProfile(),
                    this.getRowButtonMatches()
                )

                interaction.editReply({
                    embeds: [embed],
                    components: [row]
                })

                const collector = interaction.channel.createMessageComponentCollector()
                collector.on('collect', (i) => {
                    
                    if (interaction.user.id === i.user.id) {
                        collector.stop()
                        if (i.component.customId == this.getCustomIdProfile()) {
                            this.sendUserProfile(interaction, gPlayerName)
                        } else if (i.component.customId == this.getCustomIdMatches()) {
                            this.sendUserMatches(interaction)
                        }
                    } else {
                        this.sendNotRightUserError(i)
                    }
                    i.deferUpdate()
                })
            })
        })
    },
    async sendUserMatches(interaction){
        fetch(api.getSummonerRequest(gServer, gPlayerName))
        .then(r => {
            r.json().then(j => {
                fetch(api.getRecentMatchesId(gRegion, j.puuid))
                .then(rm => {
                    rm.json().then(jm => {
                        const embed = new Discord.MessageEmbed()
                            .setTitle(`${gPlayerName}'s last matches`)
                            .setThumbnail(api.getProfileIconURL(j.profileIconId))

                        for (m of jm) {
                            if (!cache.isMatchSaved(m)) {
                                fetch(api.getMatchDetails(gRegion, m)).then(r => {
                                    if (r.status != 200) {
                                        console.log(`${r.status} - ${r.statusText}`)
                                    } else {
                                        r.json().then(j => {
                                            cache.saveMatch(j, j["metadata"]["matchId"])
                                        })
                                    }
                                })
                            }
                            const match = cache.getSavedMatch(m)

                            var participants = ""
                            for (var p of match["info"]["participants"]) {
                                participants += actions.findChampionEmoji(p["championName"])
                            }
                            embed.addField(match["metadata"]["matchId"], participants)
                        }

                        const row = new Discord.MessageActionRow()
                            .addComponents(
                                this.getRowButtonProfile(),
                                this.getRowButtonMasteries()
                            )
                        interaction.editReply({
                            embeds: [embed],
                            components: [row]
                        })

                        const collector = interaction.channel.createMessageComponentCollector()
                        collector.on('collect', (i) => {
                            
                            if (interaction.user.id === i.user.id) {
                                collector.stop()
                                if (i.component.customId == this.getCustomIdProfile()) {
                                    this.sendUserProfile(interaction, gPlayerName)
                                } else if (i.component.customId == this.getCustomIdMasteries()) {
                                    this.sendTopMasteries(interaction, j.id)
                                }
                            } else {
                                this.sendNotRightUserError(i)
                            }
                            i.deferUpdate()
                        })
                    })
                })
            })
        })
    },
    async refreshUser(interaction) {
        await interaction.editReply({
            embeds: [new Discord.MessageEmbed({
                title: `Loading user ${gPlayerName}`,
                description: "This may take some seconds"
            })]
        })
        cache.refreshProfileByName(gServer, gPlayerName)
    },
    getRowButtonMasteries(){ // id : masteries
        return new Discord.MessageButton({
            customId: this.getCustomIdMasteries(),
            emoji: e.m7,
            label: 'Check masteries',
            style: 'SECONDARY'
        })
    },
    getRowButtonMatches(){ // id : matches
        return new Discord.MessageButton({
            customId: this.getCustomIdMatches(),
            emoji: '🎮',
            label: 'Check matches',
            style: 'SECONDARY'
        })
    },
    getRowButtonProfile(){ // id : profile
        return new Discord.MessageButton({
            customId: this.getCustomIdProfile(),
            emoji: '🗒️',
            label: 'Check profile',
            style: 'SECONDARY'
        })
    },
    getRowButtonRefresh(){ // id : refresh
        return new Discord.MessageButton({
            customId: this.getCustomIdRefresh(),
            emoji: '🔁',
            label: 'Refresh',
            style: 'SECONDARY'
        })
    },
    getCustomIdMasteries(){
        return "masteries"
    },
    getCustomIdMatches(){
        return "matches"
    },
    getCustomIdProfile(){
        return "profile"
    },
    getCustomIdRefresh(){
        return "refresh"
    },
    sendNotRightUserError(interaction){
        interaction.reply({
            embeds: [
                new Discord.MessageEmbed({
                    title: "Error",
                    description: "You're not the person who used the command.",
                    color: 0xff0000
                })
            ],
            ephemeral: true
        })
    }
}
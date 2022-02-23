const Discord = require('discord.js')
const api = require('../callAPI.js')
const fetch = require('cross-fetch')
const actions = require("../actions.js")
const e = require("../emojis.json")
var gPlayerName = ""

module.exports = {
    name: "player",
    description: "",
    execute(interaction, args) {
        gPlayerName = actions.getPlayerNameFromArgs(args)
        interaction.reply({
            embeds: [new Discord.MessageEmbed().setTitle(`loading **${gPlayerName}**...`).setColor(0xffff00)]
        })
        
        setTimeout(() => { this.sendUserProfile(interaction, gPlayerName) }, 350);
    },
    sendUserProfile(interaction, playerName){
        // summoner request
        fetch(api.getSummonerRequest(playerName))
        .then(r => {
            // check request status
            if (r.status == 200) {
                r.json().then(j => {
                    fetch(api.getRankedEntries(j.id))
                    .then(rRanked => {
                        rRanked.json().then(jRanked => {
                            const embed = new Discord.MessageEmbed()
                                .setTitle(j.name)
                                .setDescription(`Level ${j.summonerLevel}`)
                                .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/${api.getDDragonVersion()}/img/profileicon/${j.profileIconId}.png`)
                            for (nb in jRanked) {
                                embed.addFields({
                                    name: `Rank - ${actions.getRightQueueName(jRanked[nb].queueType)}`,
                                    value: `${actions.capitalizeFirstLetter(jRanked[nb].tier.toLowerCase())} ${jRanked[nb].rank} - ${jRanked[nb].leaguePoints} LP\n${jRanked[nb].wins} wins\n${jRanked[nb].losses} losses\n${parseFloat(jRanked[nb].wins / (jRanked[nb].wins + jRanked[nb].losses) * 100).toFixed(2)}% win rate`
                                })
                            }
                            //#endregion

                            //#region Création boutons sous embed
                            const row = new Discord.MessageActionRow()
                                .addComponents(
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
                                    if (i.component.customId == this.getCustomIdMasteries()) {
                                        this.sendTopMasteries(interaction, j.id) 
                                    } else if (i.component.customId == this.getCustomIdMatches()) {
                                        this.sendUserMatches(interaction)
                                    }
                                } else {
                                    this.sendNotRightUserError(i)
                                }
                                i.deferUpdate()
                            })
                        //#endregion
                        })
                    })
                })
            } else if (r.status == 401 || r.status == 403) {
                actions.ErreurCleAPI(interaction)
            } else {
                interaction.editReply({embeds: [new Discord.MessageEmbed().setTitle(`Le joueur **${playerName}** n'existe pas !`).setColor(0xF00)]})
            }
        })
    },
    sendTopMasteries(interaction, userId) {
        const topChamps = []
        fetch(api.getChampionMasteryRequest(userId))
        .then(res => {
            res.json().then(json => {
                for (i = 0; i <= 24; i++) {
                    if (json[i] == undefined) continue
                    topChamps.push(json[i]);
                }
                var reponse = "";
                for(var champ in topChamps) {
                    if (topChamps[champ] != topChamps[0]) reponse += `\n`;

                    reponse += `**${actions.getChampion(topChamps[champ].championId, 3).name} :** ${actions.getMasteryEmote(topChamps[champ].championLevel)} ${actions.addSeparator(topChamps[champ].championPoints)} pts`
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
    sendUserMatches(interaction){
        fetch(api.getSummonerRequest(gPlayerName))
        .then(r => {
            r.json().then(j => {
                fetch(api.getRecentMatchesId(j.puuid))
                .then(rm => {
                    rm.json().then(jm => {
                        const embed = new Discord.MessageEmbed()
                            .setTitle(`${gPlayerName}'s last matches`)
                            .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/${api.getDDragonVersion()}/img/profileicon/${j.profileIconId}.png`)

                        for (m in jm) {
                            /*fetch(api.getMatchDetails(jm[m])).then(r => {
                                r.json().then(j => {
                                    var champs = ""
                                    for(var u in j.info.participants) {
                                        //champs += e[j.info.participants[u].championName]
                                        champs += e["aatrox"]
                                    }
                                    console.log(champs)
                                    embed.addField(jm[m], champs)
                                })
                            })*/
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
    getRowButtonMasteries(){ // id : masteries
        return new Discord.MessageButton()
            .setCustomId(this.getCustomIdMasteries())
            .setEmoji(e.m7)
            .setLabel('Check masteries')
            .setStyle('SECONDARY')
    },
    getRowButtonMatches(){ // id : matches
        return new Discord.MessageButton()
            .setCustomId(this.getCustomIdMatches())
            .setEmoji('🎮')
            .setLabel('Check matches')
            .setStyle('SECONDARY')
    },
    getRowButtonProfile(){ // id : profile
        return new Discord.MessageButton()
            .setCustomId(this.getCustomIdProfile())
            .setEmoji('🗒️')
            .setLabel('Check profile')
            .setStyle('SECONDARY')
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
    sendNotRightUserError(interaction){
        interaction.reply({
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle("Vous n'êtes pas celui qui a effectué la commande.")
                    .setColor(0xFF0000)
            ],
            ephemeral: true
        })
    }
}
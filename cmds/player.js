const Discord = require('discord.js')
const api = require('../callAPI.js')
const fetch = require('cross-fetch')
const actions = require("../actions.js")
const emojis = require("../emojis.json")
var gPlayerName = ""

module.exports = {
    name: "player",
    description: "",
    execute(interaction, args) {
        gPlayerName = actions.getPlayerNameFromArgs(args)
        interaction.reply({
            embeds: [new Discord.MessageEmbed().setTitle(`loading **${gPlayerName}**...`).setColor(0xffff00)]
        })
        this.sendUserProfile(interaction, gPlayerName)
    },
    sendUserProfile(interaction, playerName){
        // summoner request
        fetch(api.getSummonerRequest(playerName))
        .then(r => {
            // check request status
            if (r.status == 200) {
                r.json().then(j => {
                    fetch(api.getRiotAccountRequest(j.puuid))
                    .then(riotIdRes => {
                        riotIdRes.json()
                        .then(riotIdJson => {
                            const embed = new Discord.MessageEmbed()
                                .setTitle(j.name)
                                .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/${api.getDDragonVersion()}/img/profileicon/${j.profileIconId}.png`)
                                .addFields({
                                        name: "Level",
                                        value: `${j.summonerLevel}`
                                    },{
                                        name: "Game name",
                                        value: `${riotIdJson.gameName}#${riotIdJson.tagLine}`
                                    },{
                                        name: "Last action date",
                                        value: `${new Date(j.revisionDate)}`
                                    }
                                )
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
                interaction.editReply(`Le joueur **${playerName}** n'existe pas !`)
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
                    .setDescription(reponse)

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
        interaction.editReply({
            content: "frero t cringe",
            embeds: [],
            components: []
        })
    },
    getRowButtonMasteries(){ // id : masteries
        return new Discord.MessageButton()
            .setCustomId(this.getCustomIdMasteries())
            .setEmoji(emojis.m7)
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
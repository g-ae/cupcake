const Discord = require('discord.js')
const api = require('../callAPI.js')
const fetch = require('cross-fetch')
const actions = require("../actions.js")
const masteries = require("../emojis/masteries.json")
const ranks = require('../emojis/ranks.json')
const cache = require("../cache")
const { 
    v1: uuidv1
    //,
    //v4: uuidv4,
} = require('uuid');
var gPlayerName = ""
var gServer = ""
var gRegion = ""
var gPuuid = ""
var gId = ""

module.exports = {
    name: "player",
    description: "",
    args: ["region", "name"],
    async execute(interaction, args) {
        gId = uuidv1();
        gPlayerName = ""
        for(const i in args) {
            if (i === "0") gServer = args[i]
            else {
                if (i !== "1") gPlayerName += " "
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
        }

        gServer = api.getRightServer(gServer)
        gPuuid = await cache.getPuuidByName(gServer, gPlayerName)
        if (gPuuid === undefined) {
            await interaction.reply({
                embeds: [new Discord.MessageEmbed({
                    title: "Error",
                    description: `The user **${gPlayerName}** does not exist in ${gServer} !`
                })]
            })
            return
        }
        gRegion = api.getRegionFromServer(gServer)
        console.log(`Loading ${gPlayerName}'s profile`)
        await interaction.reply({
            embeds: [new Discord.MessageEmbed({title: `Loading ${gPlayerName}...`})]
        })
        
        // if there's no timeout, the code will keep going without waiting
        //setTimeout(() => { this.sendUserProfile(interaction, gPlayerName) }, 350);
        await this.sendUserProfile(interaction);
    },
    async sendUserProfile(interaction) {
        const jsum = await cache.getProfileByPuuid(gServer, gPuuid)
        const jranked = await cache.getRankedEntriesByPuuid(gPuuid)

        const embed = new Discord.MessageEmbed({
            title: jsum.name,
            description: `Level ${jsum.summonerLevel}`,
            thumbnail: {
                url: cache.getProfileIconURL(jsum.profileIconId),
            },
            footer: {
                text: `Refreshed ${cache.getRefreshTimeByPuuid(gPuuid)}\nTo refresh, use /refresh command`
            }
        })
        for (let nb in jranked) {
            let rank = jranked[nb]["tier"].toLowerCase()
            embed.addFields({
                name: actions.getRightQueueName(jranked[nb].queueType),
                value: `${ranks[rank]} ${actions.capitalizeFirstLetter(rank)} ${jranked[nb].rank} - ${jranked[nb].leaguePoints} LP\n${jranked[nb].wins} wins\n${jranked[nb].losses} losses\n${parseFloat(jranked[nb].wins / (jranked[nb].wins + jranked[nb].losses) * 100).toFixed(2)}% win rate`,
                inline: true
            })
        }
        //#endregion

        //#region Création boutons sous embed
        await interaction.editReply({
            embeds: [embed],
            components: [
                this.createRow([
                    this.getRowButtonMasteries(),
                    this.getRowButtonMatches()
                ])
            ]
        });

        const collector = interaction.channel.createMessageComponentCollector()
        collector.on('collect', (i) => this.onCollect(interaction, collector, i))
    },
    async sendTopMasteries(interaction) {
        const topChamps = []
        let reponse = "";
        const jMastery = await cache.getMasteryByPuuid(gServer, gPuuid)

        for (let i = 0; i <= 24; i++) {
            if (jMastery[i] === undefined) continue
            topChamps.push(jMastery[i]);
        }
        for(const champ in topChamps) {
            if (champ !== 0) reponse += `\n`;
            const champName = actions.getChampion(topChamps[champ].championId, 3).name

            reponse += `**${actions.findChampionEmoji(champName)} ${champName} :** ${actions.getMasteryEmote(topChamps[champ].championLevel)} ${actions.addSeparator(topChamps[champ].championPoints)} pts`
        }
        const embed = new Discord.MessageEmbed()
            .setTitle(`${gPlayerName}'s top 25 masteries`)
            .setDescription("Click on the mastery emote if you can't see it well.\n\n" + reponse)

        const row = this.createRow([this.getRowButtonProfile(), this.getRowButtonMatches()])

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        })

        const collector = interaction.channel.createMessageComponentCollector()
        collector.on('collect', (i) => this.onCollect(interaction, collector, i))
    },
    async sendUserMatches(interaction){
        fetch(api.getSummonerRequest(gServer, gPlayerName))
        .then(r => {
            r.json().then(j => {
                fetch(api.getRecentMatchesId(gRegion, j.puuid))
                .then(rm => {
                    rm.json().then(async jm => {
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

                            let participants = ""
                            for (const p of match["info"]["participants"]) {
                                participants += actions.findChampionEmoji(p["championName"])
                            }
                            embed.addField(match["metadata"]["matchId"], participants)
                        }

                        const row = actions.createRow([this.getRowButtonProfile(), this.getRowButtonMasteries()])
                        await interaction.editReply({
                            embeds: [embed],
                            components: [row]
                        })

                        const collector = interaction.channel.createMessageComponentCollector()
                        collector.on('collect', (i) => this.onCollect(interaction, collector, i))
                    })
                })
            })
        })
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
    },
    /**
     * 
     * @param {Discord.Interaction} interaction 
     * @param {Discord.Collector} collector
     * @param {Discord.Interaction} i button click interaction
     */
    async onCollect(interaction, collector, i) {
        if (interaction.user.id === i.user.id) {
            collector.stop()
            console.log(i.component.customId)
            console.log(gId)
            if (i.component.customId.startsWith(gId))
            switch(i.component.label)
            {
                case this.getTextProfile():
                    await this.sendUserProfile(interaction)
                    break;
                case this.getTextMasteries():
                    await this.sendTopMasteries(interaction)
                    break;
                case this.getTextMatches():
                    await this.sendUserMatches(interaction)
                    break;
            }
        } else {
            this.sendNotRightUserError(i)
        }
        if (!i.replied) i.deferUpdate()
    },
    getRowButtonMasteries(){ // id : masteries
        return new Discord.MessageButton({
            customId: gId + "masteries",
            emoji: masteries.m7,
            label: 'Check masteries',
            style: 'SECONDARY'
        })
    },
    getRowButtonMatches(){ // id : matches
        return new Discord.MessageButton({
            customId: gId + "matches",
            emoji: '🎮',
            label: 'Check matches',
            style: 'SECONDARY'
        })
    },
    getRowButtonProfile(){ // id : profile
        return new Discord.MessageButton({
            customId: gId + "profile",
            emoji: '🗒️',
            label: 'Check profile',
            style: 'SECONDARY'
        })
    },
    getTextMasteries(){
        return "Check masteries"
    },
    getTextMatches(){
        return "Check matches"
    },
    getTextProfile(){
        return "Check profile"
    },
    /**
    * 
    * @param list list of buttons to put in row
    * @returns {Discord.MessageActionRow}
    */
    createRow(list) {
        const row = new Discord.MessageActionRow()
        for (const button of list) {
            row.addComponents(button)
        }
        return row
    }
}
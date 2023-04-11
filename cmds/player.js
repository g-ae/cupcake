const Discord = require('discord.js')
const api = require('../callAPI.js')
const fetch = require('cross-fetch')
const actions = require("../actions.js")
const masteries = require("../emojis/masteries.json")
const ranks = require('../emojis/ranks.json')
const cache = require("../cache")
const {CPK} = require("../classes")

/*
dans chaque bouton, le customId continet le puuid de l'utilisateur pour éviter le problème:
- si je lance la commande pour l'utilisateur "xdfigados" et je lance une autre commande pour l'utilisateur "xdwejdene",
  quand je clique sur un bouton, les deux commandes vont changer
  évidemment ce que j'ai essayé ne marche pas et c'est pour ça que j'ai abandonné 👍
  -> trouvé problème : c'est les interactions qui sont stockées dans une variable globale
 */

module.exports = {
    name: "player",
    description: "",
    args: ["region", "name"],
    async execute(interaction, args) {
        // Variables
        const cpk = new CPK(interaction)
        let server, playerName = "";

        // Récupérer nom et serveur
        for(const i in args) {
            if (i === "0") server = args[i]
            else {
                if (i !== "1") playerName += " "
                playerName += args[i]
            }
        }
        cpk.playerName = playerName
        
        // Vérifier si serveur correct
        if (!api.verifyServer(api.getRightServer(server))) {
            cpk.delete()
            interaction.reply({
                embeds: [new Discord.MessageEmbed({
                    title: "Error",
                    description: "Server isn't right. Please use one of these :\n" + api.getServers(),
                    color: 0xff0000
                })]
            })
            return
        }

        cpk.server = api.getRightServer(server)
        cpk.playerPuuid = await cache.getPuuidByName(server, playerName)
        if (cpk.playerPuuid === undefined) {
            cpk.delete()
            await interaction.reply({
                embeds: [new Discord.MessageEmbed({
                    title: "Error",
                    description: `The user **${playerName}** does not exist in ${server} !`
                })]
            })
            return
        }
        cpk.region = api.getRegionFromServer(server)
        console.log(`Loading ${playerName}'s profile`)
        await interaction.reply({
            embeds: [new Discord.MessageEmbed({title: `Loading ${playerName}...`})]
        })
        
        // if there's no timeout, the code will keep going without waiting
        //setTimeout(() => { this.sendUserProfile(interaction, gPlayerName) }, 350);
        await this.sendUserProfile(interaction);
    },
    async sendUserProfile(interaction) {
        const cpk = CPK.find(interaction.id)
        const jsum = await cache.getProfileByPuuid(cpk.server, cpk.playerPuuid)
        const jranked = await cache.getRankedEntriesByPuuid(cpk.playerPuuid)

        const embed = new Discord.MessageEmbed({
            title: jsum.name,
            description: `Level ${jsum["summonerLevel"]}`,
            thumbnail: {
                url: cache.getProfileIconURL(jsum["profileIconId"]),
            },
            footer: {
                text: `Refreshed ${cache.getRefreshTimeByPuuid(cpk.playerPuuid)}\nTo refresh, use /refresh command`
            }
        })
        for (let nb in jranked) {
            let rank = jranked[nb]["tier"].toLowerCase()
            embed.addFields({
                name: actions.getRightQueueName(jranked[nb]["queueType"]),
                value: `${ranks[rank]} ${actions.capitalizeFirstLetter(rank)} ${jranked[nb]["rank"]} - ${jranked[nb]["leaguePoints"]} LP\n${jranked[nb]["wins"]} wins\n${jranked[nb]["losses"]} losses\n${parseFloat((parseInt(jranked[nb]["wins"]) / (parseInt(jranked[nb]["wins"]) + parseInt(jranked[nb]["losses"])) * 100).toString()).toFixed(2)}% win rate`,
                inline: true
            })
        }
        //#endregion

        //#region Création boutons sous embed
        await cpk.interaction.editReply({
            embeds: [embed],
            components: [
                this.createRow([
                    this.getRowButtonMasteries(cpk.playerPuuid),
                    this.getRowButtonMatches(cpk.playerPuuid)
                ])
            ]
        });

        const collector = interaction.channel.createMessageComponentCollector()
        collector.on('collect', (i) => this.onCollect(interaction, collector, i))
    },
    async sendTopMasteries(interaction) {
        const cpk = CPK.find(interaction.id)
        const topChamps = []
        let reponse = "";
        const jMastery = await cache.getMasteryByPuuid(cpk.server, cpk.playerPuuid)

        for (let i = 0; i <= 24; i++) {
            if (jMastery[i] === undefined) continue
            topChamps.push(jMastery[i]);
        }
        for(const champ in topChamps) {
            if (champ !== 0) reponse += `\n`;
            const champName = actions.getChampion(topChamps[champ]["championId"], 3).name

            reponse += `**${actions.findChampionEmoji(champName)} ${champName} :** ${actions.getMasteryEmote(topChamps[champ]["championLevel"])} ${actions.addSeparator(topChamps[champ]["championPoints"])} pts`
        }
        const embed = new Discord.MessageEmbed()
            .setTitle(`${cpk.playerName}'s top 25 masteries`)
            .setDescription("Click on the mastery emote if you can't see it well.\n\n" + reponse)

        const row = this.createRow([this.getRowButtonProfile(cpk.playerPuuid), this.getRowButtonMatches(cpk.playerPuuid)])

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        })

        const collector = interaction.channel.createMessageComponentCollector()
        collector.on('collect', (i) => this.onCollect(interaction, collector, i))
    },
    async sendUserMatches(interaction){
        const cpk = CPK.find(interaction.id)
        const sum = await cache.getProfileByPuuid(cpk.server, cpk.playerPuuid)
        const matches = await cache.getLastMatchesByPuuid(cpk.playerPuuid)

        const embed = new Discord.MessageEmbed()
            .setTitle(`${sum["name"]}'s last matches`)
            .setThumbnail(cache.getProfileIconURL(sum["profileIconId"]))

        for (const m of matches) {
            if (!cache.isMatchSaved(m)) {
                const r = await fetch(api.getMatchDetails(cpk.region, m))
                if (parseInt(r.status) !== 200) {
                    console.log(`${r.status} - ${r.statusText} when saving match ${m}`)
                } else {
                    const j = await r.json()
                    cache.saveMatch(j, j["metadata"]["matchId"])
                }
            }
            const match = cache.getSavedMatch(m)

            let participants = ""
            for (const p of match["info"]["participants"]) {
                participants += actions.findChampionEmoji(p["championName"])
            }
            embed.addField(match["metadata"]["matchId"], participants)
        }

        const row = this.createRow([this.getRowButtonProfile(cpk.playerPuuid), this.getRowButtonMasteries(cpk.playerPuuid)])
        await interaction.editReply({
            embeds: [embed],
            components: [row]
        })

        const collector = interaction.channel.createMessageComponentCollector()
        collector.on('collect', (i) => this.onCollect(interaction, collector, i))
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
            const cpk = CPK.find(interaction.id)
            collector.stop()
            console.log(i.component.customId)
            if (i.component.customId.endsWith(cpk.playerPuuid))
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
        if (!i.replied) await i.deferUpdate()
    },
    getRowButtonMasteries(puuid){ // id : masteries
        return new Discord.MessageButton({
            customId: "masteries" + puuid,
            emoji: masteries.m7,
            label: 'Check masteries',
            style: 'SECONDARY'
        })
    },
    getRowButtonMatches(puuid){ // id : matches
        return new Discord.MessageButton({
            customId: "matches" + puuid,
            emoji: '🎮',
            label: 'Check matches',
            style: 'SECONDARY'
        })
    },
    getRowButtonProfile(puuid){ // id : profile
        return new Discord.MessageButton({
            customId: "profile" + puuid,
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
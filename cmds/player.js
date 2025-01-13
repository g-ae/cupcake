const Discord = require("discord.js");
const api = require("../callAPI.js");
const fetch = require("cross-fetch");
const actions = require("../actions.js");
const masteries = require("../emojis/masteries.json");
const ranks = require("../emojis/ranks.json");
const cache = require("../cache");
const { CPK } = require("../classes");

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
    const cpk = new CPK(interaction);

    // Récupérer nom et serveur
    let server = args[0];
    let playerName = args[1];
    cpk.playerName = playerName;

    // Vérifier si serveur correct
    if (!api.verifyServer(api.getRightServer(server))) {
      cpk.delete();
      interaction.reply({
        embeds: [
          new Discord.MessageEmbed({
            title: "Error",
            description:
              "Server isn't right. Please use one of these :\n" +
              api.getServers(),
            color: 0xff0000,
          }),
        ],
      });
      return;
    }
    server = api.getRightServer(server);

    cpk.server = api.getRightServer(server);
    cpk.playerPuuid = await cache.getPuuidByName(server, playerName);
    if (cpk.playerPuuid === undefined) {
      cpk.delete();
      await interaction.reply({
        embeds: [
          new Discord.MessageEmbed({
            title: "Error",
            description: `The user **${playerName}** does not exist in ${server} !`,
          }),
        ],
      });
      return;
    }
    cpk.region = api.getRegionFromServer(server.toLowerCase());
    console.log(`Loading ${playerName}'s profile`);
    await interaction.reply({
      embeds: [new Discord.MessageEmbed({ title: `Loading ${playerName}...` })],
    });

    // if there's no timeout, the code will keep going without waiting
    //setTimeout(() => { this.sendUserProfile(interaction, gPlayerName) }, 350);
    await this.sendUserProfile(interaction);
  },
  /**
   *
   * @param {Discord.Interaction} interaction
   */
  async sendUserProfile(interaction) {
    const cpk = CPK.find(interaction.id);
    const jsum = await cache.getProfileByPuuid(cpk.server, cpk.playerPuuid);
    const jranked = await cache.getRankedEntriesByPuuid(cpk.playerPuuid);

    const embed = new Discord.MessageEmbed({
      title: jsum.name,
      description: `Level ${jsum["summonerLevel"]}\nRegion ${jsum[
        "server"
      ].toUpperCase()}`,
      thumbnail: {
        url: cache.getProfileIconURL(jsum["profileIconId"]),
      },
      footer: {
        text: `Refreshed ${cache.getRefreshTimeByPuuid(
          cpk.playerPuuid
        )}\nTo refresh, use /refresh command`,
      },
    });
    if (jranked.length === 0)
      embed.addField(
        "No information available",
        "This user is currently not ranked"
      );
    for (let nb in jranked) {
      try {
        let rank = jranked[nb]["tier"].toLowerCase();
        embed.addFields({
          name: actions.getRightQueueName(jranked[nb]["queueType"]),
          value: `${ranks[rank]} ${actions.capitalizeFirstLetter(rank)} ${
            jranked[nb]["rank"]
          } - ${jranked[nb]["leaguePoints"]} LP\n${jranked[nb]["wins"]} wins\n${
            jranked[nb]["losses"]
          } losses\n${parseFloat(
            (
              (parseInt(jranked[nb]["wins"]) /
                (parseInt(jranked[nb]["wins"]) +
                  parseInt(jranked[nb]["losses"]))) *
              100
            ).toString()
          ).toFixed(2)}% win rate`,
          inline: true,
        });
      } catch (e) {}
    }
    //#endregion

    //#region Création boutons sous embed
    await cpk.interaction.editReply({
      embeds: [embed],
      components: [
        this.createRow([
          this.getRowButtonMasteries(interaction.id),
          this.getRowButtonMatches(interaction.id),
        ]),
      ],
    });

    const collector = interaction.channel.createMessageComponentCollector();
    collector.on("collect", (i) => this.onCollect(interaction, collector, i));
  },
  /**
   *
   * @param {Discord.Interaction} interaction
   */
  async sendTopMasteries(interaction) {
    const cpk = CPK.find(interaction.id);
    let r = "";
    const jMastery = await cache.getMasteryByPuuid(cpk.server, cpk.playerPuuid);
    if (jMastery.length === 0) r += "No champion masteries.";
    else
      for (const champ in jMastery) {
        if (champ !== 0) r += `\n`;
        const champName = actions.getChampion(
          jMastery[champ]["championId"],
          3
        ).name;

        r += `**${actions.findChampionEmoji(
          champName
        )} ${champName} :** ${actions.getMasteryEmote(
          jMastery[champ]["championLevel"]
        )} ${actions.addSeparator(jMastery[champ]["championPoints"])} pts`;
      }
    const embed = new Discord.MessageEmbed()
      .setTitle(`${cpk.playerName}'s top masteries`)
      .setDescription(
        "Click on the mastery emote if you can't see it well.\n\n" + r
      );

    const row = this.createRow([
      this.getRowButtonProfile(interaction.id),
      this.getRowButtonMatches(interaction.id),
    ]);

    try {
      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (e) {
      // Send error message => Interaction too old
      interaction.channel.send(
        {
          embeds: [
            new Discord.MessageEmbed()
              .setTitle("Error")
              .setDescription(
                "This action is too outdated, please do the command again."
              )
              .setColor(0xff0000),
          ],
        },
        (ephemeral = true)
      );
      console.log("Error, interaction too old." + interaction.guild.name);
    }

    const collector = interaction.channel.createMessageComponentCollector();
    collector.on("collect", (i) => this.onCollect(interaction, collector, i));
  },
  /**
   *
   * @param {Discord.Interaction} interaction
   */
  async sendUserMatches(interaction) {
    const cpk = CPK.find(interaction.id);
    const sum = await cache.getProfileByPuuid(cpk.server, cpk.playerPuuid);
    const matches = await cache.getLastMatchesByPuuid(cpk.playerPuuid);

    const embed = new Discord.MessageEmbed()
      .setTitle(`${sum["name"]}'s last matches`)
      .setThumbnail(cache.getProfileIconURL(sum["profileIconId"]));

    for (const m of matches) {
      if (!cache.isMatchSaved(m)) {
        const r = await fetch(api.getMatchDetails(cpk.region, m));
        if (parseInt(r.status) !== 200) {
          console.error(`${r.status} - ${r.statusText} when saving match ${m}`);
        } else {
          const j = await r.json();
          cache.saveMatch(j, j["metadata"]["matchId"]);
        }
      }
      const match = cache.getSavedMatch(m);

      let participants = "";
      for (const p of match["info"]["participants"]) {
        participants += actions.findChampionEmoji(p["championName"]);
      }
      embed.addField(match["metadata"]["matchId"], participants);
    }

    const row = this.createRow([
      this.getRowButtonProfile(interaction.id),
      this.getRowButtonMasteries(interaction.id),
    ]);
    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector();
    collector.on("collect", (i) => this.onCollect(interaction, collector, i));
  },
  sendNotRightUserError(interaction) {
    interaction.reply({
      embeds: [
        new Discord.MessageEmbed({
          title: "Error",
          description: "You're not the person who used the command.",
          color: 0xff0000,
        }),
      ],
      ephemeral: true,
    });
  },
  /**
   *
   * @param {Discord.Interaction} interaction base interaction
   * @param {Discord.Collector} collector
   * @param {Discord.Interaction} i button click interaction
   */
  async onCollect(interaction, collector, i) {
    if (interaction.user.id === i.user.id) {
      const cpk = CPK.find(interaction.id);
      collector.stop();
      try {
        if (!i.replied) await i.deferUpdate();
      } catch (e) {
        console.error("Error during deferUpdate")
        e.printStackTrace()
      }
      if (i.component.customId.endsWith(interaction.id))
        switch (i.component.label) {
          case this.getTextProfile():
            await this.sendUserProfile(interaction);
            break;
          case this.getTextMasteries():
            await this.sendTopMasteries(interaction);
            break;
          case this.getTextMatches():
            await this.sendUserMatches(interaction);
            break;
        }
    } else {
      this.sendNotRightUserError(i);
    }
  },
  getRowButtonMasteries(iid) {
    // id : masteries
    return new Discord.MessageButton({
      customId: "masteries" + iid,
      emoji: masteries.m7,
      label: "Check masteries",
      style: "SECONDARY",
    });
  },
  getRowButtonMatches(iid) {
    // id : matches
    return new Discord.MessageButton({
      customId: "matches" + iid,
      emoji: "🎮",
      label: "Check matches",
      style: "SECONDARY",
    });
  },
  getRowButtonProfile(iid) {
    // id : profile
    return new Discord.MessageButton({
      customId: "profile" + iid,
      emoji: "🗒️",
      label: "Check profile",
      style: "SECONDARY",
    });
  },
  getTextMasteries() {
    return "Check masteries";
  },
  getTextMatches() {
    return "Check matches";
  },
  getTextProfile() {
    return "Check profile";
  },
  /**
   *
   * @param list list of buttons to put in row
   * @returns {Discord.MessageActionRow}
   */
  createRow(list) {
    const row = new Discord.MessageActionRow();
    for (const button of list) {
      row.addComponents(button);
    }
    return row;
  },
};

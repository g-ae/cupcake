const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders')
require("dotenv").config()

const playerName = new SlashCommandStringOption()
    .setName("name")
    .setDescription('Name of the player to check')
    .setRequired(true);

const championName = new SlashCommandStringOption()
    .setName("name")
    .setDescription('Name of the champion to search')
    .setRequired(true);

const commands = [
    new SlashCommandBuilder().setName('player').setDescription('Check a player\'s stats !').addStringOption(playerName),
    new SlashCommandBuilder().setName('champion').setDescription('Get champion info.').addStringOption(championName),
    new SlashCommandBuilder().setName('puuid').setDescription('Get user PUUID').addStringOption(playerName)
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands("921025353718308904", "752981309697032262"), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
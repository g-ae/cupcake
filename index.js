const Discord = require("discord.js");          // librairie discord.js
const fs = require('fs')                        // filestream -> recherche, modification, lecture de fichiers
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS, 
        Discord.Intents.FLAGS.GUILD_MEMBERS, 
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});            // bot
client.commands = new Discord.Collection();     // collection de commandes
require('colors');               // couleurs dans le terminal
const api = require('./callAPI');
require("dotenv").config();

// recherche de commandes dans ./cmds/
const commandFiles = fs.readdirSync('./cmds/').filter(file => file.endsWith('.js'));

client.on('ready', () => {
    console.log('\nBOT => connected'.green);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (!client.commands.has(commandName)) return;
    try {
        client.commands.get(commandName).execute(interaction, [ interaction.options.get("name").value ]);
    } catch(error) {
        console.error(error);
        interaction.reply('an error has occured, contact an admin', {ephemeral: true});
    }
})

api.fetchDDragonVersion()
api.setupAllChamps()

// Recherche de commandes dans le dossier cmds
for (const file of commandFiles){
    try{
        const command = require(`./cmds/${file}`);
        client.commands.set(command.name, command);
        for(alias in command.alias) {
            client.commands.set(command.alias[alias], command);
        }
        console.log(`CMD => ${file} success`.green);
    } catch(error) {
        console.log(`ERR => ${file} error`.red + "\nERREUR:\n" + error);
    }
}

client.login(process.env.TOKEN);
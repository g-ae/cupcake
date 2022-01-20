const Discord = require("discord.js");          // librairie discord.js
const config = require("./config.json");        // fichier config
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
const info = require('./getinfojson.js');       // recherche prefix à l'aide de la méthode info.getPrefix(guild)
const api = require('./callAPI');
var prefix = '';                                // prefix à modifier
require("dotenv").config();
require("./deploy-commands.js")

// recherche de commandes dans ./cmds/
const commandFiles = fs.readdirSync('./cmds/').filter(file => file.endsWith('.js'));

client.on('ready', () => {
    console.log('\nBOT => connecté'.green);
    console.log(`version : `.green + `${config.VERSION}`.red);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (!client.commands.has(commandName)) return;
    try {
        client.commands.get(commandName).execute(interaction, [ interaction.options.get("name").value ]);
    } catch(error) {
        console.error(error);
        interaction.reply('petit soucis wesh <@216308428828704769>');
    }
})

client.on("messageCreate", function(message) {
    if (message.author.bot) return;

    prefix = info.getPrefix(message.guild);

    if (message.mentions.has(client.user)){
        message.channel.send(`${prefix}help`);
    }

    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) return;
    try {
        client.commands.get(command).execute(message, args);
    } catch(error) {
        console.error(error);
        message.reply('la commande n\'a pas pu être executée. Désolé !');
    }
});

/*
client.on("messageDelete", function(message) {
    message.channel.send(`DELETED : ${message}`);
})
*/

client.login(process.env.TOKEN);

api.getAllChamps();
api.fetchDDragonVersion();

// Recherche de commandes dans le dossier cmds
for (const file of commandFiles){
    try{
        const command = require(`./cmds/${file}`);
        client.commands.set(command.name, command);
        for(alias in command.alias) {
            client.commands.set(command.alias[alias], command);
        }
        console.log(`CMD => ${file} chargé`.green);
    } catch(error) {
        console.log(`ERR => ${file} non chargé`.red + "\nERREUR:\n" + error);
    }
}
const Discord = require("discord.js");          // librairie discord.js
const fs = require('fs');                        // filestream -> recherche, modification, lecture de fichiers
const cache = require('./cache')
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS, 
        Discord.Intents.FLAGS.GUILD_MEMBERS, 
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
});            // bot
client.commands = new Discord.Collection();     // collection de commandes
require('colors');               // couleurs dans le terminal
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
        var options = []
        for (var arg of client.commands.get(commandName).args) options.push(interaction.options.get(arg).value)
        client.commands.get(commandName).execute(interaction, options);
    } catch(error) {
        const embedError = new Discord.MessageEmbed()
            .setTitle('An error has occured, contact an admin')
            .setColor(0xff0000)
        try {
            interaction.reply({ embeds: [ embedError ] });
        }
        catch(err) {
            interaction.editReply({ embeds: [ embedError ] });
        }
    }
})

cache.setup(() => {
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
})

client.login(process.env.TOKEN);
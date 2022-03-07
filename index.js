const Discord = require("discord.js");
const fs = require('fs');
const { exit } = require("process");
const cache = require('./cache')
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS, 
        Discord.Intents.FLAGS.GUILD_MEMBERS, 
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
});
client.commands = new Discord.Collection();
require('colors');              // colors on console
require("dotenv").config();

// looking for all commands on ./cmds/
const commandFiles = fs.readdirSync('./cmds/').filter(file => file.endsWith('.js'));

client.on('ready', () => {
    console.log('\nBOT => connected'.green);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        if (!client.commands.has(commandName)) return;
        try {
            var options = []
            for (let arg of client.commands.get(commandName).args) options.push(interaction.options.get(arg).value)
            await client.commands.get(commandName).execute(interaction, options);
        } catch(error) {
            const embedError = new Discord.MessageEmbed()
                .setTitle('An error has occured, contact an admin')
                .setColor(0xff0000)

            if (!interaction.replied) interaction.reply({ embeds: [ embedError ] })
            else interaction.editReply({ embeds: [ embedError ] })
        }
    } else if (interaction.isButton()) {
        console.log(interaction.customId)
    }
})

cache.setup(() => {
    // setting all commands in the command collection
    for (const file of commandFiles){
        try{
            const command = require(`./cmds/${file}`);
            client.commands.set(command.name, command);
            for(alias in command.alias) {
                client.commands.set(command.alias[alias], command);
            }
            console.log(`CMD => ${file} success`.green);
        } catch(error) {
            console.log(`ERR => ${file} error`.red + "\ERR:\n" + error);
        }
    }
})

client.login(process.env.TOKEN);
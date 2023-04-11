const Discord = require("discord.js");
const fs = require('fs');
const path = require('path')
var cache;
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
    console.log('BOT => connected'.green);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        if (!client.commands.has(commandName)) return;
        try {
            let options = []
            for (let arg of client.commands.get(commandName).args) options.push(interaction.options.get(arg).value)
            await client.commands.get(commandName).execute(interaction, options);
        } catch(error) {
            console.log("Erreur : ".red)
            console.log(error)
            const embedError = new Discord.MessageEmbed()
                .setTitle('An error has occured, contact an admin')
                .setColor(0xff0000)

            if (!interaction.replied) await interaction.reply({ embeds: [ embedError ] })
            else await interaction.editReply({ embeds: [ embedError ] })
        }
    } else if (interaction.isButton()) {
        console.log("button pressed")
    }
})

async function setup() {
    if (!fs.existsSync('./data/') || !fs.existsSync('./data/champions.json')) {
        await fs.promises.mkdir('./data/')
        await fs.promises.writeFile(path.resolve(`./data/`, `champions.json`), JSON.stringify({
            "data": {}
        }))
    }
    cache = require('./cache');
    await cache.setup();
    for (const file of commandFiles){
        try{
            const command = require(`./cmds/${file}`);
            client.commands.set(command.name, command);
            for(const alias in command.alias) {
                client.commands.set(command.alias[alias], command);
            }
        } catch(error) {
            console.log(`ERROR: ${file} error :`.red + error);
        }
    }
}

setup();
client.login(process.env.TOKEN);
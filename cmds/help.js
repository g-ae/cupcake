const Discord = require("discord.js");
const fs = require('fs');
const info = require('../getinfojson.js');

module.exports = {
    name: 'help',
    description: 'Aide de la commande spécifiée ou toutes les commandes',
    alias: [],
    execute(message, args){
        /*
        if (args.length == 0){

            const embed = new Discord.MessageEmbed();
            const commandFiles = fs.readdirSync('./').filter(file => file.endsWith('.js'));

            embed.setTitle(`❗ Aide`);
            embed.setDescription('Commandes actuellement disponibles');
            embed.setColor(0x00ffff);
            embed.setFooter(`${message.author.tag}`, message.author.avatarURL());
            embed.setTimestamp(Date.now());

            for (const file of commandFiles){
                const command = require(`./${file}`);
                if (command.description == "" || command.description == null) {
                    if (command.name == undefined) {
                        embed.addField(`${file} - indisponible`, "Description indisponible");
                    } else {
                        embed.addField(`${info.getPrefix(message.guild)}${command.name}`, "Description indisponible");
                    }
                } else {
                    embed.addField(`${info.getPrefix(message.guild)}${command.name}`, `${command.description}`);
                }
            }

            message.channel.send(embed)
        } else {
            message.channel.send(`Usage : ${info.getPrefix(message.guild)}help`)
        }
        */
    }
};
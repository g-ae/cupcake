const fs = require('fs');
const path = require('path');
const config = require('./config.json')

module.exports = {
    getPrefix(guild) {
        let prefixChoisi = "";
        if (fs.existsSync(`./guilds/${guild.id}.json`)){
            let rawdata = fs.readFileSync(path.resolve(`./guilds/${guild.id}.json`));
            let info = JSON.parse(rawdata);
            prefixChoisi = info.PREFIX;
        } else {
            prefixChoisi = config.PREFIX;
            this.modifierPrefix(guild, prefixChoisi);
        }
        return prefixChoisi;
    },
    modifierPrefix(guild, prefix) {
        var info = {
            PREFIX: prefix,
            GUILD_ID: guild.id
        }
        fs.writeFileSync(path.resolve(`./guilds/`, `${guild.id}.json`), JSON.stringify(info));
    }
}
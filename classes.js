class CPK {
    // Static
    /** @type {Array<CPK>} */
    static _list = []

    static find(interaction_id) {
        return this._list.find(cpk => cpk.interaction.id == interaction_id)
    }

    // Other
    constructor(interaction) {
        this.interaction = interaction;

        CPK._list.push(this)
    }

    delete() {
        CPK._list.splice(CPK._list.indexOf(this), 1)
    }

    get playerName() {
        return this._playerName
    }
    set playerName(value) {
        this._playerName = value
    }
    get playerPuuid() {
        return this._playerPuuid
    }
    set playerPuuid(value) {
        this._playerPuuid = value
    }
    get server() {
        return this._server
    }
    set server(value) {
        this._server = value
    }
    get region() {
        return this._region
    }
    set region(value) {
        this._region = value
    }
}

module.exports = { CPK }
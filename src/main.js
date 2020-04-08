const Discord = require("discord.js"),
      fs = require("fs"),
      log4js = require("log4js")

log4js.configure({
    appenders: {
        file: { type: "dateFile", filename: "../logs/log", alwaysIncludePattern: true, backups: 31, compress: true },
        out: { type: "console" },
    }, categories: {
        default: { appenders: ["file", "out"], level: "debug" }
    }
})

const Logger = log4js.getLogger("main")

if(!fs.existsSync("./data/config.json")) {
    Logger.error("Config does not exist!")
    return 0
}

global.config = require("./data/config.json")

/** @type{Discord.Client[]} */
const clients = []

const { handleMessage, checkClient } = require("./rickroll")
Object.values(global.config.tokens).forEach(token => {
    const client = new Discord.Client()
    client.on("ready", () => {
        Logger.info(`${client.user.username} is ready!`)
        checkClient(client)
    })
    client.login(token)
    clients.push(client)
})


clients[0].on("message", async (message) => {
    if(message.author.bot) return
    handleMessage(clients, message)
})

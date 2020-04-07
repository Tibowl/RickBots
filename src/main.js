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

const clients = []

const lyrics         = JSON.parse(fs.readFileSync("./data/song.json").toString())
Object.values(global.config.tokens).forEach(token => {
    const client = new Discord.Client()
    client.on("ready", () => {
        Logger.info(`${client.user.username} is ready!`)

        for (const {text} of lyrics)
            if(text.startsWith(client.user.username)) {
                client.user.setActivity(text.substring(client.user.username.length), {type: "PLAYING"})
                break
            }
    })
    client.login(token)
    clients.push(client)
})

const { rickRoll } = require("./rickroll")

clients[0].on("message", async (message) => {
    if(message.author.bot) return

    if(message.content == "never gonna give you up") {
        Logger.info(`${message.author.tag}: ${message.content}`)
        rickRoll(clients)
        return
    }

    if(message.content == "never gonna shutdown") {
        Logger.info(`${message.author.tag}: ${message.content}`)
        clients.forEach(client =>
            setTimeout(() => {
                client.destroy()
            }, Math.random() * 3000))

        setTimeout(() => {
            process.exit()
        }, 5000)
        return
    }
})

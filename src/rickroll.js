// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js"),
      fs      = require("fs-extra"),
      log4js  = require("log4js")

const Logger = log4js.getLogger("rickroll")

const textChannelID  = "696453417278898248"
const voiceChannelID = "694925534798282943"
const lyrics         = JSON.parse(fs.readFileSync("./data/song.json").toString())

let isPlaying = false
/**
 *  Start the rick roll
 *
 * @param {Discord.Client[]} clients List of logged in clients
 */
async function rickRoll(clients) {
    if(isPlaying) return
    isPlaying = true

    const voiceClients = await Promise.all(clients.map(client => client.voice.joinChannel(client.channels.get(voiceChannelID))))

    Logger.info("----- starting -----")
    let totalDuration = 0
    for (const {text, duration, id} of lyrics) {
        const clientID = clients.findIndex(k => text.startsWith(k.user.username))

        if(duration == null) continue

        setTimeout(() => {
            if(clientID >= 0) {
                const client = clients[clientID]

                Logger.info(`${client.user.username}: ${text} (${duration}) playing #${id}`)

                if(id != undefined)
                    voiceClients[clientID].playFile(`./data/song/${id}.mp3`, {seek: 0, passes: 4})

                client.channels.get(textChannelID).send(text.substring(client.user.username.length))
            } else if (id != undefined) {
                Logger.info(`Misc bot: ${duration} #${id}`)
                voiceClients[0].playFile(`./data/song/${id}.mp3`, {seek: 0, passes: 4})
            }
        }, totalDuration)

        totalDuration += duration
    }

    setTimeout(() => {
        voiceClients.forEach(c => c.disconnect())
        isPlaying = false
    }, totalDuration + 1000)
}

/**
 * Set activity of a client
 *
 * @param {Discord.Client} client Client to check
 */
async function checkClient(client) {
    for (const {text} of lyrics)
        if(text.startsWith(client.user.username)) {
            client.user.setActivity(text.substring(client.user.username.length), {type: "PLAYING"})
            break
        }
}

/**
 * Handle a message
 *
 * @param {Discord.Client[]} clients List of logged in clients
 * @param {Discord.Message} message Message to check
 */
async function handleMessage(clients, message) {
    if(message.content == "never gonna give you up") {
        Logger.info(`${message.author.tag}: ${message.content}`)
        return rickRoll(clients)
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

    const lineID = lyrics.findIndex(l => l.text == message.content)
    if(lineID < 0 || isPlaying || message.content == "") return
    const line = lyrics[lineID]

    const clientID = clients.findIndex(k => line.text.startsWith(k.user.username))
    if(clientID < 0) return

    Logger.info(`${message.author.tag}: ${message.content} -> ${lineID} by ${clientID}`)

    isPlaying = true
    const client = clients[clientID]
    const voice = await client.voice.joinChannel(client.channels.get(voiceChannelID))
    voice.playFile(`./data/song/${lineID}.mp3`, {seek: 0, passes: 4})

    setTimeout(() => {
        voice.disconnect()
        isPlaying = false
    }, line.duration + 1000)
}
module.exports = { rickRoll, handleMessage, checkClient }

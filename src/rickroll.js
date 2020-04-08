// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js"),
      fs      = require("fs-extra"),
      log4js  = require("log4js")

const Logger = log4js.getLogger("rickroll")

const textChannelID  = "696453417278898248"
const voiceChannelID = "694925534798282943"
const lyrics         = JSON.parse(fs.readFileSync("./data/song.json").toString())

let isPlayingSong = false, linesPlaying = 0
/**
 *  Start the rick roll
 *
 * @param {Discord.Client[]} clients List of logged in clients
 */
async function rickRoll(clients, channel = voiceChannelID) {
    if(isPlayingSong || linesPlaying > 0) return
    isPlayingSong = true

    try {
        const vc = clients.map(client => client.voice.joinChannel(client.channels.get(channel)))
        const voiceClients = await Promise.all(vc)

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
            isPlayingSong = false
        }, totalDuration + 1000)
    } catch (error) {
        Logger.error(error)

        // eslint-disable-next-line require-atomic-updates
        isPlayingSong = false
    }
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
    let channel = voiceChannelID
    if(message.member && message.member.voiceChannelID)
        channel = message.member.voiceChannelID

    if(message.content == "never gonna give you up") {
        Logger.info(`${message.author.tag}: ${message.content}`)
        return rickRoll(clients, channel)
    }

    if(message.content == "never gonna shutdown" && message.author.id == "127393188729192448") {
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
    if(lineID < 0 || isPlayingSong || message.content == "") return
    const line = lyrics[lineID]

    const clientID = clients.findIndex(k => line.text.startsWith(k.user.username))
    if(clientID < 0) return

    Logger.info(`${message.author.tag}: ${message.content} -> ${lineID} by ${clientID}`)

    linesPlaying++
    try {
        const client = clients[clientID]
        const voice = await client.voice.joinChannel(client.channels.get(channel))
        voice.playFile(`./data/song/${lineID}.mp3`, {seek: 0, passes: 4})

        setTimeout(() => {
            linesPlaying--
            voice.disconnect()
        }, line.duration + 1000)
    } catch (error) {
        Logger.error(error)
        linesPlaying--
    }
}
module.exports = { rickRoll, handleMessage, checkClient }

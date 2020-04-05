const Discord = require("discord.js"),
      fs      = require("fs-extra"),
      log4js  = require("log4js")

const Logger = log4js.getLogger("rickroll")

const textChannelID  = "696453417278898248"
const voiceChannelID = "694925534798282943"
const lyrics         = JSON.parse(fs.readFileSync("./data/song.json").toString())

let playing = false
/**
 *  Start the rick roll
 *
 * @param {Discord.Client[]} clients
 */
async function rickRoll(clients) {
    if(playing) return
    playing = true

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
        playing = false
    }, totalDuration + 1000)
}

module.exports = { rickRoll }

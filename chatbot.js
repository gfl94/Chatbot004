import 'dotenv/config.js'

import {
	WechatyBuilder,
	ScanStatus,
	log,
}                     from 'wechaty'
import qrcodeTerminal from 'qrcode-terminal'
import { ChatGPTAPI } from 'chatgpt'

import { Configuration, OpenAIApi } from "openai";

const api_key = process.env.OPENAI_API_KEY

const configuration = new Configuration({
	apiKey: api_key
});
const openai = new OpenAIApi(configuration);

const api = new ChatGPTAPI({
	apiKey: api_key
})

const res = await api.sendMessage('Hello World!')
console.log(res.text)


const default_magic_word = "chatbot"
var magic_word = default_magic_word
var admin_username = ""
function update_magic_word(new_magic_word) {
   log.info(`update magic word from ${magic_word} to ${new_magic_word}`)
   log.info(`word type ${typeof(new_magic_word)}`)
   magic_word = new_magic_word
}
function update_admin_user(username) {
    log.info("admin user %s", username)
    admin_username = username
}
function is_admin_user(username) {
    return username == admin_username
}

function onScan (qrcode, status) {
	if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
		qrcodeTerminal.generate(qrcode, { small: true })  // show qrcode on console

		const qrcodeImageUrl = [
			'https://wechaty.js.org/qrcode/',
			encodeURIComponent(qrcode),
		].join('')

		log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

	} else {
		log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
	}
}

function onLogin (user) {
    update_magic_word(user.name() + "-chatbot")
    update_admin_user(user.name())
	log.info('StarterBot', '%s login', user)
}

function onLogout (user) {
	log.info('StarterBot', '%s logout', user)
}

async function onMessage (msg) {
	log.info('StarterBot onMessage', msg.toString())

	if (msg.text() === 'ding') {
        log.info("send_back dong")
		await msg.say('dong')
    } else if (msg.text() == "debug" ) {
        const res = "magic word: " + magic_word + "\nadmin user: " + admin_username;
        log.info(res)
        await msg.say(res)
    }
    else if (is_admin_user(msg.talker().name()) && msg.text().includes("change magic word ")) {
        const new_magic_word = msg.text().replace("change magic word ", "")
        update_magic_word(new_magic_word)
        const response = "updated magic word to " + new_magic_word
        log.info("send_back " + response)
        await msg.say(response)
    }
   else if (msg.text().includes(magic_word)) {
		//const response = await sendMessageToOpenAI(msg.text());
		const response = await sendMessageToChatGPT(generatePrompt(msg.text().replace(magic_word, "")))
        log.info("send_back " + response)
		await msg.say(response + "\n from ChatGPT")
	}
}

function generatePrompt(message) {
	return message
}

async function sendMessageToChatGPT(msg){
	const res = await api.sendMessage(msg)
	return res.text
}

async function sendMessageToOpenAI(msg){
	try {
		const completion = await openai.createCompletion({
			model: "text-davinci-003",
			prompt: generatePrompt(msg),
			temperature: 0,
			max_token:4096
		});
		console.log(completion.data.choices[0]);
		return completion.data.choices[0].text;
	} catch(error) {
		if (error.response) return `Error with OpenAI API request failed with status code ${error.response.status}, data ${error.response.data}`;
		else return `Error with OpenAI API request: ${error.message}`;
	}
}

const bot = WechatyBuilder.build({
	name: 'chatbot',
})

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)

bot.start()
	.then(() => log.info('StarterBot', 'Starter Bot Started.'))
	.catch(e => log.error('StarterBot', e))

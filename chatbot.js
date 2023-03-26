import 'dotenv/config.js'

import {
	WechatyBuilder,
	ScanStatus,
	log,
}                     from 'wechaty'
import qrcodeTerminal from 'qrcode-terminal'
import { ChatGPTAPI } from 'chatgpt'
import { Configuration, OpenAIApi } from "openai";
import fs from 'fs';

const api_key = process.env.OPENAI_API_KEY

const api = new ChatGPTAPI({
	apiKey: api_key
})

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
    log.info(`onMessage [${msg.id}] msg ${msg.toString()}`);
    const roomName = await msg.room()?.topic();

    if (msg.text() === 'ding') {
        log.info("send_back dong")
        await msg.say('dong')
    } else if (msg.text() == "debug" && is_admin_user(msg.talker().name()) ) {
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
        const response = await sendMessageToChatGPT(generatePrompt(msg.text().replace(magic_word, "")))
        log.info("send_back " + response)
        await msg.say(response + "\n from ChatGPT")
    } else if (roomName == "ChatGPT语音测试" && msg.type() == bot.Message.Type.Audio) {
        const fileBox = await msg.toFileBox();
        const fileName =  "voice_tmp/" + fileBox.name;
        if (fs.existsSync(fileName)) {
            log.info(`[${msg.id}][onVoice] voice file already exists, skip`);
            return;
        }
        await fileBox.toFile( fileName, true);
        const readStream = await fs.createReadStream(`${fileName}`);
        const response = await openai.createTranscription(
            readStream,
            "whisper-1"
        );
        if (response.data.text != undefined) {
            const sentence = response.data.text;

            if (sentence.includes("笨笨") || sentence.includes("本本") ) {
                var words = sentence.replace("笨笨", "").replace("本本", "");
                const chat_response = await sendMessageToChatGPT(words);
                log.info("send_back " + chat_response);
                await msg.say(`${chat_response} \n from ChatGPT`, msg.talker())
            } else {
                log.info(`[${msg.id}][onVoice] output sentence from openai is ${sentence}`);
                msg.room().say(`your message is "${sentence}" \n\n\n    from ChatGPT语音模型, 请在语音内容里加上"笨笨"召唤ChatGPT给你回答`, msg.talker());
            }
        } else {
            log.info(`[${msg.id}][onVoice] trying to print error ${response.data.error}`);
        }
    }
}

function generatePrompt(message) {
	return message
}

async function sendMessageToChatGPT(msg){
	const res = await api.sendMessage(msg)
	return res.text
}

const bot = WechatyBuilder.build({
    name: 'chatbot',

    puppetOptions: {
        uos: true  // 开启uos协议
    },
    puppet: 'wechaty-puppet-wechat',
})

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)

bot.start()
	.then(() => log.info('StarterBot', 'Starter Bot Started.'))
	.catch(e => log.error('StarterBot', e))

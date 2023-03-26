# Chatbot004
OpenAI/ChatGPT + Wechaty for wechat robot, add magic word to protect


### Install & Run

Install latest nodejs >= 18 from [here](https://nodejs.org/en) and [Google chrome browser](https://www.google.com/chrome/dr/download/?brand=SLLM&geo=US&gclid=Cj0KCQjw2v-gBhC1ARIsAOQdKY3Al65EEor65A0lcNrnK69kC8T2hk5XKB-pQ88Uts3ZJhBvS_GAC18aAlhREALw_wcB&gclsrc=aw.ds)(to support `wechaty-puppet-wechat`), clone the repo to local.

```
git clone https://github.com/gfl94/Chatbot004.git && cd Chatbot004
npm install 
```

Generate `OPENAI` open keys from [OpenAI page](https://platform.openai.com/account/api-keys)

```
cp .env.example .env
```

And copy you OpenAI api key to `.env` file.

```
OPENAI_API_KEY="sk-xxxx"
```

Run the program and scan your QR code with your wechat.

```
npm run
```


### Demo


https://user-images.githubusercontent.com/6205873/227682615-030d7da9-f8b3-4490-8d98-c2942525e9f7.mp4


### Key Features

+ send the whole sentence to ChatGPT, and send back the response
+ add `magic_word` in your chat to avoid too many noise, when the message received contains the `magic_word`, then send to ChatGPT
+ manage your `magic_word` with login account
+ [23/03/26 update] add speech support.


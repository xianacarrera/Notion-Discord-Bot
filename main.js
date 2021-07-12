// dotenv -> library for loading .env files
require('dotenv').config();      // load the .env variables into process.env

const Discord = require('discord.js');
// Create an instance of a Discord client
const client = new Discord.Client();

/* If we wanted to react to events that happened before the bot was added to the server:
const client = new Discord.Client({
    partials: ["MESSAGE"];
}); */


const BOT_PREFIX = "!";       // Prefix that indicates that a message is a request made to the bot
const MOD_ME_COMMAND = "mod-me";
const REQUEST_LOVE_COMMAND = "request-love"

client.on('ready', () => {
    console.log("The bot is ready");
});

// Listen for messages in the server
client.on('message', msg => {
    if (msg.content === 'ping'){
       // msg.reply("Pong!");      Replies to the user
       msg.channel.send('Este mensaje no es una respuesta');
    } else if (msg.content === `${BOT_PREFIX}${MOD_ME_COMMAND}`){
        modUser(msg.member);
    } else if (msg.content === `${BOT_PREFIX}${REQUEST_LOVE_COMMAND}`){
        // The bot reacts to the message with a heart emoji
        msg.react("❤️");
    }
});

client.on("messageDelete", msg => {
    // The bot yells at people who are deleting messages
    msg.channel.send('Stop deleting messages!');
})

function modUser(member){
    // msg.member is the member that sent the message
    // add "moderator" to their roles
    member.roles.add("863473374822268929");
}

// Log the bot in using the token provided by Discord
client.login(process.env.BOT_TOKEN);





/**************************************************************************** */

const express = require('express');
// Import the client from notion.js
const notion = require('./notion');


const app = express();

// request, response
app.get('/', (req, res) => {
    res.send("Hi!");
})

app.listen(process.env.PORT);
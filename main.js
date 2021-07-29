// dotenv -> library for loading .env files
require("dotenv").config(); // load the .env variables into process.env

const Discord = require("discord.js");
const fs = require("fs");

const client = new Discord.Client();
client.commands = new Discord.Collection(); // Available commands in the server

const CONSTANTS = require("constants");

// --------------------- Load all available commands from the file structure

// Read only JavaScript files
const commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Add a new command to the Collection
    // The key is the command name; the value is the exported module
    client.commands.set(command.name, command);
}

/* If we wanted to react to events that happened before the bot was added to the server:
const client = new Discord.Client({
    partials: ["MESSAGE"];
}); */

const BOT_PREFIX = "!"; // Prefix that indicates that a message is a request made to the bot
const MOD_ME_COMMAND = "mod-me";
const REQUEST_LOVE_COMMAND = "request-love";
const NOTION_ROLE = "notion-manager";

client.on("ready", () => {
    console.log("The bot is ready");
});

// Listen for messages in the server
/*
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
}); */

client.on("message", (msg) => {
    // Ignore if the message does not have the prefix or was written by a bot
    if (!msg.content.startsWith(BOT_PREFIX) || msg.author.bot) return;

    // Eliminate the prefix and the remaining white space. Then, separate by blank spaces
    const args = msg.content.slice(BOT_PREFIX.length).trim().split(/ +/);
    // Take the first element of the array (removing it) and store it in lowecase.
    const commandName = args.shift();

    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    // If arguments are required and the user has provided none, cancel
    if (command.args && !args.length) {
        return msg.channel.send(
            `Necessary information was not provided. Check usage details with **!help**`
        );
    }

    // If the defined role for Notion is required and the user doesn't have it, cancel
    if (
        command.availableTo.includes(CONSTANTS.role) &&
        msg.member.roles.cache.some((role) => role.name === CONSTANTS.role)
    ) {
        return msg.reply(`You must have the role ${CONSTANTS.role} to use this command.`)
    }

    try {
        command.execute(msg, args);
    } catch (error) {
        console.error(error);
        msg.reply("Sorry! An error has occurred :(");
    }
});

client.on("messageDelete", (msg) => {
    // The bot yells at people who are deleting messages
    msg.channel.send("Stop deleting messages!");
});

function modUser(member) {
    // msg.member is the member that sent the message
    // add "moderator" to their roles
    member.roles.add("863473374822268929");
}

// Log the bot in using the token provided by Discord
client.login(process.env.BOT_TOKEN);

/**************************************************************************** */

const express = require("express");
// Import the client from notion.js
const notion = require("./notion");

const app = express();

// request, response
app.get("/", (req, res) => {
    res.send("Hi!");
});

app.listen(process.env.PORT);

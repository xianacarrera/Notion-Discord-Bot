const CONSTANTS = require('../constants');

const commandInfo = "```asciidoc\n" +
"[                      COMMAND LIST                      ]\n" +
"\n" + 
"Use " + CONSTANTS.PREFIX + "helpNotion [command name] to read about a specific command\n\n";

module.exports = {
    name: 'helpNotion',
    description: 'Shows a list with all the available commands for the Notion bot',
    availableTo: 'All users',
    execute(message, args){
        const data = [];
        const { commands } = message.client;

        if (!args.length){   // Show list with all commands
            data.push(commandInfo);
            data.push(
                commands.map(command => 
                    CONSTANTS.PREFIX + command.name + 
                    "\n---------------------------------------------\n")
                    .join("")
                );
            // join is used to specifiy that the elements of the array should not be separated
            // in the resulting string. The default behaviour is to separate them with commas ","
            data.push("\n```");
            
            return message.channel.send(data, {split: true});
            // The message is split into several messages if the character limit is exceeded
        }

        // Show information about a specific command if the input is correct
        const command = commands.get(args[0]);

        if (!command){     
            return message.reply(`${args[0]} is not the name of a valid command`)
        }

        data.push("```asciidoc\n" +
                    `${CONSTANTS.PREFIX}${command.name}\n` + 
                    "---------------------------------------------------------------------------------------\n"
        );
        if (command.description) data.push(`[Description]\n\t${command.description}\n`);
        if (command.availableTo) data.push(`[Available to]\n\t${command.availableTo}\n`);
        if (command.usage) data.push(`[Usage]\n\t${command.usage}\n`);
        if (command.examples) data.push(`[Examples]\n\t${command.examples}\n`);
        data.push("```");

        message.channel.send(data, {split: true});
        // The message is split into several messages if the character limit is exceeded
    },
};
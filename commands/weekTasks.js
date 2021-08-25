const notion = require("../notion");
const Discord = require ("discord.js");
const util = require("../util");

function weekTasksEmbed(onlyUrgent, showCompleted, onlyCompleted, maxPages){
    const embed = new Discord.MessageEmbed()
    .setTitle("***Tasks for this week***")
    .setColor(0x0000ff)
    .setTimestamp();

    let description = `Showing the ${maxPages} next incoming tasks.`;

    // No filters
    if (!onlyUrgent && showCompleted && !onlyCompleted) return embed.setDescription(description);
    
    description += "\nFilters: ";

    if (onlyUrgent){            // More than 1 filter
        description += "only urgent tasks"
        if (onlyCompleted){
            description += ", only completed tasks."
            return embed.setDescription(description);
        }
        if (!showCompleted){
            description += ", omit completed tasks."
            return embed.setDescription(description);
        }
        description += "."
        return embed.setDescription(description);
    }

    // 1 filter

    if (onlyCompleted){
        description += " only completed tasks."
        return embed.setDescription(description);
    }

    description += " omit completed tasks."
    return embed.setDescription(description);
}

module.exports = {
    name: 'weekTasks',
    description: '.',
    availableTo: "All users.",
    args: false,

    usage: "",

    examples: "",

    async execute(message, args){
                if (args.length > 4) return message.reply("Too many arguments were provided.");

        const joinedArgs = args.join(" ");

        const numberRegex = /\d+/g;
        const numbers = joinedArgs.match(numberRegex);

        if (numbers?.length > 1) return message.reply("Format not valid: several numerical arguments were provided.");

        const onlyUrgent = joinedArgs.includes("onlyUrgent");
        const showCompleted = joinedArgs.includes("showCompleted");
        const onlyCompleted = joinedArgs.includes("onlyCompleted");
        const maxPages = numbers?.length? Math.min(numbers[0], 25) : 10;

        const requestedTasks = notion.getWeekTasks(onlyUrgent, showCompleted, onlyCompleted, maxPages);

        let embed = weekTasksEmbed(onlyUrgent, showCompleted, onlyCompleted, maxPages);
        await requestedTasks.then(result => embed.fields = util.tasksToEmbed(result.tasks));

        message.channel.send(embed);
    }
}
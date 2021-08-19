const notion = require("../notion");
const Discord = require ("discord.js");
const util = require("../util");

function nextTasksEmbed(onlyUrgent, showCompleted, onlyCompleted, maxPages){
    const embed = new Discord.MessageEmbed()
    .setTitle("***Incoming tasks***")
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
    name: 'nextTasks',
    description: 'Displays the nearest coming tasks, ordered by due date. Tasks that do not have a due date are not ' +
    'included. By default, completed tasks are omitted.',
    availableTo: "All users.",
    args: false,

    usage: "This command accepts the following arguments:\n" + 
    "\t\tMax number of tasks :: (Optional) Maximum number of tasks to be displayed. This argument equals 10 " +
    "by default, and is capped at 25. This argument has to be specified as a numeric value.\n" +
    "\t\tUrgent-only :: (Optional) If 'onlyUrgent' is specified, only the tasks that are checked in the urgent column "+
    "will be displayed.\n" +
    "\t\tShow completed :: (Optional) If 'showCompleted' is specified, already completed tasks (those marked with " +
    "'Completed' in the Status column) will appear.\n" +
    "\t\tOnly completed :: (Optional) If 'onlyCompleted' is specified, only the already completed tasks will appear. " +
    "\n" +
    "\tArguments can be specified in any order. They must be separated by one or more blank spaces.\n" +
    "\tAlready completed tasks are excluded from the result by default.\n" + 
    "\tIf a maximum number of tasks is provided and it is greater than 25, it will be automatically cut down to 25.\n" +
    "\tIndicating both 'showCompleted' and 'onlyCompleted' has the same result as only specifying the latter one.\n" +
    "\tThis command works without arguments, in which case it will show the next 10 incoming tasks, ordered, " +
    "including both urgent and non-urgent tasks, but omitting tasks with a 'Completed' status.\n",

    examples: "!nextTasks \n" +
    "\t!nextTasks 20 onlyUrgent \n" +
    "\t!nextTasks showCompleted 5 onlyUrgent\n" +
    "\t!nextTasks onlyCompleted",

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

        const requestedTasks = notion.getNextTasks(onlyUrgent, showCompleted, onlyCompleted, maxPages);

        let embed = nextTasksEmbed(onlyUrgent, showCompleted, onlyCompleted, maxPages);
        await requestedTasks.then(result => embed.fields = util.tasksToEmbed(result));

        message.channel.send(embed);
    },
};



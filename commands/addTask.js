const CONSTANTS = require('../constants');
const notion = require("../notion");
const Discord = require ("discord.js");
const util = require('../util');

function addTaskEmbed(){
    const embed = new Discord.MessageEmbed()
    .setTitle("***Task added***")
    .setColor(0x0000ff)
    .setTimestamp();

    return embed;
}

module.exports = {
    name: 'addTask',
    description: 'Creates a new task in the database.',
    availableTo: "Allowed users (notion-manager role).",
    args: true,      // Arguments are required

    usage: "This command accepts the following arguments:\n" + 
    "\t\tName :: (Required) Main column in Notion with the name of the task.\n" +
    "\t\tDescription :: (Optional) Text that accompanies the task.\n" +
    "\t\tUrgent :: (Optional) A Notion checkbox. If *yes* or *y* are indicated, the checkbox will be marked. In any " +
    "other case, it will be left blank.\n" +
    "\t\tStatus :: (Optional) A Notion select column. It's possible to indicate already existing values or " +
    "new ones. If no values are passed, it will be left blank.\n" +
    "\t\tDue :: (Optional) A due date for the task. Dates must be indicated as YYYY-MM-DD. If the format is not " +
    "correct, this argument will be ignored.\n" +
    "\n" +
    "\tArguments must be specified in the above order, separated by *+?*. To skip one argument, simply write *+?+?*.\n"+
    "\tBlank spaces between *+?* and *+?* are ignored (so both *+?+?* and *+?      +?* leave the skipped argument " +
    "completely empty).\n" +
    "\tBlank spaces before of after an argument are also ignored: setting a description as *   to be specified   * or "+
    "as *to be specified    *, for example, have the same effect as writing *to be specified*.\n" +
    "\tIt is not necessary to indicate any optional arguments. If not enough separations (+?) are provided, the " +
    "remaining attributes will be left blank.\n",

    examples: "!addTask Write daily post +? This is an urgent task with a 'Not started' status due for 2021-08-06 +? " +
    "y +? Not started +? 06/08/2021 \n" +
    "\t!addTask Call Mark +? This task only has a name and a description \n" +
    "\t!addTask Study chemistry +? This task only has a name, a description and a 'Behind schedule' status +? " +
    "+? Behind schedule \n" +
    "\t!addTask Clean the sofa +? This task has a name, a description, a due date and is urgent +? yes+?+?2021-08-21",

    execute(message, args){
        // Redefine the arguments according to the _? separator
        const arguments = args.join(" ").split("+?").flatMap(arg => arg.trim());
        
        if (arguments.length > 5) return message.reply("Too many arguments were provided.");

        const validDate = arguments[4] && util.checkDate(arguments[4]);

        notion.addTask({
            title: arguments[0],
            description: arguments[1] ?? "",
            isUrgent: arguments?.[2] === "yes" || arguments?.[2] === "y",
            status: arguments[3] ?? "Not started",
            dueDate: validDate? arguments[4] : "",
            creationDate: util.currentDate(),
        });

        message.channel.send(addTaskEmbed());
    },
};



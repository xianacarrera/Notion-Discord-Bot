const { execute } = require("./nextTasks");

let maxTasks = 10;
let urgentOnly = false;
let showCompleted = false;
let onlyCompleted = false;


module.exports = {
    name: 'filterByTitle',
    description: "Displays all the properties of the tasks whose title (the main Notion column) contains the " +
    "provided text. By default, completed tasks are omitted.",
    availableTo: "All users.",
    args: true,

    usage: "This command uses the following structure: !filterByTitle <filterText>\n" + 
    "After the previous message, the bot will reply indicating the current command preferences. These can be " +
    "changed by the person who has sent the command by replying to the message within a time limit of 15 seconds.",
    examples: "",

    async execute(message, args){
        // There are no 'arguments' per se in the initial message. With the command prompt once eliminated, the
        // remaining message conforms the search text.
        const searchText = args.join(" ");

        /* The bot will reply asking for user settings. Command arguments will be retrieved from the user's next
        message*/

        let filter = (msg) => message.author === msg.author;

        let collectorOptions = {
            max: 1,        // Collect only 1 message
            time: 15000    // Wait for 15 s at most
        };

        let collector = message.channel.createMessageCollector(filter, collectorOptions);

        // The 'collect' event will fire whenever the collector receives input
        collector.on('collect', (m) => {
            console.log(`Collected ${m.content}`);
          });

        message.reply(`I will search for tasks whose title contains "${searchText}"`);
        message.channel.send("I am currently using the following settings:\n");
        message.channel.send(`Maximum number of tasks to show: ${maxTasks}`);
        message.channel.send(`Only show urgent tasks: ${urgentOnly? "yes" : "no"}`);
        message.channel.send(`Show completed tasks: ${showCompleted? "yes" : "no"}`);
        message.channel.send(`Only show completed tasks: ${onlyCompleted? "yes" : "no"}`);
        message.channel.send("To change any of the above options, send a message with a numerical value, " +
        "'changeUrgent', 'changeShowCompleted', 'changeOnlyCompleted' or a combination of those, separated by " +
        "blank spaces. Any other reply will leave the settings as they are.");
    }
};
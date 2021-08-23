const notion = require("../notion");
const Discord = require ("discord.js");
const util = require("../util");

let maxTasks = 10;
let onlyUrgent = false;
let showCompleted = false;
let onlyCompleted = false;

let settingsMessage =
    "I am currently using the default settings:\n" +
    `• **Maximum number of tasks** to show: *${maxTasks}*` +
    "\n" +
    `• **Only** show **urgent tasks**: *${onlyUrgent ? "yes" : "no"}*` +
    "\n" +
    `• Show **completed tasks**: *${showCompleted ? "yes" : "no"}*` +
    "\n" +
    `• **Only** show **completed tasks**: *${onlyCompleted ? "yes" : "no"}*` +
    "\n" +
    "To change any of the above options, send a message with a **numerical value**, " +
    "'**changeUrgent**', '**changeShowCompleted**', '**changeOnlyCompleted**' or a combination of those, " +
    "separated by blank spaces. Any other reply will leave the settings as they are.";

function tasksByTitleEmbed(searchText, onlyUrgent, showCompleted, onlyCompleted, maxTasks) {
    const embed = new Discord.MessageEmbed()
        .setTitle("***Filitered tasks***")
        .setColor(0x0000ff)
        .setTimestamp();

    let description = `Showing the ${maxTasks} tasks that contain '*${searchText}*' in their title.`;

    // No filters
    if (!onlyUrgent && showCompleted && !onlyCompleted)
        return embed.setDescription(description);

    description += "\nFilters: ";

    if (onlyUrgent) {
        // More than 1 filter
        description += "only urgent tasks";
        if (onlyCompleted) {
            description += ", only completed tasks.";
            return embed.setDescription(description);
        }
        if (!showCompleted) {
            description += ", omit completed tasks.";
            return embed.setDescription(description);
        }
        description += ".";
        return embed.setDescription(description);
    }

    // 1 filter

    if (onlyCompleted) {
        description += " only completed tasks.";
        return embed.setDescription(description);
    }

    description += " omit completed tasks.";
    return embed.setDescription(description);
}

module.exports = {
    name: "filterByTitle",
    description:
        "Displays all the properties of the tasks whose title (the main Notion column) contains the " +
        "provided text. By default, completed tasks are omitted.",
    availableTo: "All users.",
    args: true,

    usage:
        "This command uses the following structure: !filterByTitle <filterText>\n" +
        "After the previous message, the bot will reply indicating the current command preferences. These can be " +
        "changed by the person who has sent the command by replying to the message within a time limit of 30 seconds.",
    examples: "",

    async execute(message, args) {
        // There are no 'arguments' per se in the initial message. With the command prompt once eliminated, the
        // remaining message conforms the search text.
        const searchText = args.join(" ");

        /* The bot will reply asking for user settings. Command arguments will be retrieved from the user's next
        message*/

        let filter = (msg) => message.author === msg.author;

        let collectorOptions = {
            max: 1, // Collect only 1 message
            time: 30000, // Wait for 15 s at most
        };

        message.reply(
            `I will search for tasks whose title contains "${searchText}"`
        );
        message.channel.send(settingsMessage);

        let collector = message.channel.createMessageCollector(
            filter,
            collectorOptions
        );

        // The 'collect' event will fire whenever the collector receives input
        collector.on("end", (collected, reason) => {
            if (reason === "time")
                return message.channel.send(
                    "Time limit (30 s) reached. The command was cancelled."
                );

            const userReply = collected.array()[0].content;

            const numberRegex = /\d+/g;
            const numbers = userReply.match(numberRegex);

            if (numbers?.length > 1)
                return message.channel.send(
                    "Format not valid: several numerical arguments were provided.\n" +
                        "The command and its settings configuration were cancelled. Please, try again."
                );

            // A single numerical value was indicated
            if (numbers?.length) {
                if (numbers[0] > 25) {
                    tempMaxTasks = 25;
                    message.channel.send(
                        "Maximum number of tasks is capped at 25."
                    );
                } else {
                    tempMaxTasks = numbers[0];
                }
            }

            if (userReply.includes("changeUrgent")) onlyUrgent = !onlyUrgent;
            if (userReply.includes("changeShowCompleted"))
                showCompleted = !showCompleted;
            if (userReply.includes("changeOnlyCompleted"))
                onlyCompleted = !onlyCompleted;

            message.channel.send(
                "Then, the settings would be:\n" +
                    `• **Maximum number of tasks** to show: *${maxTasks}*` +
                    "\n" +
                    `• **Only** show **urgent tasks**: *${
                        onlyUrgent ? "yes" : "no"
                    }*` +
                    "\n" +
                    `• Show **completed tasks**: *${
                        showCompleted ? "yes" : "no"
                    }*` +
                    "\n" +
                    `• **Only** show **completed tasks**: *${
                        onlyCompleted ? "yes" : "no"
                    }*`
            );

            if (onlyCompleted && !showCompleted)
                return message.channel.send(
                    "The search specifies 'only completed tasks', but they are set to not be included.\n" +
                        "There are 0 results."
                );

            message.channel.send(
                "Do you want to execute the search with these settings? (y/n)"
            );

            let collector2 = message.channel.createMessageCollector(
                filter,
                collectorOptions
            );

            collector2.on("end", async (collected2, reason2) => {
                if (reason2 === "time")
                    return message.channel.send(
                        "Time limit (30 s) reached. The command was cancelled."
                    );

                const userConfirmation = collected2.array()[0].content;

                if (userConfirmation !== "y" && userConfirmation !== "yes")
                    return message.channel.send(
                        "Settings discarded. The command execution was cancelled."
                    );

                const requestedTasks = notion.getByTitle(
                    searchText,
                    onlyUrgent,
                    showCompleted,
                    onlyCompleted,
                    maxTasks
                );

                let embed = tasksByTitleEmbed(
                    searchText,
                    onlyUrgent,
                    showCompleted,
                    onlyCompleted,
                    maxTasks
                );

                await requestedTasks.then(
                    (result) => (embed.fields = util.tasksToEmbed(result))
                );

                message.channel.send(embed);
            });
        });
    },
};

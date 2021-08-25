const notion = require("../notion");
const Discord = require("discord.js");
const util = require("../util");

// Tasks are presented in groups of 10
const groupSize = 10;

// Check if a string is a single digit
function isNumeric(value) {
    return /\b([0-9])\b/.test(value);
}

function presentOptionsAsEmbed(titleText, groupSize, hasMore) {
    const embed = new Discord.MessageEmbed()
        .setTitle("***Options***")
        .setColor(0x0000ff)
        .setTimestamp();

    let description =
        `Showing ${groupSize} tasks whose title contains the provided text. They appear in alphabetical ` +
        `order. To select one of them in order to modify it, reply with only its number (0-9). To cancel, type 'exit'.`;

    if (hasMore)
        description +=
            "\nNot all possible options are shown in this message. To see the next batch, type 'more'.";

    return embed.setDescription(description);
}

module.exports = {
    name: "modifyTask",
    description:
        "Updates a property of a task. First, a search based on the title of the task is performed. A list with all " +
        "the tasks whose title contains the provided text is shown as a result. After selecting one of those " +
        "options and one of the properties of the database, you will be able to enter a new value for it. " +
        "Finally, the updated task is shown.",
    availableTo: "Allowed users (notion-manager role).",
    args: true,

    usage:
        "This command uses the following structure: !modifyTask <titleText>\n" +
        "After the previous message, the bot will reply showing which tasks contain <titleText> in their title. " +
        "The results will be ordered alphabetically by their title. 25 results will be shown at most. " +
        "Then, the bot will ask to choose an option",
    examples: "",

    async execute(message, args) {
        // There are no 'arguments' per se in the initial message. With the command prompt once eliminated, the
        // remaining message conforms the search text.
        const titleText = args.join(" ");

        // The bot only reacts to the original author
        const filter = (msg) => message.author === msg.author;

        const messageCollectorOptions = {
            max: 1, // Collect only 1 message
            time: 30000, // Wait for 30 s at most
            errors: ["time"],
        };

        let stopSearch = false;
        let stopCollector = false;

        let selectedOption = null;
        let embed = null;
        let advance = false;
        let nextCursor = null;
        let nTasks = null;

        do {
            // Perform a search of the database by the title of the tasks
            // Urgent and completed tasks are not excluded
            const optionsTasks = notion.getByTitle(
                titleText,
                false,
                true,
                false,
                groupSize,
                advance,
                nextCursor
            );

            await optionsTasks.then((result) => {
                advance = result.hasMore;
                nextCursor = result.nextCursor;
                embed = presentOptionsAsEmbed(titleText, groupSize, advance);

                // Prepare the embed with true as the options' argument so that emoji indexes appear
                embed.fields = util.tasksToEmbed(result.tasks, true);
                nTasks = result.tasks.length;
            });

            await message.channel.send(embed);


            do {
                await message.channel
                    .awaitMessages(filter, messageCollectorOptions)
                    .then((collected) => {
                        // Get the first message collected. In this case, that is also the only message collected.
                        userReply = collected.first().content.toLowerCase();

                        if (userReply === "cancel") {
                            stopSearch = true;
                            return message.channel.send(
                                "The command was cancelled."
                            );
                        }

                        if (advance && userReply === "next") {
                            stopCollector = true;
                            return message.channel.send(
                                "Retrieving more tasks..."
                            );
                        }

                        if (isNumeric(userReply)) {
                            if (parseInt(userReply) < nTasks) {
                                selectedOption = parseInt(userReply);
                                stopSearch = true;
                                return;
                            } else
                                message.channel.send(
                                    "The selected option is out of range."
                                );
                        }

                        let messageRequestResend =
                            "I didn't understand your message. Try typing:\n" +
                            "• 0-9 -> To select one of the options previously shown.\n" + 
                            "• 'cancel' -> To stop the command's execution.";

                        if (advance)
                            messageRequestResend +=
                                "\n" +
                                "• 'next' -> To see the next batch of tasks.";

                        message.channel.send(messageRequestResend);
                    })
                    .catch((collected) => {
                        stopSearch = true;
                        message.channel.send(
                            "Time limit (30 s) reached. The command was cancelled."
                        );
                    });
                    
            } while (!stopSearch && !stopCollector);
        } while (!stopSearch);

        // The user didn't select any option (either too much time passed or the command was cancelled)
        if (selectedOption === null) return;
    },
};

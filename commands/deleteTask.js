const notion = require("../notion");
const Discord = require("discord.js");
const util = require("../util");

// Tasks are presented in groups of 10
const groupSize = 10;

let filter = null;
const messageCollectorOptions = {
    max: 1, // Collect only 1 message
    time: 30000, // Wait for 30 s at most
    errors: ["time"],
};

function presentOptionsAsEmbed(hasMore) {
    const embed = new Discord.MessageEmbed()
        .setTitle("***Options***")
        .setColor(0x0000ff)
        .setTimestamp();

    let description =
        `Showing ${groupSize} tasks whose title contains the provided text. They appear ordered by due date. ` +
        `To select one of them in order to delete it, reply with only its number (0-9). To cancel, type ` +
        `'cancel'.`;

    if (hasMore)
        description +=
            "\nNot all possible options are shown in this message. To see the next batch, type 'more'.";

    return embed.setDescription(description);
}

module.exports = {
    name: "deleteTask",
    description:
        "Deletes (archives) a task. First, a search based on the title of the task is performed. A list with all " +
        "the tasks whose title contains the provided text is shown as a result. After selecting one of those " +
        "options, it is deleted from the database.",
    availableTo: "Allowed users (notion-manager role).",
    args: true,

    usage:
        "This command uses the following structure: !deleteTask <titleText>\n" +
        "After the previous message, the bot will reply showing which tasks contain <titleText> in their title. " +
        "The results will be ordered by due date. 10 results will be shown at most. " +
        "Then, the bot will ask to choose an option",
    examples: "",

    async execute(message, args) {
        let embed = null; // Embed where the results of the search will be displayed
        let stopSearch = false; // Control of the notion search loop
        let stopCollector = false; // Control of the collector for user response loop
        let retrievedTasks = null; // Tasks returned by the search
        let advance = false; // Boolean -> false if the tasks shown include the end of the list, true otherwise
        let nextCursor = null; // Cursor used to retrieve the next page of results when the user can advance
        let selectedTask = null; // Index of the task selected to be deleted

        filter = (msg) => message.author === msg.author; // The bot only reacts to the original author

        // There are no 'arguments' per se in the initial message. With the command prompt once eliminated, the
        // remaining message conforms the search text.
        const titleText = args.join(" ");

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
                advance = result.hasMore; // Not all the tasks of the search have been shown
                nextCursor = result.nextCursor; // Cursor pointing to the next page of the results when advance === true

                // Prepare the header of the embed
                embed = presentOptionsAsEmbed(advance);
                // Prepare the embed with true as the options' argument so that emoji indexes appear
                embed.fields = util.tasksToEmbed(result.tasks, true);

                retrievedTasks = result.tasks;
            });

            // Show the retrieved tasks and ask to choose one of them
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

                        if (util.isNumeric(userReply)) {
                            if (parseInt(userReply) < retrievedTasks.length) {
                                selectedTask = parseInt(userReply);
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
                            // Give the option to get more results
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

        // The user didn't select any task (either too much time passed or the command was cancelled)
        if (selectedTask === null) return;

        notion.deleteTask(retrievedTasks[selectedTask].id);

        message.channel.send("The selected task was deleted.");
    },
};

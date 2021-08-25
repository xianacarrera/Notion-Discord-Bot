function presentOptionsAsEmbed(titleText, groupSize, hasMore) {
    const embed = new Discord.MessageEmbed()
        .setTitle("***Options***")
        .setColor(0x0000ff)
        .setTimestamp();

    let description =
        `Showing ${groupSize} tasks whose title contains the provided text. They appear in alphabetical ` +
        `order. To select one of them in order to modify it, reply with only its number (0-9). To cancel, type 'exit'.`;

    if (hasMore)
        description += "\nNot all possible options are shown in this message. To see the next batch, type 'more'."

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

        // Tasks are presented in groups of 10
        const groupSize = 10;

        // Perform a search of the database by the title of the tasks
        // Urgent and completed tasks are not excluded
        const optionsTasks = notion.getByTitle(
            titleText,
            false,
            true,
            false,
            groupSize
        );

        let embed = null;
        let hasMore = false;
        let nextCursor = null;

        await requestedTasks.then((result) => {
            hasMore = result.hasMore;
            nextCursor = result.nextCursor;
            embed = presentOptionsAsEmbed(titleText, groupSize, hasMore);
            embed.fields = util.tasksToEmbed(result.tasks);
        });

        message.channel.send(embed);
    },
};

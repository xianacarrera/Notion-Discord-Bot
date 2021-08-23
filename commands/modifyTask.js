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

    async execute(message, args) {}
};
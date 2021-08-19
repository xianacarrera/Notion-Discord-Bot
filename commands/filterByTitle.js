const { execute } = require("./nextTasks");

module.exports = {
    name: 'filterByTitle',
    description: "Displays all the properties of the tasks whose title (the main Notion column) contains the " +
    "provided text. By default, completed tasks are omitted.",
    availableTo: "All users.",
    args: true,

    usage: "",
    examples: "",

    async execute(message, args){

    }
};
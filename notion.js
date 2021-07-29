const { Client } = require("@notionhq/client");
const CONSTANTS = require('./constants');
const util = require('./util');

// Generate a new client using the integration token
const notion = new Client({ auth: process.env.NOTION_API_KEY });


/* // Asynchronous function (these are fetch requests)
async function getDatabase(){
    // Get the database to which the integration is connected
    const response = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID});
    console.log(response);
}

getDatabase(); */

/* async function getTags() {
    const database = await notion.databases.retrieve({
        database_id: process.env.NOTION_DATABASE_ID,
    });

    // Array whose entries are objects with 3 properties: id, name and color
    const tags = notionPropertiesById(database.properties)[
        process.env.NOTION_STATUS_ID
    ].select.options;
    // Do not return the colors
    return tags.map((option) => {
        return { id: option.id, name: option.name };
    });
}*/

// Separates the argument into a new object whose properties' names are the first element for each entry. The value for
// each property is an object that carries the rest of the elements of the entry.
function notionPropertiesById(properties) {
    // Object.values() returns an array with the values of each individual property
    /*
     * We then reduce the array into a single object.
     * Reduce takes a function and the accumulated result. The function takes that accumulated object and the current
     * property. In each call, we separate the id from the rest of the values of the property. Then, we add a new entry
     * to the accumulated object, with the key being the current id, and the value being the rest of properties.
     */
    return Object.values(properties).reduce((obj, property) => {
        const { id, ...rest } = property;
        return { ...obj, [id]: rest };
    }, {});
}

// Create a new task (a new page) in the database
function addTask({
    title,
    description,
    isUrgent,
    status,
    dueDate,
    creationDate,
}) {
    const prop = {
        // Computed property for retrieving the ID of the title column
        [process.env.NOTION_TASKS_ID]: {
            title: [
                {
                    type: "text",
                    text: {
                        content: title, // The actual title text
                    },
                },
            ],
        },

        // Description -> A text (rich_text) column
        [process.env.NOTION_DESCRIPTION_ID]: {
            rich_text: [
                {
                    type: "text",
                    text: {
                        content: description, // The actual title text
                    },
                },
            ],
        },

        // Urgent -> A checkbox
        [process.env.NOTION_URGENT_ID]: {
            checkbox: isUrgent,
        },
    };

    /* The following properties can be left blank if the user desires so */

    // Status -> Select tag.
    if (status.length) prop[process.env.NOTION_STATUS_ID] = {
        select: {
            // If the status specified does not exist, it is created
            name: status,
        }
    };

    // Due -> A date (YYYY-MM-DD)
    if (dueDate.length) prop[process.env.NOTION_DUE_ID] = {
        date: {
            start: dueDate,
        }
    };

    // Creation -> A date (YYYY-MM-DD)
    if (creationDate.length) prop[process.env.NOTION_CREATION_ID] = {
        date: {
            start: creationDate,
        }
    };


    notion.pages.create({
        // database parent
        parent: {
            database_id: process.env.NOTION_DATABASE_ID,
        },

        // property values of the page. The keys are the names or IDs of the property; the values are property values.
        properties: prop
    });
}

// getTags returns a promise. We then get its result and print it.
/* getTags().then((tags) => {

});
 */
const task = {
    title: "Do something",
    description: "Something something",
    isUrgent: true,
    status: "Not started",
    dueDate: "2021-09-12",
    creationDate: "2021-01-24",
};
addTask(task);

async function getTasks() {
    const notionPages = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        filter: {
            property: process.env.NOTION_STATUS_ID,
            select: {
                does_not_equal: "Completed",
            },
        },
        sorts: [
            {
                // Property on which we want to sort
                property: process.env.NOTION_DUE_ID,
                direction: "ascending", // Closest deadlines first
                //TODO: filter those whose deadline has not passed
            },
        ],
        page_size: 20,
    });

    console.log(notionPages.results.map(fromNotionObject));
}

async function nextTasks(onlyUrgent, showCompleted, onlyCompleted, maxNumPags = 10){
    let filterConditions = { and: [{
        property: process.env.NOTION_DUE_ID,
        date: {
            on_or_after: util.currentDate(),
        },
    }]};

    if (onlyUrgent){
        filterConditions.and.push({
            property: process.env.NOTION_URGENT_ID,
            checkbox: {
                equals: true,
            },
        });
    }

    if (onlyCompleted){
        filterConditions.and.push({
            property: process.env.NOTION_STATUS_ID,
            select: {
                equals: CONSTANTS.COMPLETED,
            }
        });
    } else if (!showCompleted){
        filterConditions.and.push({
            property: process.env.NOTION_STATUS_ID,
            select: {
                does_not_equal: CONSTANTS.COMPLETED,
            }
        });
    }

    const notionPages = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        filter: filterConditions,
        sorts: [
            {
                // Property on which we want to sort
                property: process.env.NOTION_DUE_ID,
                direction: "ascending", // Closest deadlines first
            }
        ],
        page_size: maxNumPags
    });

    return notionPages.results.map(fromNotionObject);
}

function fromNotionObject(notionPage) {
    const propertiesById = notionPropertiesById(notionPage.properties);

    return {
        id: notionPage.id,
        task: propertiesById[process.env.NOTION_TASKS_ID]?.title[0]?.plain_text, // Title text
        description:
            propertiesById[process.env.NOTION_DESCRIPTION_ID]?.rich_text[0]?.text
                .content,
        isUrgent: propertiesById[process.env.NOTION_URGENT_ID]?.checkbox,
        status: propertiesById[process.env.NOTION_STATUS_ID]?.select.name,
        due: propertiesById[process.env.NOTION_DUE_ID]?.date?.start,
        creation: propertiesById[process.env.NOTION_CREATION_ID]?.date?.start,
    };
}

nextTasks(false, true, false, 10);


module.exports = {
    addTask,
    nextTasks
};
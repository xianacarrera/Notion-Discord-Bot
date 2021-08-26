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

async function getFilteredTasks(filterConditions, maxNumPags, advance = false, nextCursor = null){
    let query = {
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
    }

    if (advance) query.start_cursor = nextCursor;

    const notionPages = await notion.databases.query(query);

    let result = {
        tasks: notionPages.results.map(fromNotionObject),
        hasMore: notionPages.has_more,
        nextCursor: notionPages.next_cursor,
    };

    return result;
}

function addFilters(filterConditions, onlyUrgent, showCompleted, onlyCompleted){
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
}

function getNextTasks(onlyUrgent, showCompleted, onlyCompleted, maxNumPags = 10){
    let filterConditions = { and: [{
        property: process.env.NOTION_DUE_ID,
        date: {
            on_or_after: util.currentDate(),
        },
    }]};

    addFilters(filterConditions, onlyUrgent, showCompleted, onlyCompleted);

    return getFilteredTasks(filterConditions, maxNumPags);
}


function getWeekTasks(onlyUrgent, showCompleted, onlyCompleted, maxNumPags = 10){
    let filterConditions = { and: [{
        property: process.env.NOTION_DUE_ID,
        date: {
            on_or_after: util.currentDate(),
            before: util.aWeekFromNow(),
        },
    }]};

    addFilters(filterConditions, onlyUrgent, showCompleted, onlyCompleted);

    return getFilteredTasks(filterConditions, maxNumPags);
}

function getByTitle(searchText, onlyUrgent, showCompleted, onlyCompleted, maxNumPags = 10, advance, nextCursor){
    let filterConditions = { and: [{
        property: process.env.NOTION_TASKS_ID,
        title: {
            contains: searchText,
        },
    }]};

    addFilters(filterConditions, onlyUrgent, showCompleted, onlyCompleted);

    return getFilteredTasks(filterConditions, maxNumPags, advance, nextCursor);
}

function getByStatus(statusText, onlyUrgent, showCompleted, onlyCompleted, maxNumPags = 10){
    let filterConditions = { and: [{
        property: process.env.NOTION_STATUS_ID,
        select: {
            equals: statusText,
        },
    }]};

    addFilters(filterConditions, onlyUrgent, showCompleted, onlyCompleted);

    return getFilteredTasks(filterConditions, maxNumPags);
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

async function updateTask(pageId, property){
    const result = await notion.pages.update({
        page_id: pageId,
        properties: property
    });

    return fromNotionObject(result);
}

getNextTasks(false, true, false, 10);
updateTask('44af3156-a97e-48bf-a979-c5fa8bfa72d1', {[process.env.NOTION_TASKS_ID]: {
    title: [
        {
            type: "text",
            text: {
                content: "Estoy actualizado", // The actual title text
            },
        },
    ],
}});


module.exports = {
    addTask,
    getNextTasks,
    getWeekTasks,
    getByTitle,
    getByStatus,
    updateTask
};
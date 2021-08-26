const Discord = require('discord.js');
const digitEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

const formatDate = function(day){
    const dd = day.getDate() < 10? "0" + day.getDate() : day.getDate();
    // getMonth returns month in the [0,11] range
    const mm = day.getMonth() + 1 < 10? "0" + (day.getMonth() + 1) : day.getMonth() + 1;   
    const yyyy = day.getFullYear();

    return yyyy + "-" + mm + "-" + dd;
}

const currentDate = function(){
    return formatDate(new Date());
}

const aWeekFromNow = function(){
    const today = new Date();
    const todayPlusOneWeek =  new Date(today.getTime() + 7 * 24 * 3600 * 1000);

    return formatDate(todayPlusOneWeek);
}

// Check if a string is a single digit
function isNumeric(value) {
    return /\b([0-9])\b/.test(value);
}

const checkDate = function(date){
    // Checks format, range of the fields, leap years, etc.

    const regEx = /^\d{4}-\d{2}-\d{2}$/;     // YYYY-MM-DD
    if(!date.match(regEx)) return false;     // Invalid format

    var d = new Date(date);
    var dNum = d.getTime();
    if(!dNum && dNum !== 0) return false;   // NaN value. The date is invalid
    return d.toISOString().slice(0,10) === date;
}

const tasksToEmbed = function(tasks, showAsOptions = false){
    let fields = [];

    if (!tasks.length){
        fields.push({ name: "**0 results**", value: "No tasks match the specified conditions."});
        return fields;
    }

    for (let [index, task] of tasks.entries()){
        let taskHeader = `**${task.task}**`;
        if (showAsOptions){
            taskHeader = `${digitEmojis[index % 10]}` + "\t" + taskHeader;
        }

        fields.push({
            name: taskHeader,
            value: `• ✍️  *Description*: ${task.description !== undefined? task.description : ""}
            • ❗ *Is urgent*: ${task.isUrgent? "yes" : "no"}
            • 📁  *Status*: ${task.status !== undefined? task.status : ""}
            • 👁️  *Due for*: ${task.due !== undefined? task.due : ""}
            • 🕖  *Created on*: ${task.creation !== undefined? task.creation : ""}`
        });
    }

    return fields;
}

const taskToEmbed = function(task){
    return fields = [{
        name: `**${task.task}**`,
        value: `• ✍️  *Description*: ${task.description !== undefined? task.description : ""}
        • ❗ *Is urgent*: ${task.isUrgent? "yes" : "no"}
        • 📁  *Status*: ${task.status !== undefined? task.status : ""}
        • 👁️  *Due for*: ${task.due !== undefined? task.due : ""}
        • 🕖  *Created on*: ${task.creation !== undefined? task.creation : ""}`
    }];
}

module.exports = {
    currentDate,
    aWeekFromNow,
    checkDate,
    isNumeric,
    tasksToEmbed,
    taskToEmbed
};
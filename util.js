const Discord = require('discord.js');

const currentDate = function(){
    const today = new Date();
    const dd = today.getDate() < 10? "0" + today.getDate() : today.getDate();
    // getMonth returns month in the [0,11] range
    const mm = today.getMonth() + 1 < 10? "0" + (today.getMonth() + 1) : today.getMonth() + 1;   
    const yyyy = today.getFullYear();

    return yyyy + "-" + mm + "-" + dd;
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

const tasksToEmbed = function(tasks){
    let fields = [];
    for (let task of tasks){
        fields.push({
            name: `**${task.task}**`,
            value: `* ✍️  *Description*: ${task.description}
            * ❗ *Is urgent*: ${task.isUrgent}
            * 📁  *Status*: ${task.status}
            * 👁️  *Due for*: ${task.due}
            * 🕖  *Created on*: ${task.creation}`
        });
    }

    return fields;
}

module.exports = {
    currentDate,
    checkDate,
    tasksToEmbed
};
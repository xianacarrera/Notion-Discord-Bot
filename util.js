const Discord = require('discord.js');

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

    if (!tasks.length){
        fields.push({ name: "**0 results**", value: "No tasks match the specified conditions."});
        return fields;
    }

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
    aWeekFromNow,
    checkDate,
    tasksToEmbed
};
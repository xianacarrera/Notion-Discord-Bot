const express = require('express');
// Import the client from notion.js
const notion = require('./notion');


const app = express();

// request, response
app.get('/', (req, res) => {
    res.send("Hi!");
})

app.listen(process.env.PORT);
/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser, session and EJS
const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(__dirname + '/public')); // set location of static files
//creates and manage sessions for each user
app.use(session({
    secret: 'password', // Change to something unique
    resave: false,
    saveUninitialized: false
}));

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db', function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

//Load route file for main page
const mainRoutes = require('./routes/main');
app.use('/', mainRoutes);

//Load route file for organiser page 
const organiserRoute = require('./routes/organiser');
app.use('/organiser', organiserRoute);

//Load route file for attendee page
const attendeeRoute = require('./routes/attendee');
app.use('/attendee', attendeeRoute);

// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


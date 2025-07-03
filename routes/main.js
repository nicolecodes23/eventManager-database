//import express framework
const express = require('express');
//create router object
const router = express.Router();
//import sqlite library
const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('database.db', (err) => {
    if (err) console.error(err);
    // Enable foreign key constraints to maintain relationships
    else db.run('PRAGMA foreign_keys = ON');
});

// GET method for main home page
router.get('/', (req, res) => {
    // Run a SQL query to get the site name and description from SiteSettings table
    db.get(
        'SELECT site_name, site_description FROM SiteSettings WHERE site_setting_ID = 1',
        (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error retrieving site settings.');
            } else {
                // If successful, render the 'main.ejs' template and pass the site data
                res.render('main', {
                    site: row
                });
            }
        }
    );
});

module.exports = router;

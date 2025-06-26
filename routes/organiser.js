const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

// GET method gets organiser home page
router.get('/', (req, res) => {
    res.render('organiser-home'); //organiser-home.ejs
});

// GET method gets site settings page through organiser home page
//Render site settings page with current name and description 
router.get('/settings', (req, res) => {
    db.get("SELECT * FROM SiteSettings LIMIT 1", [], (err, row) => {
        if (err) {
            return res.status(500).send("Database error retrieving");
        }
        res.render('site-settings', { site: row }); //site-settings.ejs

    });
});

// Route: POST /organiser/settings
// Purpose: Update site name and description, then redirect to organiser home
router.post('/settings', (req, res) => {
    const { site_name, site_description } = req.body;

    if (!site_name || !site_description) {
        return res.status(400).send("All fields are required.");
    }

    const sql = `UPDATE SiteSettings SET site_name = ?, site_description = ? WHERE site_setting_ID = 1`;
    db.run(sql, [site_name, site_description], function (err) {
        if (err) {
            return res.status(500).send("Failed to update site settings.");
        }
        res.redirect('/organiser');
    });
});


// GET method gets organiser edit page 
router.get('/events/edit/:id', (req, res) => {
    res.render('organiser-edit'); //organiser-edit.ejs
});

module.exports = router;

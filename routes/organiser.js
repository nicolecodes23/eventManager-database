const express = require('express');
const router = express.Router();

// GET method gets organiser home page
router.get('/', (req, res) => {
    res.render('organiser-home'); //organiser-home.ejs
});

// GET method gets site settings page through organiser home page
router.get('/settings', (req, res) => {
    res.render('site-settings'); //site-settings.ejs
});

// GET method gets organiser edit page 
router.get('/events/edit/:id', (req, res) => {
    res.render('organiser-edit'); //organiser-edit.ejs
});

module.exports = router;

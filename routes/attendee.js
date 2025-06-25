const express = require('express');
const router = express.Router();

// GET method to get /attendee home page
router.get('/', (req, res) => {
    res.render('attendee-home'); //attendee-home.ejs
});

// GET method to get /attendee/event/:id attendee event page
router.get('/event/:id', (req, res) => {
    res.render('attendee-event'); //attendee-event.ejs
});

module.exports = router;

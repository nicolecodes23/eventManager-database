// Import express framework
const express = require('express');
// Create router object
const router = express.Router();

/**
 * GET /
 * Purpose: Render the main home page with navigation links to organiser and attendee pages.
 * Inputs: None
 * Outputs: Renders main.ejs template.
 */
router.get('/', (req, res) => {
    res.render('main');
});

module.exports = router;

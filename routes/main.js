// Import express framework
const express = require('express');
// Create router object
const router = express.Router();

/**
 * GET /
 * Purpose: Render the main home page with links to organiser and attendee pages.
 * Outputs: Renders main.ejs
 */
router.get('/', (req, res) => {
    res.render('main');
});

module.exports = router;

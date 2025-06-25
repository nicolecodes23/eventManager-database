const express = require('express');
const router = express.Router();

// GET method for main home page
router.get('/', (req, res) => {
    res.render('home'); //home.ejs
});

module.exports = router;

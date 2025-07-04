function requireOrganiserAuth(req, res, next) {
    if (req.session && req.session.organiser_ID) {
        next();
    } else {
        res.redirect('/organiser/login');
    }
}

module.exports = { requireOrganiserAuth };

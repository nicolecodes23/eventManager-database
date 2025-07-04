function requireOrganiserAuth(req, res, next) {
    if (req.session && req.session.isOrganiser) {
        next();
    } else {
        res.redirect('/organiser/login');
    }
}

module.exports = { requireOrganiserAuth };

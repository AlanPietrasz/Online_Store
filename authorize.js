// authorize.js
function isUserInRole(user, role) {
    // trywialna implementacja na potrzeby demonstracyjne
    return user == role;
}
/**
*
* @param {http.IncomingMessage} req
* @param {http.ServerResponse} res
* @param {*} next
*/
function authorize(...roles) {
    return function (req, res, next) {
        if (req.signedCookies.user) {
            let user = req.signedCookies.user;
            if (roles.length == 0 ||
                roles.some(role => isUserInRole(user, role))
            ) {
                req.user = user;
                return next();
            }
        } else if (roles.length == 0) {
            return next();
        }
        // fallback na brak autoryzacji
        res.redirect('/login?returnUrl=' + req.url);
    }
}

module.exports = authorize;
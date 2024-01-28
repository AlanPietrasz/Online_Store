// authorize.js
var { isUserInRole } = require('./db');
/**
*
* @param {http.IncomingMessage} req
* @param {http.ServerResponse} res
* @param {*} next
*/
function authorize(...roles) {
    return async function (req, res, next) {
        if (req.signedCookies.user) {
            let user = req.signedCookies.user;
            let isInRole = false;

            for (let i = 0; i < roles.length; i++) {
                if (await isUserInRole(user, roles[i])) {
                    isInRole = true;
                    break;
                }
            }

            if (roles.length == 0 ||
                isInRole) {
                req.user = user;
                return next();
            }
        } else if (roles.length == 0) {
            return next();
        }

        res.redirect('/login?returnUrl=' + req.url + '&message=Requires being in one of the roles: ' + roles.join(", "));
    }
}

module.exports = authorize;
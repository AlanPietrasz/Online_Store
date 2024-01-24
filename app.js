// app.js
var http = require('http');
var authorize = require('./authorize')
var { 
    isUserInRole, 
    doesUserExist, 
    addUser, 
    hasSufficientFunds, 
    updateUserBalance, 
    addUserRole, 
    removeUserRole,
    correctPassword } = require('./db');
var express = require('express');
var cookieParser = require('cookie-parser');


var app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./static', { etag: false }));
app.set('etag', false);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('sgs90890s8g90as8rg90as8g9r8a0srg8'));

app.get("/", authorize(), (req, res) => {
    res.render("index", { user: req.user });
});

app.get('/logout', authorize(), (req, res) => {
    res.cookie('user', '', { maxAge: -1 });
    res.redirect('/');
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post('/login', authorize(), async (req, res) => {
    var username = req.body.txtUser;
    var pwd = req.body.txtPwd;

    if (await correctPassword(username, pwd)) {
        res.cookie('user', username, { signed: true });
        var returnUrl = req.query.returnUrl;
        if (returnUrl) {
            res.redirect(returnUrl);
        } else {
            res.redirect('/');
        }
    } else {
        res.render('login', { message: "Wrong username or password" });
    }
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post('/signup', async (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var confirmPassword = req.body.confirm_password;
    var existingUser;

    try {
        existingUser = await doesUserExist(username);
    } catch (err) {
        console.log(err);
        return res.render('signup', {
            username,
            email,
            messages: ['An unexpected error occurred. Please try again.']
        });
    }

    if (username && username.length > 5 &&
        email && email.length > 5 &&
        password && password.length > 5 &&
        password == confirmPassword &&
        !existingUser) {

        try {


            res.cookie('user', username, { signed: true });
            res.redirect('/account');
        } catch (err) {
            console.log(err);
            return res.render('signup', {
                username,
                email,
                messages: ['An unexpected error occurred. Please try again.']
            });
        }
    }
    else {
        var messages = ['Fill in all fields correctly:'];
        if (!(username && username.length > 5)) {
            messages.push('- Username should be longer than 5 characters')
        }
        if (!(email && email.length > 5)) {
            messages.push('- An invalid email was provided')
        }
        if (!(password && password.length > 5)) {
            messages.push('- Password should be longer than 5 characters')
        }
        if (password !== confirmPassword) {
            messages.push('- The passwords given are different')
        }
        if (existingUser) {
            messages.push('- Username is already taken, please choose a different one')
        }
        return res.render('signup', {
            username,
            email,
            messages
        });
    }
});

app.get('/account', authorize('user', 'admin'), (req, res) => {
    res.render('account', { user: req.user });
});

app.get('/leaderboard', authorize(), (req, res) => {
    res.render('leaderboard', {user: req.user});
});

app.get('/shop', authorize(), (req, res) => {
    res.render('shop', {user: req.user});
});

app.get('/moneymaker', authorize('user'), (req, res) => {
    res.render('moneymaker', {user: req.user});
});

app.use((req, res, next) => {
    res.render('404.ejs', { url: req.url });
});

app.use((err, req, res, next) => {
    res.end(`Error handling request: ${err}`);
});


http.createServer(app).listen(3000);

console.log("http://localhost:3000/")
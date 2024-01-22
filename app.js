// app.js
var http = require('http');
var authorize = require('./authorize')
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
    res.render("index", {user: req.user});
});

app.get('/logout', authorize(), (req, res) => {
    res.cookie('user', '', { maxAge: -1 } );
    res.redirect('/');
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post('/login', authorize(), (req, res) => {
    var username = req.body.txtUser;
    var pwd = req.body.txtPwd;
    if (username == pwd) {
        res.cookie('user', username, { signed: true });
        var returnUrl = req.query.returnUrl;
        if (returnUrl) {
            res.redirect(returnUrl);
        } else {
            res.redirect('/');
        }
        
    } else {
        res.render('login', { message: "Zła nazwa logowania lub hasło" });
    }
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post('/signup', (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var confirmPassword = req.body.confirm_password;

    if (username && username.length > 5 &&
        email && email.length > 5 &&
        password && password.length > 5 &&
        password == confirmPassword) {

        res.cookie('user', username, { signed: true });
        res.redirect('/account');
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
        return res.render('signup', {
            username,
            email,
            messages
        });
    }
    // if (username && username.length > 5) {
    //     res.redirect('/userinfo?username=' + username);
    // } else {
    //     res.render('index', {
    //         username: username,
    //         message: 'Nazwa użytkownika musi być dłuższa niż 5 znaków'
    //     });
    // }
});

app.get('/account', authorize('user', 'admin'), (req, res) => {
    var user = req.user;
    res.render('account', { user })
});

app.get('/leaderboard', authorize(), (req, res) => {
    res.render('leaderboard')
});

app.get('/shop', authorize(), (req, res) => {
    res.render('shop')
});

app.get('/moneymaker', authorize('user'), (req, res) => {
    res.render('moneymaker');
});

app.use((req, res, next) => {
    res.render('404.ejs', { url: req.url });
});

app.use((err, req, res, next) => {
    res.end(`Error handling request: ${err}`);
});


http.createServer(app).listen(3000);

console.log("http://localhost:3000/")
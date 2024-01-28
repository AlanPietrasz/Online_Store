// app.js
var http = require('http');
var authorize = require('./authorize')
var db = require('./db');
var trywrap = require('./trywrap');
var express = require('express');
var cookieParser = require('cookie-parser');

var app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./static', { etag: false }));
app.set('etag', false);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('sgs90890s8g90as8rg90as8g9r8a0srg8'));

app.get("/", authorize(), async (req, res) => {
    res.render("index", { user: req.user });
});

app.get('/logout', authorize(), async (req, res) => {
    res.cookie('user', '', { maxAge: -1 });
    res.redirect('/');
});

app.get("/login", async (req, res) => {
    var requirementsMessage = req.query.message;
    res.render("login", { requirementsMessage });
});

app.post('/login', authorize(), async (req, res) => {
    var username = req.body.txtUser;
    var pwd = req.body.txtPwd;
    

    var [correct, err] = await trywrap(db.correctPassword(username, pwd));

    if (correct) {
        res.cookie('user', username, { signed: true });
        var returnUrl = req.query.returnUrl;
        if (returnUrl) {
            res.redirect(returnUrl);
        } else {
            res.redirect('/');
        }
    } else {
        if (err) console.log(err);
        var message = err ? 'An unexpected error occurred. Please try again.' : 
                            'Wrong username or password';
        res.render('login', { message });
    }
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post('/signup', async (req, res) => {
    function signupError(err) {
        console.log(err);
        res.render('signup', {
            username,
            email,
            messages: ['An unexpected error occurred. Please try again.']
        });
    }
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var confirmPassword = req.body.confirm_password;

    var [existingUser, err] = await trywrap(db.doesUserExist(username));
    if (err) signupError(err);

    if (username && username.length > 5 &&
        email && email.length > 5 &&
        password && password.length > 5 &&
        password == confirmPassword &&
        !existingUser) {
        
        var userData = {
            username,
            email,
            password
        }


        var [userId, err] = await trywrap(db.addUser(userData));
        if (err) signupError(err);

        var [added, err] = await trywrap(db.addUserRole(username, 'user'))
        if (err) signupError(err);

        res.cookie('user', username, { signed: true });
        res.redirect('/account');

    } else {
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
        res.render('signup', {
            username,
            email,
            messages
        });
    }
});

app.get('/account', authorize('user', 'admin'), async (req, res) => {
    res.render('account', { user: req.user });
});

app.post('/delete-account', authorize('user'), async (req, res) => {
    const username = req.body.username;

    await db.deleteUserAndRoles(username);
    res.redirect('/logout');
});

app.get('/leaderboard', authorize(), async (req, res) => {
    const [topUsersArr, err] = await trywrap(db.topUsers());
    if (err) {
        console.error(err);
        res.render('error', { message: 'Error retrieving the leaderboard.' });
    }
    res.render('leaderboard', {user: req.user, topUsers: topUsersArr});
});

app.get('/shop', authorize(), async (req, res) => {
    res.render('shop', {user: req.user});
});

app.get('/moneymaker', authorize('user'), async (req, res) => {
    res.render('moneymaker', {user: req.user});
});

app.use((req, res, next) => {
    res.render('404.ejs', { url: req.url });
});

app.use((err, req, res, next) => {
    res.end(`Error handling request: ${err}`);
});

db.initConnectionPool()
  .then(() => {
    console.log('Database connected successfully.');

    http.createServer(app).listen(3000, () => {
      console.log("Server listening on http://localhost:3000/");
    });
  })
  .catch(err => {
    console.error('Error while connecting to the database:', err);
  });
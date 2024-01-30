// app.js
const http = require('http');
const authorize = require('./authorize')
const db = require('./db');
const trywrap = require('./trywrap');
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

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
    const requirementsMessage = req.query.message;
    res.render("login", { requirementsMessage });
});

app.post('/login', authorize(), async (req, res) => {
    var username = req.body.txtUser;
    var pwd = req.body.txtPwd;
    

    var [correct, err] = await trywrap(db.checkPassword(username, pwd));

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
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirm_password;

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

        var [added, err] = await trywrap(db.addRoleToUser(username, 'user'))
        if (err) signupError(err);

        res.cookie('user', username, { signed: true });
        res.redirect('/account');

    } else {
        var messages = ['Fill in all fields correctly:'];
        if (!(username && username.length > 5)) messages.push('- Username should be longer than 5 characters');
        if (!(email && email.length > 5)) messages.push('- An invalid email was provided');
        if (!(password && password.length > 5)) messages.push('- Password should be longer than 5 characters');
        if (password !== confirmPassword) messages.push('- The passwords given are different');
        if (existingUser) messages.push('- Username is already taken, please choose a different one');
        res.render('signup', {
            username,
            email,
            messages
        });
    }
});

app.get('/account', authorize('user', 'admin'), async (req, res) => {
    var [userData, userError] = await trywrap(db.retrieveUserDetails(req.user));
    if (userError) {
        console.error(userError);
        return res.render('error', { message: 'Error retrieving account details.' });
    }

    var [purchasedProducts, purchaseError] = await trywrap(db.getPurchasedProductsByUser(req.user));
    if (purchaseError) {
        console.error(purchaseError);
        return res.render('error', { message: 'Error retrieving purchase details.' });
    }

    const combinedProducts = purchasedProducts.reduce((acc, product) => {
        if (acc[product.productName]) {
            acc[product.productName].quantity += product.quantity;
        } else {
            acc[product.productName] = { ...product };
        }
        return acc;
    }, {});

    const combinedProductsArray = Object.values(combinedProducts);

    res.render('account', { user: req.user, userData: userData, purchasedProducts: combinedProductsArray });
});

app.get('/edit-account', authorize('user', 'admin'), async (req, res) => {
    var [userData, userError] = await trywrap(db.retrieveUserDetails(req.user.username));
    if (userError) {
        console.error(userError);
        return res.render('error', { message: 'Error retrieving account details for editing.' });
    }
    
    res.render('edit-account', { user: req.user, userData: userData });
});

app.post('/update-account', authorize('user', 'admin'), async (req, res) => {
    const username = req.user;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirm_password;

    const messages = [];
    if (!(username && username.length > 5)) messages.push('- Username should be longer than 5 characters');
    if (email && !(email.length > 5)) messages.push('- An invalid email was provided');
    if ((password || confirmPassword) && 
        !(password.length > 5)) messages.push('- Password should be longer than 5 characters');
    if (password !== confirmPassword) messages.push('- The passwords given are different');

    if (messages.length > 0) {
        return res.render('edit-account', {
            user: username,
            userData: { username, email },
            messages
        });
    }

    const userData = {};
    if (password) userData.password = password;
    if (email) userData.email = email;

    try {
        const [updateResult, updateErr] = await trywrap(db.updateUserDetails(username, userData));
        if (updateErr) {
            throw updateErr;
        }

        res.redirect('/account');
    } catch (err) {
        console.log(err);
        res.render('edit-account', {
            username,
            userData: { username, email },
            messages: ['An unexpected error occurred. Please try again.']
        });
    }
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
        res.render('leaderboard', { message: 'Error retrieving the leaderboard.' });
    }
    res.render('leaderboard', {user: req.user, topUsers: topUsersArr});
});

app.get('/shop', authorize(), async (req, res) => {
    function shopError(err) {
        console.log(err);
        res.render('error', { message: 'Error retrieving products.' });
    }

    const orderBy = req.query.orderBy || 'productName';
    const direction = req.query.direction === 'desc' ? 'DESC' : 'ASC';
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const searchTerm = req.query.searchTerm || '';

    const [paginationData, err] = await trywrap(db.getPaginatedProducts(orderBy, direction, page, pageSize, searchTerm));
    if (err) shopError(err);

    const userRoles = (await db.getUserRoles(req.user)).map(x => x.roleName);

    res.render('shop', {
        user: req.user,
        userRoles: userRoles,
        products: paginationData.products,
        page: paginationData.page,
        totalPages: paginationData.totalPages,
        orderBy: paginationData.orderBy,
        direction: paginationData.direction,
        pageSize: paginationData.pageSize,
        searchTerm: paginationData.searchTerm,
        error: req.query.error || null
    });

});

app.post('/addToCart', authorize('user'), async (req, res) => {
    const user = await db.retrieveUser(req.user);
    const { productId, quantity } = req.body;
    try {
        await db.addToCart(user.ID, productId, quantity);
        res.redirect('/shop');
    } catch (error) {
        res.redirect('/shop?error=' + encodeURIComponent('Failed to add to cart: ' + error.message));
    }
});

app.post('/removeFromCart', authorize('user'), async (req, res) => {
    const user = await db.retrieveUser(req.user);
    const { productId } = req.body;
    await db.removeFromCart(user.ID, productId);
    res.redirect('/cart');
});

app.get('/cart', authorize('user'), async (req, res) => {
    const user = await db.retrieveUser(req.user);
    const cartItems = await db.getCartItems(user.ID);

    res.render('cart', {
        user: req.user,
        userRoles: (await db.getUserRoles(req.user)).map(x => x.roleName),
        cartItems,
    });
});

app.get('/checkout', authorize('user'), async (req, res) => {
    const user = await db.retrieveUser(req.user);
    const cartItems = await db.getCartItems(user.ID);
    const userBalance = user.balance;

    res.render('checkout', {
        user: res.user,
        userBalance,
        cartItems
    });
});

app.post('/finalize-purchase', authorize('user'), async (req, res) => {
    const user = await db.retrieveUser(req.user);
    const { totalCost } = req.body;
    const checkoutResult = await db.checkout(user.ID, parseFloat(totalCost));

    if (checkoutResult.success) {
        res.redirect('/purchase-successful');
    } else {
        res.redirect('/checkout?error=' + encodeURIComponent(checkoutResult.message));
    }
})

app.get('/purchase-successful', authorize('user'), async (req, res) => {
    res.render('purchase-successful');
})

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
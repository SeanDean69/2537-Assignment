
require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 8080;

const app = express();

app.set('view engine', 'ejs');

const Joi = require("joi");

const expireTime = 1 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var { database } = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({
	secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false,
	resave: true
}
));

function isValidSession(req) {
	if (req.session.authenticated) {
		return true;
	}
	return false;
}

function sessionValidation(req, res, next) {
	if (isValidSession(req)) {
		next();
	}
	else {
		res.redirect('/login');
	}
}


function isAdmin(req) {
	if (req.session.user_type == 'admin') {
		return true;
	}
	return false;
}

function adminAuthorization(req, res, next) {
	if (!isAdmin(req)) {
		res.status(403);
		res.render("errorMessage", { error: "Not Authorized" });
		return;
	}
	else {
		next();
	}
}

app.get('/', (req, res) => {
	res.render("index", {current: '/'});
});

app.get('/cats', (req, res) => {
	res.render("cats", {current: '/cats'});
});

app.get('/login', (req, res) => {
	res.render("login", {current: '/login'});
});

app.get('/pokemon', (req, res) => {
	res.render("pokemon"), {current: '/pokemon'};
});

// A2-1
// Example middleware function to check authentication
function requireLogin(req, res, next) {
	if (!req.isAuthenticated()) {
		res.redirect('/login'); // Redirect to login page
	} else {
		next(); // User is authenticated, proceed to the next middleware or route handler
	}
}

// Example route for the /admin page
app.get('/admin', requireLogin, (req, res) => {
	// Your code to render the admin page
});

// A2-2
// Example middleware function to check authentication and admin role
function requireAdmin(req, res, next) {
	if (!req.isAuthenticated() || req.user.role !== 'admin') {
		res.render('admin', { error: 'You must be logged in as an admin to access this page.' });
	} else {
		next(); // User is authenticated and an admin, proceed to the next middleware or route handler
	}
}

// A2-3
app.get('/admin', sessionValidation, adminAuthorization, requireAdmin, async (req, res) => {
	const result = await userCollection.find().project({ username: 1, _id: 1 }).toArray();
	const users = getUsers();
	res.render("admin", { users: result });
});

// A2-4.0
// Example routes for promoting and demoting users
app.get('/admin/promote/:userId', requireAdmin, (req, res) => {
	const userId = req.params.userId;

	// Update user type to 'admin' in the user data or database
	promoteUser(userId);

	// Redirect back to the admin page
	res.redirect('/admin');
});

// A2-4.5
app.get('/admin/demote/:userId', requireAdmin, (req, res) => {
	const userId = req.params.userId;

	// Update user type to 'user' in the user data or database
	demoteUser(userId);

	// Redirect back to the admin page
	res.redirect('/admin');
});

app.get('/nosql-injection', async (req, res) => {
	var username = req.query.user;

	if (!username) {
		res.send(`<h3>no user provided - try /nosql-injection?user=name</h3> <h3>or /nosql-injection?user[$ne]=name</h3>`);
		return;
	}
	console.log("user: " + username);

	const schema = Joi.string().max(20).required();
	const validationResult = schema.validate(username);

	//If we didn't use Joi to validate and check for a valid URL parameter below
	// we could run our userCollection.find and it would be possible to attack.
	// A URL parameter of user[$ne]=name would get executed as a MongoDB command
	// and may result in revealing information about all users or a successful
	// login without knowing the correct password.
	if (validationResult.error != null) {
		console.log(validationResult.error);
		res.send("<h1 style='color:darkred;'>A NoSQL injection attack was detected!!</h1>");
		return;
	}

	const result = await userCollection.find({ username: username }).project({ username: 1, password: 1, _id: 1 }).toArray();

	console.log(result);

	res.send(`<h1>Hello ${username}</h1>`);
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
}); 
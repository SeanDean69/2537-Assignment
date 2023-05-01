//Require(s)
const express = require("express");
const session = require("express-session");

const app = express();

const node_session_secret ='865b2d6b-559f-439b-b6b6-c201addfb86c';

app.use(session({ 
    secret: node_session_secret,
	//store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}));

// Port information
const port = process.env.PORT || 5500;

app.listen(port, () => {
    console.log("App listening on port " + port);
})
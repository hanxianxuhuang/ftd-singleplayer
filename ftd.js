// https://www.freecodecamp.org/news/express-explained-with-examples-installation-routing-middleware-and-more/
// https://medium.com/@viral_shah/express-middlewares-demystified-f0c2c37ea6a1
// https://www.sohamkamani.com/blog/2018/05/30/understanding-how-expressjs-works/

var port = 8000; 
var express = require('express');
var app = express();
var path = require('path');

const { Pool } = require('pg')
const pool = new Pool({
    user: 'webdbuser',
    host: 'localhost',
    database: 'webdb',
    password: 'password',
    port: 5432
});

const bodyParser = require('body-parser'); // we used this middleware to parse POST bodies

function isObject(o){ return typeof o === 'object' && o !== null; }
function isNaturalNumber(value) { return /^\d+$/.test(value); }

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(bodyParser.raw()); // support raw bodies

// Non authenticated route. Can visit this without credentials
app.post('/api/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got here"}); 
});


/** 
 * 
 * Retrieve top 10 scores of each level from database
 * 
*/
app.get('/api/scores', function (req, res) {
	var easy_scores = {};
	var medium_scores = {};
	var hard_scores = {};
	let sql_easy_scores = "SELECT * FROM ftdstats WHERE level = 'easy' ORDER BY score DESC LIMIT 10;";
	let sql_medium_scores = "SELECT * FROM ftdstats WHERE level = 'medium' ORDER BY score DESC LIMIT 10;";
	let sql_hard_scores = "SELECT * FROM ftdstats WHERE level = 'hard' ORDER BY score DESC LIMIT 10;";

	// the sql callbacks are nested since they are asychronous and the function may return before all scores are retrieved
    pool.query(sql_easy_scores, [], (err, pgRes) => {
		if(err){ 
			res.status(404).json({'message': 'Unknown error occured'});
			return;
		} else{
			easy_scores = build_scores_json(pgRes);
			pool.query(sql_medium_scores, [], (err, pgRes) => {
				if(err){ 
					res.status(404).json({'message': 'Unknown error occured'});
					return;
				} else{
					medium_scores = build_scores_json(pgRes);
					pool.query(sql_hard_scores, [], (err, pgRes) => {
						if(err){ 
							res.status(404).json({'message': 'Unknown error occured'});
							return;
						} else{
							hard_scores = build_scores_json(pgRes);
							// All scores are retrieved now so return to the users
							res.status(200); 
							res.json({"message":"scores retrieved", "easy_scores":easy_scores, "medium_scores":medium_scores, 
										"hard_scores":hard_scores}); 
						}
					});
				}
			});
		}
	});
});


/** 
 * 
 * Retrieve top 10 number of enemies of each level from database 
 * 
*/
app.get('/api/enemies', function (req, res) {
	var easy_numbers_of_enemies = {};
	var medium_numbers_of_enemies = {};
	var hard_numbers_of_enemies = {};
	let sql_easy_numbers_of_enemies = "SELECT * FROM ftdstats WHERE level = 'easy' ORDER BY enemies DESC LIMIT 10;";
	let sql_medium_numbers_of_enemies = "SELECT * FROM ftdstats WHERE level = 'medium' ORDER BY enemies DESC LIMIT 10;";
	let sql_hard_numbers_of_enemies = "SELECT * FROM ftdstats WHERE level = 'hard' ORDER BY enemies DESC LIMIT 10;";

	// the sql callbacks are nested since they are asychronous and the function may return before all numbers of enemies are retrieved
    pool.query(sql_easy_numbers_of_enemies, [], (err, pgRes) => {
		if(err){ 
			res.status(404).json({'message': 'Unknown error occured'});
			return;
		} else{
			easy_numbers_of_enemies = build_numbers_of_enemies_json(pgRes);
			pool.query(sql_medium_numbers_of_enemies, [], (err, pgRes) => {
				if(err){ 
					res.status(404).json({'message': 'Unknown error occured'});
					return;
				} else{
					medium_numbers_of_enemies = build_numbers_of_enemies_json(pgRes);
					pool.query(sql_hard_numbers_of_enemies, [], (err, pgRes) => {
						if(err){ 
							res.status(404).json({'message': 'Unknown error occured'});
							return;
						} else{
							hard_numbers_of_enemies = build_numbers_of_enemies_json(pgRes);
							// All numbers of enemies are retrieved now so return to the users
							res.status(200); 
							res.json({"message":"enemies retrieved", "easy_numbers_of_enemies":easy_numbers_of_enemies, "medium_numbers_of_enemies":medium_numbers_of_enemies, 
										"hard_numbers_of_enemies":hard_numbers_of_enemies}); 
						}
					});
				}
			});
		}
	});
});


/** 
 * 
 * Handle registration requests from users
 * 
 */
app.post('/api/register', function (req, res) {
	// check if the information provided by the user contains any error (backend validation)
	var input_error = register_validate(req);
	if (JSON.stringify(input_error) != '{}'){
		return res.status(404).json(input_error);
	}
	var username = req.body['reg_username']; // get the username that the user requests

	// check if the username already exists in the db
	let sql_username = 'SELECT * FROM ftduser WHERE username=$1';
    pool.query(sql_username, [username], (err, pgRes) => {
		if (err){
			res.status(404).json({'message': 'Unknown error occured'});
		} else if(pgRes.rowCount != 0){ 
			// username already exists
			return res.status(409).json({"message":"Username exists"});
		} else{
			// username doesn't exist in db, so insert the user into db
			let sql_register = "INSERT INTO ftduser VALUES($1, sha512($2), $3, $4, $5, $6, true)";
			pool.query(sql_register, [req.body['reg_username'], req.body['reg_password'], req.body['reg_email'], req.body['reg_phone'], req.body['reg_birthday'], req.body['reg_level']], (err, pgRes) => {
				if (err){
					res.status(404).json({'message': 'Unknown error occured'});
				} else {
					res.status(201).json({'message': 'Registration succeeded'});
				}
			});
		}
	});
});


/** 
 * This is middleware to restrict access to subroutes of /api/auth/ 
 * To get past this middleware, all requests should be sent with appropriate
 * credentials. Now this is not secure, but this is a first step.
 *
 * Authorization: Basic YXJub2xkOnNwaWRlcm1hbg==
 * Authorization: Basic " + btoa("arnold:spiderman"); in javascript
**/
app.use('/api/auth', function (req, res,next) {
	if (!req.headers.authorization) {
		return res.status(401).json({ error: 'No credentials sent!' });
  	}
	try {
		// var credentialsString = Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
		var username = m[1];
		var password = m[2];

		// check if the username matches the password in db
		let sql_login = 'SELECT * FROM ftduser WHERE username=$1 and password=sha512($2)';
        	pool.query(sql_login, [username, password], (err, pgRes) => {
  			if (err){
                		res.status(401).json({ error: 'Not authorized'});
			} else if(pgRes.rowCount == 1){
				next(); 
			} else {
                		res.status(401).json({ error: 'Not authorized'});
        		}
		});
	} catch(err) {
               	res.status(401).json({ error: 'Not authorized'});
	}
});

// All routes below /api/auth require credentials 


/**
 * 
 * Handle login requests from uesrs
 * 
 */
app.post('/api/auth/login', function (req, res) {
	// retrieve the username from the authorization header
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];

	// search the user in db and return all the information of the user except password
	let sql_login = 'SELECT username, email, phone, birthday, level FROM ftduser WHERE username=$1';
	pool.query(sql_login, [username], (err, pgRes) => {
		if (err){
			res.status(403).json({ error: 'Unknown error'});
		} else if(pgRes.rowCount == 1){ // find the user
			// return all the information of the user
			var info = {};
			info["username"] = pgRes["rows"][0]["username"];
			info["email"] = pgRes["rows"][0]["email"];
			info["phone"] = pgRes["rows"][0]["phone"];
			info["birthday"] = pgRes["rows"][0]["birthday"];
			info["level"] = pgRes["rows"][0]["level"];
			info["message"] = "authentication success";
			res.status(200); 
			res.json(info); 
		} else {
			res.status(404).json({ error: 'Unknown error'});
		}
	});
});


/**
 * 
 * Handle profile modification requests from users
 * 
 */
app.put('/api/auth/modify', function (req, res) {
	// check if the information provided by the user contains any error (backend validation)
	var input_error = save_validate(req);
	if (JSON.stringify(input_error) != '{}'){
		return res.status(404).json(input_error);
	}

	// Check if password needs to be updated
	if (req.body['profile_password'] != ""){ // need to update password
		let sql_update = "UPDATE ftduser SET password = sha512($1), email = $2, phone = $3, birthday = $4, level = $5 WHERE username = $6;";
		pool.query(sql_update, [req.body['profile_password'], req.body['profile_email'], req.body['profile_phone'], req.body['profile_birthday'], req.body['profile_level'], req.body['profile_username']], (err, pgRes) => {
			if (err){
				res.status(403).json({'message': 'Unknown error occured'});
			} else {
				res.status(200).json({'message': 'Save succeeded'});
			}
		});
	} else{ // don't need to update password
		let sql_update = "UPDATE ftduser SET email = $1, phone = $2, birthday = $3, level = $4 WHERE username = $5;";
		pool.query(sql_update, [req.body['profile_email'], req.body['profile_phone'], req.body['profile_birthday'], req.body['profile_level'], req.body['profile_username']], (err, pgRes) => {
			if (err){
				res.status(403).json({'message': 'Unknown error occured'});
			} else {
				res.status(200).json({'message': 'Save succeeded'});
			}
		});
	}
});


/**
 * 
 * Handle profile deletion requests from users
 * 
 */
app.delete('/api/auth/delete', function (req, res) {	
	// retrieve the username from the authorization header
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];

	// delete the user in db and return
	let sql_update = "DELETE FROM ftduser WHERE username = $1;";
	pool.query(sql_update, [username], (err, pgRes) => {
		if (err){
			res.status(403).json({'message': 'Fail to delete profile'});
		} else {
			res.status(200).json({'message': 'Profile deleted'});
		}
	});
});


/**
 * 
 * Handle recording stats requests from users
 * 
 */
app.post('/api/auth/record', function (req, res) {
	// check if the information provided by the user contains any error (backend validation)
	if (!("score" in req.body) || !isNaturalNumber(req.body["score"]) || req.body["score"] < 0 || req.body["score"] > 2147483647){
		return res.status(404).json({'message': 'Invalid score'});
	} 
	if (!("enemies" in req.body) || !isNaturalNumber(req.body["enemies"]) || req.body["enemies"] < 0 || req.body["enemies"] > 2147483647){
		return res.status(404).json({'message': 'Invalid enemies'});
	} 
	if (!('level' in req.body) || (req.body['level'] != 'easy' && req.body['level'] != 'medium' && req.body['level'] != 'hard')){
		return res.status(404).json({'message': 'Invalid level'});
	}

	// retrieve the username from the authorization header
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];

	// insert the username, stats and level of difficulty to db
	let sql_record = "INSERT INTO ftdstats VALUES(CURRENT_TIMESTAMP, $1, $2, $3, $4)";
	pool.query(sql_record, [username, req.body['level'], req.body['score'], req.body['enemies']], (err, pgRes) => {
		if (err){
			res.status(404).json({'message': 'Unknown error occured'});
		} else {
			res.status(201).json({'message': 'Score and enemies recorded'});
		}
	});
});


app.post('/api/auth/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got to /api/auth/test"}); 
});

// serve all static files
app.use('/',express.static(path.join(__dirname + '/static_content/')));

app.listen(port, function () {
  	console.log('Example app listening on port '+port);
});




// ------------------------------------------------------------Helper Function---------------------------------------------

/**
 * 
 * Retrieve the usernamse and the scores from pgRes and package them into json
 * 
 */
function build_scores_json(pgRes){
	var scores = {};
	for (var i=0;i<pgRes.rowCount;i++){
		var score_user = pgRes["rows"][i]["username"];
		var score_num = pgRes["rows"][i]["score"];
		var score = {score_user, score_num};
		scores[i+1] = score;
	}
	return scores;
}


/**
 * 
 * Retrieve the usernamse and the numbers of enemies from pgRes and package them into json
 * 
 */
function build_numbers_of_enemies_json(pgRes){
	var numbers_of_enemies = {};
	for (var i=0;i<pgRes.rowCount;i++){
		var number_of_enemies_user = pgRes["rows"][i]["username"];
		var number_of_enemies_num = pgRes["rows"][i]["enemies"];
		var number_of_enemies = {number_of_enemies_user, number_of_enemies_num};
		numbers_of_enemies[i+1] = number_of_enemies;
	}
	return numbers_of_enemies;
}

/**
 * 
 * Check all the information in users' registration requests to see if there is any error
 * 
 */
function register_validate(req){
	var input_error = {};

	// validate all inputs
	// username must not include colon
	if (!('reg_username' in req.body) || req.body['reg_username'] == '' || req.body['reg_username'].includes(':') || req.body['reg_username'].length > 20){
		input_error["reg_username"] = "is invalid"
	}
	// password must have length >= 3
	if (!('reg_password' in req.body) || req.body['reg_password'].length < 3){
		input_error["reg_password"] = "is invalid"
	}
	// password must match
	if (!('reg_password_again' in req.body) || req.body['reg_password'] != req.body['reg_password_again']){
		input_error["reg_password"] = "is invalid"
	}
	// email must contain @ and have length >=3
	if (!('reg_email' in req.body) || req.body['reg_email'].length < 3 || !req.body['reg_email'].includes('@') || req.body['reg_email'].length > 256){
		input_error["reg_email"] = "is invalid"
	}
	// phone must match the regex
	var regex_phone = new RegExp("[0-9]{3}-[0-9]{3}-[0-9]{4}");
	if (!('reg_phone' in req.body) || req.body['reg_phone'].length != 12 || !regex_phone.test(req.body['reg_phone'])){
		input_error["reg_phone"] = "is invalid"
	}
	// birthday must match the regex
	var regex_date = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}");
	if (!('reg_birthday' in req.body) || req.body['reg_birthday'].length != 10 || !regex_date.test(req.body['reg_birthday'])){
		input_error["reg_birthday"] = "is invalid"
	} else{
		var date_check = new Date(req.body['reg_birthday']);
		if (isNaN(date_check.getTime())){
			input_error["reg_birthday"] = "is invalid"
		}
	}
	// level must be one of easy, medium, hard
	if (!('reg_level' in req.body) || (req.body['reg_level'] != 'easy' && req.body['reg_level'] != 'medium' && req.body['reg_level'] != 'hard')){
		input_error["reg_level"] = "is invalid"
	}
	// privacy must be checked
	if (!('reg_privacy' in req.body) || req.body['reg_privacy'] != 'true'){
		input_error["reg_privacy"] = "is invalid"
	}
	return input_error;
}

/**
 * 
 * Check all the information in users' profile modificatioin requests to see if there is any error
 * 
 */
function save_validate(req){
	var input_error = {};

	// retrieve the username
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];

	// validate all inputs
	// username must not include colon
	if (!('profile_username' in req.body) || req.body['profile_username'] != username || req.body['profile_username'].length > 20){
		input_error["profile_username"] = "is invalid"
	}
	if ('profile_password' in req.body && 'profile_password_again' in req.body){
		// password must have length >= 3
		if (req.body['profile_password'] == "" && req.body['profile_password_again'] == ""){
			
		} else{
			// password must match
			if (req.body['profile_password'].length < 3 || req.body['profile_password'] != req.body['profile_password_again']){
				input_error["profile_password"] = "is invalid"
			}
		}
	} else{
		input_error["profile_password"] = "is invalid"
	}
	// email must contain @ and have length >=3
	if (!('profile_email' in req.body) || req.body['profile_email'].length < 3 || !req.body['profile_email'].includes('@') || req.body['profile_email'].length > 256){
		input_error["profile_email"] = "is invalid"
	}
	// phone must match the regex
	var regex_phone = new RegExp("[0-9]{3}-[0-9]{3}-[0-9]{4}");
	if (!('profile_phone' in req.body) || req.body['profile_phone'].length != 12 || !regex_phone.test(req.body['profile_phone'])){
		input_error["profile_phone"] = "is invalid"
	}
	// birthday must match the regex
	var regex_date = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}");
	if (!('profile_birthday' in req.body) || req.body['profile_birthday'].length != 10 || !regex_date.test(req.body['profile_birthday'])){
		input_error["profile_birthday"] = "is invalid"
	} else{
		var date_check = new Date(req.body['profile_birthday']);
		if (isNaN(date_check.getTime())){
			input_error["profile_birthday"] = "is invalid"
		}
	}
	// level must be one of easy, medium, hard
	if (!('profile_level' in req.body) || (req.body['profile_level'] != 'easy' && req.body['profile_level'] != 'medium' && req.body['profile_level'] != 'hard')){
		input_error["profile_level"] = "is invalid"
	}
	// privacy must be checked
	if (!('profile_privacy' in req.body) || req.body['profile_privacy'] != 'true'){
		input_error["profile_privacy"] = "is invalid"
	}
	return input_error;
}

var stage=null;
var interval=null;
var credentials={ "username": "", "password":"" };
var user_information={};

var game_status = 0; // 0 if game is on, 1 if game is paused, 2 if game is over


function setupGame(){
	stage=new Stage(document.getElementById('stage'), user_information["level"]);
}

function startGame(){
        // make sure there is a stage in order to start the game
        if (stage === null){
                return;
        }
	interval=setInterval(function(){ stage.step(); stage.draw(); },100);
        game_status = 0;
}

function pauseGame(){
	clearInterval(interval);
	interval=null;
        game_status = 1;
}

/**
 * 
 * When game is ended, send notifications to the user and send request to record the stats in db unless they've been done before
 * 
 */
function endGame(){
        if (game_status == 0){
                // the game just ends 
                // send notification to let the users know game is over
                $("#ui_notification").empty();
                $("#ui_notification").append("<p>Game Over (press t to restart the game)</p>");
                if (stage === null){
                        return;
                }

                // check if the score is valid before adding to the database
                if (stage.score < 0 || stage.score > 2147483647){
                        $("#ui_notification").append("<p>Fail to add your score and number of enemies to our database (score is not valid)</p>");
                        return;
                } 

                // check if the number of enemies is valid before adding to the database
                if (stage.enemies_number < 0 || stage.enemies_number > 2147483647){
                        $("#ui_notification").append("<p>Fail to add your score and number of enemies to our database (number of enemies is not valid)</p>");
                        return;
                } 

                // send request to record the stats in db
                $.ajax({
                        method: "POST",
                        url: "/api/auth/record",
                        data: JSON.stringify({"level": this.user_information["level"], "score": stage.score, "enemies": stage.enemies_number}),
                        headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                        processData:false,
                        contentType: "application/json; charset=utf-8",
                        dataType:"json"
                }).done(function(data, text_status, jqXHR){
                        $("#ui_notification").append("<p>Your score and number of enemies has been added to our database succeessfully</p>");
                        retrieve_scores();
                        retrieve_numbers_of_enemies();
                }).fail(function(err){
                        $("#ui_notification").append("<p>Fail to add your score and number of enemies to our database</p>");
                });
        }
        pauseGame(); // prevent the model from getting called after the game is ended
        game_status = 2; // update the game status to indicate the game has ended
}

/**
 * 
 * Restart the game and display the notification
 * 
 */
function restartGame(){
        $("#ui_notification").empty();
        pauseGame(); // clear the intervel so there would be one timer in total
        setupGame(); // create a new model to remove the old game and initialize the new game
        startGame(); // start the new game
        $("#ui_notification").append("<p>Game Restarted (press p to pause the game)</p>");
}

/**
 * 
 * If a user presses a key on the game page, this function would be called and handle the request appropriately
 * 
 */
function moveByKey(event){
        var key = event.key;

        // restart the game
        if (key == 't'){
                restartGame();
                return;
        }

        // check if there is any player since all keys below require a stage and a player to function properly
        if (stage === null || stage.player === null){
                endGame(); // there is no stage or no player, so the game must have ended
        } else{
                // move the player up, down, left, right
                var moveMap = { 
                        'a': new Pair(-stage.player_speed,0),
                        's': new Pair(0,stage.player_speed),
                        'd': new Pair(stage.player_speed,0),
                        'w': new Pair(0,-stage.player_speed)
                };
                if(key in moveMap){
                        stage.player.velocity=moveMap[key];
                        // if the game is currently paused, start the game and display notification
                        if (game_status == 1){
                                $("#ui_notification").empty();
                                startGame();
                                $("#ui_notification").append("<p>Game Started (press p to pause the game)</p>");
                        }
                }

                // reload bullets and restore health
                if (key == 'e' && game_status == 0){
                        stage.retreat();
                }

                // pause the game and display notification
                if (key == 'p'){
                        $("#ui_notification").empty();
                        if (game_status == 0){
                                pauseGame();
                        }
                        $("#ui_notification").append("<p>Game Paused (press r to resumn the game)</p>");
                }

                // resume the game only if the game is paused (not started or ended) and display notification
                if (key == 'r'){
                        $("#ui_notification").empty();
                        if (game_status == 1){
                                startGame();
                        }
                        $("#ui_notification").append("<p>Game Started (press p to pause the game)</p>");
                }
        }
}

/**
 * 
 * If a user moves the mouse on the game page, this function would be called and handle the request appropriately
 * 
 */
function moveMouse(event){
        // check if there is any player or stage in order to move the mouse in the game
        if (stage === null || stage.player === null){
                endGame(); // there is no stage or no player, so the game must have ended
        } else if (game_status == 0){
                stage.updateMouseLocation(event.clientX, event.clientY); // let the game model know the user has moved the mouse
        }
}

/**
 * 
 * If a user clicks the mouse on the game page, this function would be called and handle the request appropriately
 * 
 */
function clickMouse(event){
        // check if there is any player in order to click in the game
        if (stage === null || stage.player === null){
                endGame(); // there is no stage or no player, so the game must have ended
        } else if (game_status == 0){
                // If the user has bullets to fire, play the sound
                if (stage.player.bullets > 0){
                        var audio = new Audio('gun.mp3');
                        audio.play();
                }
                stage.playerFire(); // let the game model know the user has clicks the mouse (so the player can fire)
        }
}

/**
 * 
 * This is to prevent selecting anything in the html page if user double-clicks when the game is on-going
 * 
 */
function preventSelecting(event){
        event.preventDefault();
}

/**
 * 
 * Handle the login requests from the users
 * 
 */
function login(){
        $("#ui_notification").empty();

        // validate all inputs to see if there is any error (frontend validation)
        if (login_validate() == 1){
                $("#password").val("");
                return;
        }
        // update the authorization header so it can be sent to the server correctly
	credentials =  { 
		"username": $("#username").val(), 
		"password": $("#password").val() 
	};
        login_send_request(); // make a post request to the server and retrieve all the information
}

/**
 * 
 * Handle the registration requests from the users and display notification
 * 
 */
function register(){
        $("#ui_notification").empty();

        // validate all inputs (frontend validation)
        if (register_validate() == 1){
                return;
        }

        // package the registration information into json in order to send to the server
	var register_credentials =  { 
		"reg_username": $("#reg_username").val(), 
		"reg_password": $("#reg_password").val(),
                "reg_password_again": $("#reg_password_again").val(), 
		"reg_email": $("#reg_email").val(),
                "reg_phone": $("#reg_phone").val(), 
                "reg_birthday": $("#reg_birthday").val(), 
		"reg_level": $("#reg_level").val()
	};
        if ($("#reg_privacy").prop('checked')){
                register_credentials["reg_privacy"] = "true";
        } else{
                register_credentials["reg_privacy"] = "";
        }

        // send a post request to the server for registering
        $.ajax({
                method: "POST",
                url: "/api/register",
                data: JSON.stringify(register_credentials),
                processData:false,
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                // The registration succeeded so clear all user input and errors in the from
                // Go to the login page for now
                register_clear_error();
                register_clear_input();
        	$("#ui_register").hide();
        	$("#ui_login").show();
                // Since the user is in the login page, stats are also there so update the stats
                retrieve_scores();
                retrieve_numbers_of_enemies();
                $("#ui_stats").show();
                credentials =  { 
                        "username": register_credentials["reg_username"], 
                        "password": register_credentials["reg_password"]
                };
                // Automatically send a login request to the server so the users don't need to do that
                login_send_request();
                $("#ui_notification").append("<p>Registration Succeeded</p>");
        }).fail(function(err){
                // the registration fails so highlight all the invalid fields
                register_show_error(err.responseJSON);
        });
}

/**
 * 
 * Handle the profile modification requests from the users and display notification
 * 
 */
function save(){
        $("#ui_notification").empty();

        // validate all inputs (frontend validation)
        if (profile_validate() == 1){
                return;
        }
	var save_credentials =  { 
		"profile_username": $("#profile_username").val(), 
		"profile_password": $("#profile_password").val(),
                "profile_password_again": $("#profile_password_again").val(), 
		"profile_email": $("#profile_email").val(),
                "profile_phone": $("#profile_phone").val(), 
                "profile_birthday": $("#profile_birthday").val(), 
		"profile_level": $("#profile_level").val()
	};
        if ($("#profile_privacy").prop('checked')){
                save_credentials["profile_privacy"] = "true";
        } else{
                save_credentials["profile_privacy"] = "";
        }

        // send a post request to the server for modifying the user information
        $.ajax({
                method: "PUT",
                url: "/api/auth/modify",
                data: JSON.stringify(save_credentials),
                headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                processData:false,
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                // the profile modification request succeeded
                // update the authorization header if the password is changed 
                // so the latest password would be used when sending future requests
                if ($("#profile_password").val() != ""){
                        credentials["password"] = $("#profile_password").val();
		        user_information["password"] = $("#profile_password").val();
                }
                // update the user information in order to display them in the profile page in the future
		user_information["email"] = $("#profile_email").val();
                user_information["phone"] = $("#profile_phone").val();
                user_information["birthday"] = $("#profile_birthday").val();
		user_information["level"] = $("#profile_level").val();

                // clear all errors in the from and display the latest information of the user
                profile_clear_error();
                profile_display_input();
                $("#ui_notification").append("<p>Save Succeeded</p>");
        }).fail(function(err){
                // the profile modification fails so highlight all the invalid fields
                profile_show_error(err.responseJSON);
        });
}

/**
 * 
 * Handle the profile deletion requests from the users and display notification
 * 
 */
function delete_profile(){
        $("#ui_notification").empty();

        $.ajax({
                method: "DELETE",
                url: "/api/auth/delete",
                data: JSON.stringify({}),
		headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                processData:false,
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                // profile deletion request succeed
                logout();
                $("#ui_notification").append("<p>Your profile has been deleted</p>");
        }).fail(function(err){
                // the profile deletion fails but still log the user out
                logout();
                $("#ui_notification").append("<p>Fail to delete your profile </p>");
        });
}

/**
 * 
 * Handle the logout requests from the users and display notification
 * 
 */
function logout(){
        // clear all user information and go to login page
        credentials = {}; // clear the authorization header
        user_information = {}; // clear all the user infomation
        stage=null; // delete the game model
        switch_page("logout"); // go to the login page
        pauseGame(); // clear interval so only there would only be one timer all the time
        game_status = 2; // update the game status to game ended
        $("#ui_notification").append("<p>You have successfully logged out </p>");
}

function toRegister(){
        // clear all the inputs and errors in the login page as the user goes to register page and switch to registration page
        $("#ui_notification").empty();
        login_clear_error();
        $("#username").val("");
        $("#password").val("");
        $("#ui_login").hide();
        $("#ui_stats").hide();
        $("#ui_register").show();
}

function toLogin(){
        // clear all the inputs and errors in the registration page as the user goes to login page and switch to login page
        $("#ui_notification").empty();
        register_clear_error();
        register_clear_input();
        $("#ui_register").hide();
        $("#ui_login").show();
        retrieve_scores();
        retrieve_numbers_of_enemies();
        $("#ui_stats").show();
}

// Using the /api/auth/test route, must send authorization header
function test(){
        $.ajax({
                method: "GET",
                url: "/api/auth/test",
                data: {},
		headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

$(function(){
        // Setup all events here and display the appropriate UI for initialization
        // The following buttons are in the login and registration pages
        $("#loginSubmit").on('click',function(){ login(); });
        $("#registerSubmit").on('click',function(){ register(); });
        $("#toLogin").on('click',function(){ toLogin(); });
        $("#toRegister").on('click',function(){ toRegister(); });

        // The following buttons are in the navigation bar
        $("#play").on('click',function(){ switch_page("play"); });
        $("#instructions").on('click',function(){ switch_page("instructions"); });
        $("#stats").on('click',function(){ switch_page("stats"); });
        $("#profile").on('click',function(){ switch_page("profile"); });
        $("#logout").on('click',function(){ logout(); });

        // The following buttons are in the profile page (when user is logged in)
        $("#profileSubmit").on('click',function(){ save(); });
        $("#profileDelete").on('click',function(){ delete_profile(); });

        // Only display notification, login page and stats page at the beginning
        $(".ui_nav").hide();
        $("#ui_notification").show();
        $("#ui_login").show();
        $("#ui_play").hide();
        $("#ui_instructions").hide();
        // get the stats from the server
        retrieve_scores();
        retrieve_numbers_of_enemies();
        $("#ui_stats").show();
        $("#ui_profile").hide();
});




// ------------------------------------------------------------Helper Function---------------------------------------------


/**
 * 
 * Retrieve all user scores from the database by each level
 * 
 */
function retrieve_scores(){
        // send a get request to the server in order to get all the scores
        $.ajax({
                method: "GET",
                url: "/api/scores",
                processData:false,
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                // all scores have been retrieved from db so update all scores in the html page and display notification
                $(".easy_scores").empty();
                $(".medium_scores").empty();
                $(".hard_scores").empty();
                for (var i=1;i<=10;i++){
                        if (i in data["easy_scores"]){
                                $(".easy_scores").append("<li>" + data["easy_scores"][i]["score_num"] + " by " + data["easy_scores"][i]["score_user"] + "</li>");
                        }
                        if (i in data["medium_scores"]){
                                $(".medium_scores").append("<li>" + data["medium_scores"][i]["score_num"] + " by " + data["medium_scores"][i]["score_user"] + "</li>");
                        }
                        if (i in data["hard_scores"]){
                                $(".hard_scores").append("<li>" + data["hard_scores"][i]["score_num"] + " by " + data["hard_scores"][i]["score_user"] + "</li>");
                        }
                }

                $("#ui_notification").append("<p>All scores have been retrieved from our database successfully</p>");
        }).fail(function(err){
                // fail to retrieve scores so display notification
                $("#ui_notification").append("<p>Fail to retrieve scores from our database</p>");
        });
}

/**
 * 
 * Retrieve all numbers of enemies from the database by each level
 * 
 */
 function retrieve_numbers_of_enemies(){
         // send a get request to the server in order to get all numbers of enemies
        $.ajax({
                method: "GET",
                url: "/api/enemies",
                processData:false,
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                // all numbers of enemies have been retrieved from db so update all numbers of enemies in the html page and display notification
                $(".easy_numbers_of_enemies").empty();
                $(".medium_numbers_of_enemies").empty();
                $(".hard_numbers_of_enemies").empty();
                for (i=1;i<=10;i++){
                        if (i in data["easy_numbers_of_enemies"]){
                                $(".easy_numbers_of_enemies").append("<li>" + data["easy_numbers_of_enemies"][i]["number_of_enemies_num"] + " by " + data["easy_numbers_of_enemies"][i]["number_of_enemies_user"] + "</li>");
                        }
                        if (i in data["medium_numbers_of_enemies"]){
                                $(".medium_numbers_of_enemies").append("<li>" + data["medium_numbers_of_enemies"][i]["number_of_enemies_num"] + " by " + data["medium_numbers_of_enemies"][i]["number_of_enemies_user"] + "</li>");
                        }
                        if (i in data["hard_numbers_of_enemies"]){
                                $(".hard_numbers_of_enemies").append("<li>" + data["hard_numbers_of_enemies"][i]["number_of_enemies_num"] + " by " + data["hard_numbers_of_enemies"][i]["number_of_enemies_user"] + "</li>");
                        }
                }

                $("#ui_notification").append("<p>All numbers of enemies have been retrieved from our database successfully</p>");
        }).fail(function(err){
                // fail to retrieve numbers of enemies so display notification
                $("#ui_notification").append("<p>Fail to retrieve numbers of enemies from our database</p>");
        });
}

/**
 * 
 * Send login request to the backend
 * 
 * All information has been validated before this function is called
 * 
 * This function can be used by both login() and register()
 * 
 * Return 1 if success, 0 otherwise
 * 
 */
 function login_send_request(){
        // clear the password in the login page since the user is not likely to use it again
        $("#password").val("");
        login_clear_error();

        // send a post request to the server in order to login
        $.ajax({
                method: "POST",
                url: "/api/auth/login",
                data: JSON.stringify({}),
		headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                processData:false,
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                // login succeed so switch page and display notification
                // the server returns all user information so store it in order to display them in the profile page
                user_information = data;

                // go to the game page
        	$("#ui_login").hide();
                $("#ui_stats").hide();
                $(".ui_nav").show();
                switch_page("play");
		setupGame(); // create a new game model
		startGame(); // start the game automatically
                $("#ui_notification").append("<p>You have logged in</p>");
                return 1;
        }).fail(function(err){
                // user's login credentials are not good so highlight them in the login page and display notification
                $("#ui_notification").append("<p>Login Failed</p>");
                $("#username").css("background-color", "lightcoral");
                $("#password").css("background-color", "lightcoral");
                return 0;
        });
}

/**
 * 
 * Validate the login credentials that the users provide
 * 
 * Return 0 if there is no error and 1 otherwise
 * 
 */
function login_validate(){
        var has_error = 0;

        // validate all inputs
        // username must not include colon and have length <= 20
        if ($("#username").val() == '' || $("#username").val().includes(':') || $("#username").val().length > 20){
                $("#username").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Username is invalid (length must be less than 20)</p>");
                has_error = 1;
        }
        // password must have length >= 3
        if ($("#password").val().length < 3){
                $("#password").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Password is invalid</p>");
                has_error = 1;
        }
        if (has_error){
                return 1;
        }
        return 0;
}

/**
 * 
 * Clear all the errors (highlight) in the login page
 * 
 */
function login_clear_error(){
        $("#username").css("background-color", "");
        $("#password").css("background-color", "");
}

/**
 * 
 * Validate the registration credentials that the users provide
 * 
 * Highlight all invalid fields in the registration page and display messages if any
 * 
 * This function is called when frontend validation fails
 * 
 * Return 0 if there is no error and 1 otherwise
 * 
 */
function register_validate(){
        register_clear_error();
        var has_error = 0;

        // validate all inputs
        // username must not include colon and have length <= 20
        if ($("#reg_username").val() == '' || $("#reg_username").val().includes(':') || $("#reg_username").val().length > 20){
                $("#reg_username").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Username is invalid (length must be less than 20) </p>");
                has_error = 1;
        }
        // password must have length >= 3
        if ($("#reg_password").val().length < 3){
                $("#reg_password").css("background-color", "lightcoral");
                $("#reg_password_again").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Password is invalid (length must be greater than or equal to 3)</p>");
                has_error = 1;
        }
        // password must match
        if ($("#reg_password").val() != $("#reg_password_again").val()){
                $("#reg_password").css("background-color", "lightcoral");
                $("#reg_password_again").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Password doesn't match</p>");
                has_error = 1;
        }
        // email must contain @ and have length >=3
        if ($("#reg_email").val().length < 3 || !$("#reg_email").val().includes('@') || $("#reg_email").val().length > 256){
                $("#reg_email").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Email is invalid (length must be greater than or equal to 3 and less than 256)</p>");
                has_error = 1;
        }
        // phone must match the regex
        var regex_phone = new RegExp("[0-9]{3}-[0-9]{3}-[0-9]{4}");
        if ($("#reg_phone").val().length != 12 || !regex_phone.test($("#reg_phone").val())){
                $("#reg_phone").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Phone is invalid (***-***-****)</p>");
                has_error = 1;
        }
        // birthday must match the regex
        var regex_date = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}");
        var date_check = new Date($("#reg_birthday").val());
        if ($("#reg_birthday").val().length != 10 || !regex_date.test($("#reg_birthday").val()) || isNaN(date_check.getTime())){
                $("#reg_birthday").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Birthday is invalid</p>");
                has_error = 1;
        }
        // level must be one of easy, medium, hard
        if ($("#reg_level").val() != 'easy' && $("#reg_level").val() != 'medium' && $("#reg_level").val() != 'hard'){
                $("#reg_level").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Level is invalid</p>");
                has_error = 1;
        }
        // privacy must be checked
        if (!$("#reg_privacy").prop('checked')){
                $("#reg_privacy").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Privacy is invalid</p>");
                has_error = 1;
        }
        if (has_error){
                return 1;
        }
        return 0;
}

/**
 * 
 * Highlight all invalid fields in the registration page and display messages if any
 * 
 * This function is called when backend validation fails
 * 
 */
function register_show_error(error_response){
        // clear all previous errors
        register_clear_error();

        // display all errors reported by the server
        if ("message" in error_response && error_response["message"] == "Username exists"){
                $("#reg_username").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Username has been taken</p>");
        }
        if ("reg_username" in error_response){
                $("#reg_username").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Username is invalid</p>");
        }
        if ("reg_password" in error_response){
                $("#reg_password").css("background-color", "lightcoral");
                $("#reg_password_again").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Password is invalid</p>");
        }
        if ("reg_email" in error_response){
                $("#reg_email").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Email is invalid</p>");
        }
        if ("reg_phone" in error_response){
                $("#reg_phone").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Phone is invalid</p>");
        }
        if ("reg_birthday" in error_response){
                $("#reg_birthday").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Birthday is invalid</p>");
        }
        if ("reg_level" in error_response){
                $("#reg_level").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Level is invalid</p>");
        }
        if ("reg_privacy" in error_response){
                $("#reg_privacy").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Privacy is invalid</p>");
        }
}

/**
 * 
 * Clear all the errors (highlight) in the registration page
 * 
 */
function register_clear_error(){
        $("#reg_username").css("background-color", "");
        $("#reg_password").css("background-color", "");
        $("#reg_password_again").css("background-color", "");
        $("#reg_email").css("background-color", "");
        $("#reg_phone").css("background-color", "");
        $("#reg_birthday").css("background-color", "");
        $("#reg_level").css("background-color", "");
        $("#reg_privacy").css("background-color", "");
}

/**
 * 
 * Clear all the user inputs in the registration page
 * 
 */
function register_clear_input(){
        $("#reg_username").val("");
        $("#reg_password").val("");
        $("#reg_password_again").val("");
        $("#reg_email").val("");
        $("#reg_phone").val("");
        $("#reg_birthday").val("");
        $("#reg_level").val("easy");
        $("#reg_privacy").prop('checked', false);
}

/**
 * 
 * Validate the profile modification credentials that the users provide
 * 
 * Highlight all invalid fields in the profile page and display messages if any
 * 
 * This function is called when frontend validation fails
 * 
 * Return 0 if there is no error and 1 otherwise
 * 
 */
function profile_validate(){
        profile_clear_error();
        var has_error = 0;

        // validate all inputs
        // username must match the previous one (the one in the authorization header)
        if ($("#profile_username").val() != user_information["username"]){
                $("#profile_username").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Username is not changable</p>");
                has_error = 1;
        }
        if ($("#profile_password").val().length > 0){
                // password must have length >= 3
                if ($("#profile_password").val().length < 3){
                        $("#profile_password").css("background-color", "lightcoral");
                        $("#profile_password_again").css("background-color", "lightcoral");
                        $("#ui_notification").append("<p>Password is invalid (length must be greater than or equal to 3)</p>");
                        has_error = 1;
                }
                // password must match
                if ($("#profile_password").val() != $("#profile_password_again").val()){
                        $("#profile_password").css("background-color", "lightcoral");
                        $("#profile_password_again").css("background-color", "lightcoral");
                        $("#ui_notification").append("<p>Password doesn't match</p>");
                        has_error = 1;
                }
        }
        // email must contain @ and have length >=3
        if ($("#profile_email").val().length < 3 || !$("#profile_email").val().includes('@') || $("#profile_email").val().length > 256){
                $("#profile_email").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Email is invalid (length must be greater than or equal to 3 and less than 256)</p>");
                has_error = 1;
        }
        // phone must match the regex
        var regex_phone = new RegExp("[0-9]{3}-[0-9]{3}-[0-9]{4}");
        if ($("#profile_phone").val().length != 12 || !regex_phone.test($("#profile_phone").val())){
                $("#profile_phone").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Phone is invalid (***-***-****)</p>");
                has_error = 1;
        }
        // birthday must match the regex
        var regex_date = new RegExp("[0-9]{4}-[0-9]{2}-[0-9]{2}");
        var date_check = new Date($("#profile_birthday").val());
        if ($("#profile_birthday").val().length != 10 || !regex_date.test($("#profile_birthday").val()) || isNaN(date_check.getTime())){
                $("#profile_birthday").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Birthday is invalid</p>");
                has_error = 1;
        }
        // level must be one of easy, medium, hard
        if ($("#profile_level").val() != 'easy' && $("#profile_level").val() != 'medium' && $("#profile_level").val() != 'hard'){
                $("#profile_level").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Level is invalid</p>");
                has_error = 1;
        }
        // privacy must be checked
        if (!$("#profile_privacy").prop('checked')){
                $("#profile_privacy").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Privacy is invalid</p>");
                has_error = 1;
        }
        if (has_error){
                return 1;
        }
        return 0;
}

/**
 * 
 * Highlight all invalid fields in the profile page and display messages if any
 * 
 * This function is called when backend validation fails
 * 
 */
function profile_show_error(error_response){
        // clear all previous errors
        profile_clear_error();

        // display all errors reported by the server
        if ("message" in error_response && error_response["message"] == "Username doesn't match"){
                $("#profile_username").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Username is not changable</p>");
        }
        if ("profile_username" in error_response){
                $("#profile_username").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Username is invalid</p>");
        }
        if ("profile_password" in error_response){
                $("#profile_password").css("background-color", "lightcoral");
                $("#profile_password_again").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Password is invalid</p>");
        }
        if ("profile_email" in error_response){
                $("#profile_email").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Email is invalid</p>");
        }
        if ("profile_phone" in error_response){
                $("#profile_phone").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Phone is invalid</p>");
        }
        if ("profile_birthday" in error_response){
                $("#profile_birthday").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Birthday is invalid</p>");
        }
        if ("profile_level" in error_response){
                $("#profile_level").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Level is invalid</p>");
        }
        if ("profile_privacy" in error_response){
                $("#profile_privacy").css("background-color", "lightcoral");
                $("#ui_notification").append("<p>Privacy is invalid</p>");
        }
}

/**
 * 
 * Clear all the errors (highlight) in the profile page
 * 
 */
function profile_clear_error(){
        $("#profile_username").css("background-color", "");
        $("#profile_password").css("background-color", "");
        $("#profile_password_again").css("background-color", "");
        $("#profile_email").css("background-color", "");
        $("#profile_phone").css("background-color", "");
        $("#profile_birthday").css("background-color", "");
        $("#profile_level").css("background-color", "");
        $("#profile_privacy").css("background-color", "");
}

/**
 * 
 * Display all user information based on what the server sends back when login
 * 
 */
function profile_display_input(){
        $("#profile_username").val(user_information["username"]);
        $("#profile_password").val("");
        $("#profile_password_again").val("");
        $("#profile_email").val(user_information["email"]);
        $("#profile_phone").val(user_information["phone"]);
        $("#profile_birthday").val(user_information["birthday"].substring(0, 10));
        $("#profile_level").val(user_information["level"]);
        $("#profile_privacy").prop('checked', true);
}

/**
 * 
 * This function would handle page switching when the user is logged in
 * 
 * The user can go to any page (specify by the argument) from any page
 * 
 */
function switch_page(page){
        $("#ui_notification").empty(); // clear all notifications in the current page
        profile_clear_error(); // clear all errors in profile since the profile page would load the latest information when page switching
        
        // hide all the pages first since we don't keep track of which page the user is currectly in
        $("#ui_play").hide();
        $("#ui_instructions").hide();
        $("#ui_stats").hide();
        $("#ui_profile").hide();

        // clear the highlight in the navigation bar (for indicating which page the user is currently in)
        $("li#profile").css({"background-color": "", "color": "", "border": ""});
        $("li#play").css({"background-color": "", "color": "", "border": ""});
        $("li#instructions").css({"background-color": "", "color": "", "border": ""});
        $("li#stats").css({"background-color": "", "color": "", "border": ""});

        if (page == "play"){
                // go to the game play page

                // add all event listeners in order to make the game function correctly
                document.addEventListener('mousedown', preventSelecting);
                document.addEventListener('keydown', moveByKey);
                document.addEventListener("mousemove", moveMouse);
                document.addEventListener("click", clickMouse);

                // highlight "play" in the navigation bar (for indicating the user is currently in play page)
                $("li#play").css({"background-color": "navy", "color": "white", "border": "2px solid "});
                
                $("#ui_play").show();// show the play page since all other pages should be hidden

                // show the current game status (started, paused or ended)
                if (game_status == 0){
                        $("#ui_notification").append("<p>Game Started (press p to pause the game)</p>");
                } else if (game_status == 1){
                        $("#ui_notification").append("<p>Game Paused (press r to resumn the game)</p>");
                } else if (game_status == 2){
                        $("#ui_notification").append("<p>Game Over (press t to restart the game)</p>");
                }
        } else if (page == "instructions"){
                // remove all event listeners since we don't want the game state to be changed accidentally
                // when user input is received (click, mouse move ...) if the user is not playing the game
                remove_event_listener();

                // highlight "instructions" in the navigation bar (for indicating the user is currently in instructions page)
                $("li#instructions").css({"background-color": "navy", "color": "white", "border": "2px solid "});

                $("#ui_instructions").show(); // show the instructions page since all other pages should be hidden
                if (game_status == 0){
                        pauseGame(); // pause the game if it's not paused already since the user is not playing the game
                }
        } else if (page == "stats"){
                // remove all event listeners since we don't want the game state to be changed accidentally
                // when user input is received (click, mouse move ...) if the user is not playing the game
                remove_event_listener();

                // highlight "stats" in the navigation bar (for indicating the user is currently in stats page)
                $("li#stats").css({"background-color": "navy", "color": "white", "border": "2px solid "});

                // the stats may be outdated so retrieve all the stats from the database again
                retrieve_scores();
                retrieve_numbers_of_enemies();

                $("#ui_stats").show(); // show the stats page since all other pages should be hidden
                if (game_status == 0){
                        pauseGame(); // pause the game if it's not paused already since the user is not playing the game
                }
        } else if (page == "profile"){
                // remove all event listeners since we don't want the game state to be changed accidentally
                // when user input is received (click, mouse move ...) if the user is not playing the game
                remove_event_listener();

                profile_display_input(); // prefill the information based on what the server sends back when the user logs in

                // highlight "profile" in the navigation bar (for indicating the user is currently in profile page)
                $("li#profile").css({"background-color": "navy", "color": "white", "border": "2px solid "});
                $("#ui_profile").show(); // show the profile page since all other pages should be hidden
                if (game_status == 0){
                        pauseGame(); // pause the game if it's not paused already since the user is not playing the game
                }
        } else if (page == "logout"){
                // remove all event listeners since we don't want the game state to be changed accidentally
                // when user input is received (click, mouse move ...) if the user is not playing the game
                remove_event_listener();

                // clear all user information in the profile page since it's confidential to the user
                $("#profile_username").val("");
                $("#profile_email").val("");
                $("#profile_phone").val("");
                $("#profile_birthday").val("");
                $("#profile_level").val("easy");
                $("#profile_privacy").prop('checked', false);
                
                // go to the login page
                $(".ui_nav").hide();
                $("#ui_login").show();
                // since the stats page is shown when the login page is shown, the stats may be outdated, so retrieve from the server again
                retrieve_scores();
                retrieve_numbers_of_enemies();
                $("#ui_stats").show();
        }
}

/**
 * 
 * This function would remove all event listeners
 *
 * This would be called if the user leaves the game play page
 * 
 */
function remove_event_listener(){
        document.removeEventListener('mousedown', preventSelecting);
        document.removeEventListener('keydown', moveByKey);
        document.removeEventListener('mousemove', moveMouse);
        document.removeEventListener('click', clickMouse);
}

function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

class Stage {
	/** 
	 * 
	 * Initialize the game
	 * 
	 */
	constructor(canvas, difficulty){
		this.canvas = canvas;
	
		this.squares=[]; // all squares on this stage (monsters, player, boxes, ...)
		this.player=null; // a special square, the player
	
		// the logical width and height of the stage
		this.width=canvas.width * 1.5; // the width of the stage
		this.height=canvas.height * 1.5; // the height of the stage

		// the mouse location in the stage
		this.mouseX = 0; // the x-coordinate of the mouse in the stage
		this.mouseY = 0; // the y-coordinate of the mouse in the stage

		// the stats of the game
		this.enemies_number = 0; // initial number of enemies
		this.score = 0; // the score of the player
		this.won = 0; // 0 indicates the player loses, 1 indicates the player wins
		this.end = 0; // 0 indicates the game hasn't finished, 1 indicates the game has finished

		// configurations of player and enemies for different levels
		this.player_colour= 'rgba(0,0,255,0.5)';
		this.enemy_color = 'rgba(255,0,0,0.5)';
		if (difficulty == "hard"){
			this.target = 20;
			var total_obstacles=30; // total number of obstacles in the game
			var total_boxes=10; // total number of boxes in the game
			var total_enemies=5; // total number of enemies in the game

			this.player_speed = 8; // this is how fast a player should move
			this.player_health= 80; // this is the limit of the player's health so player's health would never exceed this number (also initial health)
			this.player_bullets = 50; // this is the limit of the player's bullets so player's bullets would never exceed this number (also initial bullets)
			this.player_health_restore_amount = 10; // this is how much health would be added to the player if the player retreats
			this.player_bullets_restore_amount = 10; // this is how many bullets would be added to the player if the player retreats
			
			this.enemy_speed = 10; // this is how fast an enemy should move
			this.enemy_health = 200; // this is how much health an enemy has
			this.enemy_cooldown = 5; // this is how often the enemy shoots
			this.enemy_refresh_rate = 50; // this is how often enemies would be added to the game
			this.enemy_refresh_rate_left = 50; // this is how long until the next enemy would be added
		} else if (difficulty == "medium"){
			this.target = 10;
			var total_obstacles=20;
			var total_boxes=15;
			var total_enemies=4;

			this.player_speed = 10;
			this.player_health= 100;
			this.player_bullets = 100;
			this.player_health_restore_amount = 20;
			this.player_bullets_restore_amount = 20;
			
			this.enemy_speed = 5;
			this.enemy_health = 100;
			this.enemy_cooldown = 10;
			this.enemy_refresh_rate = 100;
			this.enemy_refresh_rate_left = 100;
		} else{
			this.target = 5;
			var total_obstacles=10;
			var total_boxes=20;
			var total_enemies=3;

			this.player_speed = 12;
			this.player_health= 200;
			this.player_bullets = 200;
			this.player_health_restore_amount = 30;
			this.player_bullets_restore_amount = 30;
			
			this.enemy_speed = 3;
			this.enemy_health = 50;
			this.enemy_cooldown = 20;
			this.enemy_refresh_rate = 200;
			this.enemy_refresh_rate_left = 200;
		}

		// Add the player to the center of the stage
		var velocity = new Pair(0,0);
		var length = 40;
		var position = new Pair(Math.floor(this.width/2), Math.floor(this.height/2));
		this.player = new Player(this, position, velocity, this.player_colour, length, this.player_health, this.player_bullets, 
									this.player_health_restore_amount, this.player_bullets_restore_amount);
		this.addPlayer(this.player);

		// Add some enemies
		while(total_enemies>0){
			if (this.addEnemy()){
				total_enemies--;
			}
		}
	
		// Add some Obstacles
		// The length is random, the health corresponds to the length, the color is purple and the position is also random
		while(total_obstacles>0){
			var x=Math.floor((Math.random()*this.width)); 
			var y=Math.floor((Math.random()*this.height)); 
			if(this.getSquare(x,y)===null){
				var velocity = new Pair(0,0);
				var length = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
				var health = length * 5;
				var colour= 'rgba(91, 36, 135, 0.6)';
				var position = new Pair(x,y);
				// check if the obstacles would exceed the world
				if (position.x - length < 0){
					length = position.x // obstacles start from the left bound
				} 
				if (position.x + length > this.width){
					length = this.width - position.x // obstacles end at the right bound
				} 
				if (position.y - length < 0){
					length = position.y // obstacles start from the upper bound
				} 
				if (position.y + length > this.height){
					length = this.height - position.y // obstacles end at the lower bound
				}
				// check if the obstacles disappear (has length 0) after the above adjustments 
				if (length != 0){
					// create the obstacles and add to the list
					// the health of the obstacle would be between 250 and 500
					var obstacle = new Obstacle(this, position, velocity, colour, length, health);
					this.addSquare(obstacle);
					total_obstacles--;
				}
			}
		}

		// Add some Boxes
		// The length is 50, the health is 50, the color is yellow and the position is random
		while(total_boxes){
			var x=Math.floor((Math.random()*this.width)); 
			var y=Math.floor((Math.random()*this.height)); 
			if(this.getSquare(x,y)===null){
				var velocity = new Pair(0,0);
				var length = 50;
				var health = 50;
				var colour= 'rgba(223, 252, 3, 0.6)';
				var position = new Pair(x,y);
				// check if the boxes would exceed the world
				if (position.x - length < 0){
					length = position.x // boxes start from the left bound
				} 
				if (position.x + length > this.width){
					length = this.width - position.x // boxes end at the right bound
				} 
				if (position.y - length < 0){
					length = position.y // boxes start from the upper bound
				} 
				if (position.y + length > this.height){
					length = this.height - position.y // boxes end at the lower bound
				}
				// check if the boxes disappear after the above adjustments 
				if (length != 0){
					// create the boxes and add to the list
					// the health of the boxes would be 50
					var box = new Box(this, position, velocity, colour, length, health);
					this.addSquare(box);
					total_boxes--;
				}
			}
		}
	}

	/** 
	 * 
	 * Add the player to the game
	 * 
	 */
	addPlayer(player){
		this.addSquare(player);
		this.player=player;
	}

	/** 
	 * 
	 * Remove the player from the game
	 * 
	 */
	removePlayer(){
		this.removeSquare(this.player);
		this.end = 1;
		this.draw(); // draw for the last time to correctly display health and player
		this.player=null;
	}

	/**
	 * 
	 * Add an enemy to the game
	 * 
	 * Return 1 if an enemy is successfully added , 0 otherwise
	 * 
	 */
	addEnemy(){
		var x=Math.floor((0.8*Math.random()*this.width)); 
		var y=Math.floor((0.8*Math.random()*this.height)); 
		if(this.getSquare(x,y)===null){
			var velocity = new Pair(0,0);
			var length = 40;
			var position = new Pair(x, y);
			var enemy = new Enemy(this, position, velocity, this.enemy_color, length, this.enemy_health, this.enemy_speed, this.enemy_cooldown);
			this.addSquare(enemy);
			this.enemies_number += 1; // update the enemies number for stats
			return 1;
		}
		return 0;
	}

	/**
	 * 
	 * Add a square to the game
	 * 
	 * Square can be any object in the game such as player, enemy, obstacle, box, bullet ...
	 * 
	 */
	addSquare(square){
		this.squares.push(square);
	}

	/**
	 * 
	 * Remove a square from the game
	 * 
	 * Square can be any object in the game such as player, enemy, obstacle, box, bullet ...
	 * 
	 */
	removeSquare(square){
		// if the player kills an enemy, add 1 to the score
		if (square.type == "enemy"){
			this.score += 1;
			this.enemies_number -= 1;
		}

		// remove the square from squares list
		var index=this.squares.indexOf(square);
		if(index!=-1){
			this.squares.splice(index,1);
		}

		// end the game if score is equal to target
		if (this.score >= this.target){
			// the player has won since score is equal to target
			// remove the player from squares list
			var player_index=this.squares.indexOf(this.player);
			if(player_index!=-1){
				this.squares.splice(player_index,1);
			}
			this.end = 1;
			this.won = 1;
			this.draw(); // draw for the last time to correctly display health, bullets, text, ...
			this.player=null; // there is no player as of now
		}
	}


	/**
	 * 
	 * Take one step in the animation of the game.  Do this by asking each of the squares to take a single step. 
	 * 
	 */
	step(){
		// check if there is any player
		// if not, there shouldn't be any animation since the game is ended
		if (this.player === null){
			return;
		}

		// Ask each square to take a single step
		for(var i=0;i<this.squares.length;i++){
			this.squares[i].step();
		}

		// Check if anyone has health 0 (player, enemy, bullet, ...)
		for(var j=0;j<this.squares.length;j++){
			if (this.squares[j].health <= 0){
				if (this.squares[j] == this.player){
					// the player is dead
					this.removePlayer();
				} else{
					// something else is dead
					this.removeSquare(this.squares[j]);
				}
			}
		}

		// Create more enemies after countdown finishes so the game is more interesting
		this.enemy_refresh_rate_left -= 1;
		if (this.enemy_refresh_rate_left <= 0){
			// countdown has finished so add an enemy
			this.addEnemy();
			// decrease the counter to make the game more challenging
			// enemies would be refreshed more quickly until the limit 20 has been reached
			if (this.enemy_refresh_rate > 20){
				this.enemy_refresh_rate -= 10;
			}
			this.enemy_refresh_rate_left = this.enemy_refresh_rate; // reset the counter
		}
	}

	/**
	 * 
	 * Draw the current game state
	 * 
	 */
	draw(){
		// check if there is any player
		// if not, don't draw anything since the game is ended
		if (this.player === null){
			return;
		}
		var context = this.canvas.getContext('2d');
		context.setTransform(1,0,0,1,0,0); // remove all scaling
		context.clearRect(0, 0, this.width, this.height); // erase everything in the window

		// display health in the upper left corner
		context.font = "22px Verdana";
		if (this.player.health > 0){
			context.fillStyle ='rgba(0,0,255,1)';
		} else{
			context.fillStyle ='rgba(255,0,0,1)';
		}
		context.fillText("Health: " + Math.max(0, this.player.health), 0, 20);

		// display bullets in the upper left corner
		if (this.player.bullets > 0){
			context.fillStyle ='rgba(0,0,255,1)';
		} else{
			context.fillStyle ='rgba(255,0,0,1)';
		}
		context.fillText("Bullets: " + Math.max(this.player.bullets, 0), 0, 40);

		// display score and enemies number in the upper left corner
		context.fillStyle ='rgba(0,0,255,1)';
		context.fillText("Enemies: " + this.enemies_number, 0, 60);
		context.fillText("Score: " + this.score, 0, 80);
		context.fillText("Goal: " + this.target, 0, 100);

		// display how long until the next enemy will be created
		context.fillText("New Enemy Coming In: " + this.enemy_refresh_rate_left / 10 + "s/" + this.enemy_refresh_rate / 10 + "s", 320, 20);

		// display the game result if game has ended
		if (this.end){
			context.font = "128px Courier New oblique bolder";
			if (this.won){
				context.fillStyle ='rgba(78, 161, 11,1)';
				context.fillText("You Won!!!", 0, 320);
			} else{
				context.fillStyle ='rgba(255,0,0,1)';
				context.fillText("You Lost!!!", 0, 320);
			}
			context.font = "22px Verdana";
			context.fillText("move the mouse, click the mouse or press any key to continue", 0, 440);
		}

		// draw crosshair
		context.beginPath();
		context.moveTo(this.mouseX-16, this.mouseY);
		context.lineTo(this.mouseX+16, this.mouseY);
		context.stroke();
		context.beginPath();
		context.moveTo(this.mouseX, this.mouseY - 16);
		context.lineTo(this.mouseX, this.mouseY + 16);
		context.stroke();

		// make the world move
		context.translate(-this.player.x + this.canvas.width / 2, -this.player.y + this.canvas.height / 2);

		// draw all the squares of the game (play, enemy, bullet, box, ...)
		for(var i=0;i<this.squares.length;i++){
			this.squares[i].draw(context);
		}

		// draw the border
		context.strokeStyle = "blue";
		context.beginPath();
		context.rect(0, 0, this.width,this.height);
		context.stroke();
	}

	/**
	 * 
	 * Set the currently location of the mouse in order to display crosshair and fire
	 * 
	 */
	updateMouseLocation(clientX, clientY){
		var stageLocation = this.canvas.getBoundingClientRect(); // the location of the stage
		this.mouseX = clientX - stageLocation.left; // get the vertical mouse location in the stage
		this.mouseY = clientY - stageLocation.top; // get the horizontal mouse location in the stage

		// make sure the crosshair stay in window if the user moves the mouse outside of the canvas
		if (this.mouseX < 0){
			this.mouseX = 0;
		}
		if (this.mouseX > this.canvas.width){
			this.mouseX = this.canvas.width;
		}
		if (this.mouseY < 0){
			this.mouseY = 0;
		}
		if (this.mouseY > this.canvas.height){
			this.mouseY = this.canvas.height;
		}
	}

	/**
	 * 
	 * User clicks the mouse so make the player fire
	 * 
	 */
	playerFire(){
		// check if there is any player
		// if not, the click doesn't fire
		if (this.player === null){
			return;
		}
		this.player.fire(this.mouseX, this.mouseY); //  make the player fire in the game
	}

	/**
	 * 
	 * The user presses e so make the player retreat
	 * 
	 */
	retreat(){
		this.player.retreat(); // make the player retreat in the game
	}

	// return the first square at coordinates (x,y) return null if there is no such square
	getSquare(x, y){
		for(var i=0;i<this.squares.length;i++){
			if(this.squares[i].x==x && this.squares[i].y==y){
				return this.squares[i];
			}
		}
		return null;
	}
} // End Class Stage


class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}

	normalize(){
		var magnitude=Math.sqrt(this.x*this.x+this.y*this.y);
		this.x=this.x/magnitude;
		this.y=this.y/magnitude;
	}
}

/**
 * 
 * Suqare can be anything in the game: player, enemy, box, obstacle, bullet, ...
 * 
 */
class Square {
	constructor(stage, position, velocity, colour, length, health){
		this.stage = stage;
		this.position=position;
		this.intPosition(); // this.x, this.y are int version of this.position

		this.velocity=velocity;
		this.colour = colour;// this is the colour of the suqare
		this.length = length; // this is the length of the suqare
		this.health = health; // this is the health of the suqare
		this.type = "general"; // indicate what type is this square
	}
	
	headTo(position){
		this.velocity.x=(position.x-this.position.x);
		this.velocity.y=(position.y-this.position.y);
		this.velocity.normalize();
	}

	toString(){
		return this.position.toString() + " " + this.velocity.toString();
	}

	intPosition(){
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	/**
	 * 
	 * Move the square
	 * 
	 * Since not everything can move (obstacle, box), this function just implements rebound
	 * Specific behavious would be implemented in the inherited classes
	 * 
	 */
	step(){
		// check if there is any player
		// if not, the square is not supposes to move since the game is ended
		if (this.stage.player === null){
			return;
		}
		// bounce off the walls
		if(this.position.x<0){
			this.position.x=0;
			this.velocity.x=Math.abs(this.velocity.x);
		}
		if(this.position.x>this.stage.width-this.length){
			this.position.x=this.stage.width-this.length;
			this.velocity.x=-Math.abs(this.velocity.x);
		}
		if(this.position.y<0){
			this.position.y=0;
			this.velocity.y=Math.abs(this.velocity.y);
		}
		if(this.position.y>this.stage.height-this.length){
			this.position.y=this.stage.height-this.length;
			this.velocity.y=-Math.abs(this.velocity.y);
		}

		this.intPosition();
	}
}


/**
 * 
 * Obstacle cannot move, but if a dog fires next to it, the damage of the bullet would increase
 * 
 */
class Obstacle extends Square {
	constructor(stage, position, velocity, colour, length, health){
		super(stage, position, velocity, colour, length, health);
		this.type = "obstacle"; // indicate this square is an obstacle
	}

	draw(context){
		// display health
		context.fillStyle ='rgba(63,209,46,1)';
		context.font = "16px Verdana";
		context.fillText(this.health, this.x, this.y - 5);
		// display obstacles
		context.fillStyle = this.colour;
   		context.fillRect(this.x, this.y, this.length,this.length);
	}

	step(){
	}
}


/**
 * 
 * Box cannot move, but if a user presses e next to it, the player would reload bullets and increase health
 * 
 */
class Box extends Square {
	constructor(stage, position, velocity, colour, length, health){
		super(stage, position, velocity, colour, length, health);
		this.type = "box"; // indicate this square is a box
	}

	draw(context){
		// display health
		context.fillStyle ='rgba(63,209,46,1)';
		context.font = "16px Verdana";
		context.fillText(this.health, this.x, this.y - 5);
		// display boxes
		context.fillStyle = this.colour;
   		context.fillRect(this.x, this.y, this.length,this.length);
	}

	step(){
	}
}

class Bullet extends Square {
	constructor(stage, position, velocity, colour, length, health, source, damage){
		super(stage, position, velocity, colour, length, health);
		this.health = 10; // bullet should be destroyed as soon as it hits anything
		this.type = "bullet"; // indicate this square is a bullet
		this.source = source; // this is which party the bullet is from, player or enemy
		this.damage = damage; // this is how much damage the bullet would cause if it hits something
	}

	draw(context){
		// display bullet
		context.fillStyle = this.colour;
   		context.fillRect(this.x, this.y, this.length, this.length);
	}

	/**
	 * 
	 * Move the bullet and check if anything is hit
	 * 
	 */
	step(){
		// check if there is any player
		// if not, the bullet is not supposes to move since the game has ended
		if (this.stage.player === null){
			return;
		}

		// Move the bullets
		this.position.x=this.position.x+this.velocity.x; 
		this.position.y=this.position.y+this.velocity.y;

		// Check if the bullets hit anything
		for(var i=0;i<this.stage.squares.length;i++){
			if (this.stage.squares[i] != this){ // the bullets cannot hit thenselves
				// Check if the bullets coincide with another square (obstacles, player, enemies)
				// The following expression is left || right || above || below. If all of them are false, the bullet hits something.
				if (!( this.position.x + this.length <= this.stage.squares[i].x || this.position.x >= this.stage.squares[i].x + this.stage.squares[i].length || 
						this.position.y >= this.stage.squares[i].y + this.stage.squares[i].length || this.position.y + this.length <= this.stage.squares[i].y )){
					if (this.source == "player" && this.stage.squares[i].type == "player"){ // bullet from the player hits the player
					} else if (this.source == "enemy" && this.stage.squares[i].type == "enemy"){ // bullet from an enemy hits an enemy
					} else if (this.stage.squares[i].type == "bullet" && this.source == this.stage.squares[i].source){ // two bullets from same team
					} else{
						this.stage.squares[i].health -= this.damage; // decrease the health of the other square since it's not friendly fire
						this.health = 0; // the bullet would disappear since it has already hit something
						return;
					}
				}
			}
		}
		// decrease the bullets health (to make them disappear after a certain amount of time)
		this.health -= 0.5;
		super.step(); // make the bullets bounce off wall
	}
}

class Dog extends Square {
	draw(context){
		// draw eyes
		context.fillStyle ='rgba(0,0,0,1)';
		context.beginPath(); 
		context.arc(this.x + 12, this.y + 14, 3, 0, 2 * Math.PI, false); 
		context.fill();
		context.beginPath(); 
		context.arc(this.x + 28, this.y + 14, 3, 0, 2 * Math.PI, false); 
		context.fill();
		// draw nose
		context.beginPath(); 
		context.arc(this.x + 20, this.y + 28, 7, 0, 2 * Math.PI, false);
		context.fill();
		// draw Dog (actual square) 
		context.fillStyle = this.colour;
   		context.fillRect(this.x, this.y, this.length,this.length);
	}

	/**
	 * 
	 * Move the dog and check if it overlaps with something
	 * 
	 */
	step(){
		// check if there is any player
		// if not, the dog is not supposes to move since the game has already ended
		if (this.stage.player === null){
			return;
		}

		// Move the square horizontally
		this.position.x=this.position.x+this.velocity.x; 

		// In case of two sqaures overlap, make their edges coincide (so intersection would not happen)
		var x_adjustment = 0; // this is how much we should move the square horizontally in order to make their edges coincide
		for(var i=0;i<this.stage.squares.length;i++){
			if (this.stage.squares[i] != this){
				// The following expression is left || right || above || below. If all of them are false, two squares must intersect.
				if (!( this.position.x + this.length <= this.stage.squares[i].x || this.position.x >= this.stage.squares[i].x + this.stage.squares[i].length || 
						this.position.y >= this.stage.squares[i].y + this.stage.squares[i].length || this.position.y + this.length <= this.stage.squares[i].y )){
					// two squares intersect
					if (this.stage.squares[i].type == "bullet"){
						// the square is a bullet
						if (this.stage.squares[i].source == "player" && this.type == "player"){ // the bullet is from player and hits player
						} else if (this.stage.squares[i].source == "enemy" && this.type == "enemy"){ // the bullet is from enemy and hits enemy
						} else{
							this.health -= this.stage.squares[i].damage; // decrease the health of the dog
							this.stage.squares[i].health = 0; // the bullet would disappear since it has already hit the dog
						}
					} else{
						// The square is not a bullet
						// Two squares intersect, so adjust the square horizontally in order to make their edges coincide
						x_adjustment = Math.min(Math.abs(this.position.x + this.length - this.stage.squares[i].x), Math.abs(this.position.x - this.stage.squares[i].x - this.stage.squares[i].length));
						if (this.velocity.x > 0){
							x_adjustment = Math.abs(x_adjustment);
						} else{
							x_adjustment = -Math.abs(x_adjustment);
						}
					}
				}
			}
		}
		this.position.x=this.position.x-x_adjustment; // adjust the square horizontally

		this.position.y=this.position.y+this.velocity.y;// move the square vertically

		// In case of two sqaures overlap, make their edges coincide (so intersection would not happen)
		var y_adjustment = 0; // this is how much we should move the square vertically in order to make their edges coincide
		for(var i=0;i<this.stage.squares.length;i++){
			if (this.stage.squares[i] != this){
				// The following expression is left || right || above || below. If all of them are false, two squares must intersect.
				if (!( this.position.x + this.length <= this.stage.squares[i].x || this.position.x >= this.stage.squares[i].x + this.stage.squares[i].length || 
						this.position.y >= this.stage.squares[i].y + this.stage.squares[i].length || this.position.y + this.length <= this.stage.squares[i].y )){
					// two squares intersect
					if (this.stage.squares[i].type == "bullet"){
						// the square is a bullet
						if (this.stage.squares[i].source == "player" && this.type == "player"){ // the bullet is from player and hits player
						} else if (this.stage.squares[i].source == "enemy" && this.type == "enemy"){ // the bullet is from enemy and hits enemy
						} else{
							this.health -= this.stage.squares[i].damage; // decrease the health of the dog
							this.stage.squares[i].health = 0; // the bullet would disappear since it has already hit the dog
						}
					} else{
						// The square is not a bullet
						// Two squares intersect, so adjust the square vertically in order to make their edges coincide
						y_adjustment = Math.min(Math.abs(this.position.y + this.length - this.stage.squares[i].y), Math.abs(this.position.y - this.stage.squares[i].y - this.stage.squares[i].length));						
						if (this.velocity.y > 0){
							y_adjustment = Math.abs(y_adjustment);
						} else{
							y_adjustment = -Math.abs(y_adjustment);
						}
					}
				}
			}
		}
		this.position.y=this.position.y-y_adjustment; // adjust the square vertically

		super.step(); // make the dog bounce off wall
	}

	/**
	 * 
	 * Make the player fire
	 * 
	 */
	fire(target_x, target_y){
		if (this.type == "player"){
			// the player fires
			// check if the player has enough bullets
			if (this.bullets <= 0){
				return;
			}
			this.bullets -= 1;
			var actual_x = this.stage.canvas.width / 2 + this.length / 2; // the x-coordinate of the crosshair in the game
			var actual_y = this.stage.canvas.height / 2 + this.length / 2; // the y-coordinate of the crosshair in the game
		}
		else{
			var actual_x = this.position.x; // the x-coordinate of the shooter (enemy)
			var actual_y = this.position.y; // the y-coordinate of the shooter (enemy)
		}
		var velocity = new Pair(-(actual_x - target_x) / 10, -(actual_y - target_y) / 10); // calculate the velocity of the bullets
		var obstacles_around = this.check_beside()[0]; // check how many obstacles the dog is next to
		if (obstacles_around > 0){
			// the dog is currently next to some obstacles, so increase the size and damage of the bullet
			var length = 5 + 5 * obstacles_around;
			var damage = 10 + 10 * obstacles_around;
		} else{
			// the dog is not next to an obstacle, so normal bullet would be fired
			var length = 5;
			var damage = 10;
		}
		var health = 10;
		var position = new Pair(this.position.x + this.length / 2, this.position.y + this.length / 2);
		var bullet = new Bullet(this.stage, position, velocity, this.colour, length, health, this.type, damage); // create a new bullet
		this.stage.addSquare(bullet);
	}

	/**
	 * 
	 * This function checks if the dog is next to an obstacle or box
	 * 
	 * Return [obstacle_num and box_num] where obstacle_num is the number of obstacles and box_num is the number of boxes
	 * 
	 */
	check_beside(){
		var obstacle_num = 0;
		var box_num = 0;
		for(var i=0;i<this.stage.squares.length;i++){
			if (this.stage.squares[i] != this){
				// the following expression is left || right || above || below. If all of them are false, two squares must intersect.
				if (!( this.position.x + this.length < this.stage.squares[i].x || this.position.x > this.stage.squares[i].x + this.stage.squares[i].length || 
						this.position.y > this.stage.squares[i].y + this.stage.squares[i].length || this.position.y + this.length < this.stage.squares[i].y )){
					// two squares intersect (the dog is next to something)
					if (this.stage.squares[i].type == "obstacle"){
						// the dog is next to the obstacle
						obstacle_num += 1;
					} else if (this.stage.squares[i].type == "box"){
						// the dog is next to the box
						box_num += 1;
					}
				}
			}
		}
		return [obstacle_num, box_num];
	}
}


class Player extends Dog {
	constructor(stage, position, velocity, colour, length, health, bullets, health_restore_amount, bullets_restore_amount){
		super(stage, position, velocity, colour, length, health);
		this.type = "player"; // indicate the square is a player
		this.bullets = bullets; // keep track of the amount of bullets that the player has
		this.health_restore_amount = health_restore_amount; // this is how much health would be added when user presses e
		this.bullets_restore_amount = bullets_restore_amount; // this is how many bullets would be added when user presses e
	}

	/**
	 * 
	 * The user presses e and requests to retreat (add health and bullets)
	 * 
	 */
	retreat(){
		// check if the player is next to a box since the player must retreat beside a box
		if (super.check_beside()[1] > 0){
			// the player is currently next to a box so add health and bullets
			this.health += this.health_restore_amount;
			this.bullets += this.bullets_restore_amount;
			// make sure the player health doesn't exceed the limit
			if (this.health > this.stage.player_health){
				this.health = this.stage.player_health;
			}
			// make sure the player bullets doesn't exceed the limit
			if (this.bullets > this.stage.player_bullets){
				this.bullets = this.stage.player_bullets;
			}
		}
	}
}


class Enemy extends Dog {
	constructor(stage, position, velocity, colour, length, health, speed, cooldown){
		super(stage, position, velocity, colour, length, health);
		this.type = "enemy"; // indicate the square is an enemy
		this.speed = speed; // this is how fast the enemy would go
		this.cooldown = cooldown; // this is how often the enemy fires
		this.cooldown_remaining  = cooldown; // this is how long until the enemy fires again
	}

	draw(context){
		// display health on top of the enemy
		context.fillStyle ='rgba(63,209,46,1)';
		context.font = "16px Verdana";
		context.fillText(this.health, this.x, this.y - 5);
		super.draw(context);
	}

	/**
	 * 
	 * Move the enemy towards player and check if it overlaps with anything
	 * 
	 * Also, the enemy would fire if the cooldown expires
	 * 
	 */
	step(){
		// check if there is any player
		// if not, the enemy is not supposes to move since the game has ended
		if (this.stage.player === null){
			return;
		}
		// check which direction the enemy should go since enemy should always move towards the player
		var x_distance = this.x - this.stage.player.x;
		var y_distance = this.y - this.stage.player.y;
		var x_velocity = 0;
		var y_velocity = 0;
		// assign the velocity so the enemy can move to the player
		if (y_distance > 0){ // enemy is below the player
			y_velocity = -this.speed;
		} else if (y_distance < 0){ // enemy is above the player
			y_velocity = this.speed;
		}
		if (x_distance > 0){ // enemy is to the right of the player
			x_velocity = -this.speed;
		} else if (x_distance < 0){ // enemy is to the left of the player
			x_velocity = this.speed;
		}
		this.velocity = new Pair(x_velocity,y_velocity);

		super.step(); // move the enemy and check if it overlaps with anything

		if (this.cooldown_remaining <= 0){
			// the cooldown has finished so the enemy should fire towards player
			super.fire(this.stage.player.position.x, this.stage.player.position.y);
			this.cooldown_remaining = this.cooldown; // reset the cooldown so the enemy can fire again later
		} else{
			// the cooldown hasn't finished yet
			this.cooldown_remaining -= 1;
		}
	}
}

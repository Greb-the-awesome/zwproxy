var canvas, ctx, log, intervalHandle, nameBox, shareBtn, sTickHandle, lTickHandle, player, mouseDown, relPosX, relPosY;
const canvasWidth = window.innerWidth;
const canvasHeight = window.innerHeight - 50;
var downKeys = {};
const widthIncrement = canvasWidth/100;
const heightIncrement = canvasHeight/100;
var bullets = [];
var zombies = [];
var frameNumber = 0;
var score = 0;
var difficulty = 0;
var paused = false;
var initAlready = false;
var snowflakes = [];
var horses = [];
var items = [];
var shootHandles = [];
var walls = [];
var askPickUp = [false, false];
var frameDelay = 10;
var canPause = true;
var nades = [];
var explosions = [];
var time = 0;
var wave;
var oldwave = 0;
var calculatedSpawnChance = 0;
var weapons;
// hi

console.log("main script loaded.");

{
	let a = new XMLHttpRequest();
	a.onreadystatechange = function() {
		if (this.readyState == 4) {
			weapons = JSON.parse(this.responseText);
		}
	}
	a.open("GET", "/static/zombiegame_updated/weapons.json", true);
	a.send(null);
}

// needs to go
function onMouseMove(e) {
	relPosX = e.offsetX - player.posX;
	relPosY = e.offsetY - player.posY;

	if (relPosX >= 0 && relPosY >= 0) { // bottom right
		player.angle = Math.atan(relPosY / relPosX);
	}
	else if (relPosX <= 0 && relPosY >= 0) { // bottom left
		player.angle = Math.PI * 0.5 + Math.atan(Math.abs(relPosX) / relPosY);
	}
	else if (relPosX <= 0 && relPosY <= 0) { // top left
		player.angle = Math.PI + Math.atan(Math.abs(relPosY) / Math.abs(relPosX));
	}
	else { // top right
		player.angle = Math.atan(relPosX / Math.abs(relPosY)) - Math.PI * 0.5;
	}
}


function onLoad() {
	// canvas stuffs
	// needs to go
	canvas = document.getElementById("canv");
	ctx = canvas.getContext("2d");
	canvas.setAttribute("width", canvasWidth);
	canvas.setAttribute("height", canvasHeight);
	canvas.imageSmoothingEnabled = false;

	// keys
	// for(let i=0; i<10; i++) {
	//     downKeys[i] = false;
	// }

	// canvas settings
	ctx.fillStyle = "#FF0000";
	ctx.font = "30px Helvetica";
	

	var i = window.setInterval(function() {
		if (
			loadedImgs["gun"] &&
			loadedImgs["horseUnridable"] &&
			loadedImgs["nuke"] &&
			loadedImgs["opgun"] &&
			loadedImgs["egg"] &&
			loadedImgs["m1887"] &&
			loadedImgs["medkit"] &&
			loadedImgs["medicine"] &&
			loadedImgs["aa12"] &&
			loadedImgs["snowflake"] &&
			loadedImgs["snowball"] &&
			loadedImgs["wall"] &&
			loadedImgs["mk2"] &&
			loadedImgs["nade"] &&
			loadedImgs["smiteSword"]
			) {
			document.getElementById("loadingMsg").classList.add("invisible");
			console.log("all images loaded. gameInit()");
			gameInit();
			window.clearInterval(i);
		}
	}, 10);
	var showItems = document.querySelectorAll(".pauseMenu");
	for (let i=0;i<showItems.length;i++) {
		showItems[i].style.display = "none";
	}
	window.setInterval(function() {
		// document.getElementById("wavedefeat").innerHTML = "SURVIVED WAVE " + wave;
		// setTimeout(()=>{document.getElementById("wavedefeat").innerHTML = "";}, 1000);
	}, 10000);
}

function stop() {
	window.clearInterval(intervalHandle);
	window.clearInterval(sTickHandle);
	window.clearInterval(lTickHandle);
}

function sTick() {
	if (Math.floor(Math.random() * 50) == 3) {
		horses.push(new Horse(Math.floor(Math.random() * 4), Math.floor(Math.random() * 100)));
	}
	for (let i=0; i<items.length; i++) {
		items[i].timer += 1;
		if (items[i].timer > 150) {
			items.splice(i, 1);
		}
	}
}

function lTick() {
	for(let i=0; i<zombies.length; i++) {
		var zombieInQuestion = zombies[i];
		var toSplice = [];
		// check zombie collide with player
		if (false) {
			console.log("player.meeleeDamaging == true");
			if (checkCollision(zombieInQuestion, player.meeleeDamaging)) {
				console.log("zombie hit by sword");
				zombieInQuestion.health -= /*player.meeleeDamaging.damage*/1000000;
				if (zombieInQuestion.health <= 0) {
					toSplice.push(i);
					zombies[i] = false;
				}
			}
		}
		try { // idk why there is `undefined` in zombies list but yea to prevent errors we have try catch here
		if(checkCollision(zombieInQuestion, player)) {
			player.health -= zombieInQuestion.damage;
			frameNumber = 0;
			if(player.health <= 0) { // o o f
				die();
			}
		}}
		catch (TypeError) {}
	}
	if (toSplice) {
		for (let i=0;i<toSplice.length;i++) {zombies.splice(toSplice[i], 1);}
	}
}

function die() {
	stop();
	canPause = false;

	ctx.fillStyle = "#000000";
	ctx.globalAlpha = 0.2;
	ctx.fillRect(0,0, canvasWidth, canvasHeight);
	ctx.globalAlpha = 1;
	ctx.fillText("You Died. Your score was " + score, canvasWidth/2-widthIncrement*9, canvasHeight/2);

	nameBox.classList.remove("invisible");
	shareBtn.classList.remove("invisible");
	shareBtn.onClick = (e) => postScores();
}

function onScroll(event) {
	event.preventDefault();
	if (!player.usingMed && !player.cookingNade) {
		if (event.deltaY > 0) {
			if (player.invSelect > 2) {player.invSelect = 0;} else {player.invSelect += 1;}
		} else {
			if (player.invSelect < 1) {player.invSelect = 3;} else {player.invSelect -= 1;}
		}
	}
}
	

function onMouseDown() {
	mouseDown = true;
}

function onMouseUp() {
	mouseDown = false;
	if (player.cookingNade) {
		player.throwNades();
	}
}

function gameInit() {
	// listen
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
	window.addEventListener("mousemove", onMouseMove);
	window.addEventListener("mousedown", onMouseDown);
	window.addEventListener("mouseup", onMouseUp);
	window.addEventListener("wheel", onScroll, {passive:false});

	player = new Player();

	// l o o p o o l
	intervalHandle = window.setInterval(gameLoop, frameDelay);
	sTickHandle = window.setInterval(sTick, 100);
	lTickHandle = window.setInterval(lTick, 500);

	initAlready = true;

	nameBox = document.getElementById("nameBox");
	shareBtn = document.getElementById("share");
	console.log("game init (gameInit())");
}

function onKeyDown(event) {
	if (event.repeat) {return};
	var keyCode = event.keyCode;
	downKeys[keyCode] = true;
	if (keyCode == 80 && canPause) { // p
		if (!paused) {
			stop();
			paused = true;
			var showItems = document.querySelectorAll(".pauseMenu");
			for (let i=0;i<showItems.length;i++) {
				showItems[i].style.display = "block";
			}
		}
		else {
			intervalHandle = window.setInterval(gameLoop, frameDelay);
			sTickHandle = window.setInterval(sTick, 100);
			lTickHandle = window.setInterval(lTick, 500);

			paused = false;
			var showItems = document.querySelectorAll(".pauseMenu");
			for (let i=0;i<showItems.length;i++) {
				showItems[i].style.display = "none";
			}
		}
	} else if (keyCode == 49) { // 1
		player.invSelect = 0;
	} else if (keyCode == 50) { // 2
		player.invSelect = 1;
	} else if (keyCode == 51) { // 3
		player.invSelect = 2;
	} else if (keyCode == 52) { // 4
		player.invSelect = 3;
	} else if (keyCode == 16) { // shift
		player.speed = widthIncrement / 5;
		player.width = widthIncrement * 4;
	} else if (keyCode == 82 && player.selected.type == "gun") { // r
		player.reloading = true;
		setTimeout(()=>{player.reloading = false;player.selected.roundsRemaining = player.selectSpecs.capacity;}, player.selectSpecs.reloadTime);
	} else if (keyCode == 32) {
		if (player.cookingNade) {
			player.throwNades();
		}
	}
}

function onKeyUp(event) {
	var keyCode = event.keyCode;
	downKeys[keyCode] = false;
	if (keyCode == 32) {
		for (let i=0; i<shootHandles.length; i++) {
			window.clearInterval(shootHandles[i]);
		}
		if (player.cookingNade && player.nadeTimer == 0) {
			player.throwNades();
		}
	}
}

// collison detection function
function checkCollision(thing1, thing2) {
	var x1bc = thing1.posX + thing1.width/2;
	var y1bc = thing1.posY + thing1.height/2;
	var x2bc = thing2.posX + thing2.width/2;
	var y2bc = thing2.posY + thing2.height/2;
	if(Math.abs(x1bc-x2bc) < thing1.width/2 + thing2.width/2 &&
		Math.abs(y1bc-y2bc) < thing1.height/2 + thing2.height/2) {
		return true;
	}
	else {
		return false;
	}
}

// same as ^^ but returns which side collision was done
// directions = pos of thing2 relative to thing1
// so if its like
// thing2 thing1
// it would return "left"
// u gotta be careful tho cos reasons that only I know and im too lazy to explain
function advancedCollisionCheck(thing1, thing2) {
	var x1bc = thing1.posX + thing1.width/2;
	var y1bc = thing1.posY + thing1.height/2;
	var x2bc = thing2.posX + thing2.width/2;
	var y2bc = thing2.posY + thing2.height/2;
	var distanceX = x1bc - x2bc;
	var distanceY = y1bc - y2bc;
	var Lcollide, Rcollide, Ucollide, Dcollide;
	if (distanceX > 0 && distanceX < thing1.width/2 + thing2.width/2) {
		Rcollide = true;
	}
	if (distanceX < 0 && distanceX > -(thing1.width/2 + thing2.width/2)) {
		Lcollide = true;
	}
	if (distanceY > 0 && distanceY < thing1.height/2 + thing2.height/2) {
		Dcollide = true;
	}
	if (distanceY < 0 && distanceY > -(thing1.height/2 + thing2.height/2)) {
		Ucollide = true;
	}
	return {"up":Ucollide,"down":Dcollide,"left":Lcollide,"right":Rcollide};
}

function calcSpawnChance(x) {
	return 2 * x**0.625 * Math.abs(x - Math.floor(x + 0.5)); // plot it in desmos and you'll see
}
// ------- helper functions for dropItems -------
function newItem(tier, name, x, y) {
	var info = weapons[tier][name];
	items.push(new Item(x, y, name, imgs[info.image], info.type,
					info.specs, 1));
	console.log("new item", tier, name)
}
function randChoice(l) {
	a = Object.keys(l);
	return l[a[Math.floor(Math.random() * a.length)]];
}
// ------- the actual function -------
function dropItems(lmgAdvantage, advancedWave, numItems, x, y) {
	console.log("we are dropping an item");
	for (let i=0; i<numItems; i++) {
		var rand = Math.floor(Math.random() * ((lmgAdvantage?3:1) + 4));
		console.log("oye were droppinge")
		if (rand == 0) { // switch case wasnt working for some odd reason
			var toDrop = randChoice(weapons.badTier);
			newItem("badTier", toDrop, x, y);
			console.log("dropped badtier");
		}
		switch (rand) {
			case 0: // bad tier
				var toDrop = randChoice(weapons.badTier);
				newItem("badTier", toDrop, x, y);
				console.log("dropped badtier");
				break;
			case 1: // ok tier
				var toDrop = randChoice(weapons.okTier);
				newItem("okTier", toDrop, x, y);
				console.log("dropped oktier");
				break;
			case 2: // good tier
				var toDrop = randChoice(weapons.goodTier);
				newItem("goodTier", toDrop, x, y);
				break;
			case 3: // op tier
				var toDrop = randChoice(weapons.opTier);
				newItem("opTier", toDrop, x, y);
				break;
			default:
				console.log("l m g m l");
		}
		if (rand >= 4) { // it's an lmg
			var toDrop = randChoice(weapons.lmg);
			newItem("lmg", toDrop, x, y);
		}
	}
}

function checkZombieCollideBullet(b,z) {
	var toSplice = [];
	for(let i=0; i<b.length; i++) {
		for(let j=0; j < z.length; j++) {
			if(z[j]&&checkCollision(b[i], z[j])) {
				z[j].health -= b[i].damage;
				b.splice(i, 1);
				if(zombies[j].health <= 0) { // da zombie ded
					
					if (false) {
						try {
						dropItems(wave == 1, false, 1, z[j].posX, z[j].posY);}
						catch (TypeError) {}
						console.log("we must drop an item");
					}
					if (Math.floor(Math.random() * 7) == 3) {
						switch (Math.floor(Math.random() * 11)) {
							case 1:
								items.push(new Item(z[j].posX, z[j].posY, "egg", imgs.eggImg, "other.consumable", {"onclick":
								(x, y)=>{
									player.speed = widthIncrement / 2;
									player.width = widthIncrement * 8;
								}}, 1));
							case 2:
								items.push(new Item(z[j].posX, z[j].posY, "M249", imgs.opGunImg, "gun",
									{"damage":50,"color":"#00FFFF","capacity":100,"reloadTime":3000,"delay":50,"shotgun":false,"size":1}, 1));
								break;
							case 3:
								items.push(new Item(z[j].posX, z[j].posY, "kar98k", imgs.kar98Img, "gun",
									{"damage":50,"color":"#99DDDD","capacity":10,"reloadTime":2450,"delay":500,"shotgun":false,"size":1}, 1));
								break;
							case 4:
								items.push(new Item(z[j].posX, z[j].posY, "AK-47", imgs.akImg, "gun",
									{"damage":50,"color":"#FFFF00","capacity":30,"reloadTime":1800,"delay":80,"shotgun":false,"size":1}, 1));
								break;
							case 5:
								items.push(new Item(z[j].posX, z[j].posY, "M1918 BAR", imgs.m1918Img, "gun",
									{"damage":40,"color":"#a88f32","capacity":20,"reloadTime":2000,"delay":100,"shotgun":false,"size":1}, 1));
								break;
							case 6:
								items.push(new Item(z[j].posX, z[j].posY, "QCW-05", imgs.qcwImg, "gun",
									{"damage":100,"color":"#00DD00","capacity":50,"reloadTime":2000,"delay":25,"shotgun":false,"size":1}, 1));
								break;
							case 7:
								items.push(new Item(z[j].posX, z[j].posY, "M1887", imgs.m1887Img, "gun",
									{"damage":25,"color":"#FF0000","capacity":5,"reloadTime":2000,"delay":700,"shotgun":true,"spread":0.35,"rpc":5,"size":0.7}, 1));
								break;
							case 8:
								items.push(new Item(z[j].posX, z[j].posY, "medkit", imgs.medkitImg, "heal",
									{"time":2000,"healthRestore":100}, 1));
							case 9:
								items.push(new Item(z[j].posX, z[j].posY, "medicine", imgs.medicineImg, "heal",
									{"time":1000,"healthRestore":50}, 1));
							case 10:
								items.push(new Item(z[j].posX, z[j].posY, "AA-12", imgs.aa12Img, "gun",
									{"damage":25,"color":"#FF0000","capacity":20,"reloadTime":2000,"delay":200,"shotgun":true,"spread":0.4,"rpc":7,"size":0.7}, 1));
						}
						if (Math.floor(Math.random() * 5) == 3) {
							items.push(new Item(z[j].posX + 20, z[j].posY + 20, "snowball", imgs.snowballImg, "gun",
									{"damage":100,"color":"#94aeb0","capacity":1,"reloadTime":200,"delay":200,"shotgun":false,"size":3}, 1));
						}
						if (Math.floor(Math.random() * 5) == 3) {
							items.push(new Item(z[j].posX + 20, z[j].posY + 20, "wall", imgs.wallImg, "wall",
								{"color":"#000000","health":200}, 32))
						}
						
					}
					z.splice(j, 1);
					
					score += 20;	
				}
			}
		}
	}
}

function postScores() {
	var req = new XMLHttpRequest();
	var name = nameBox.value;
	req.open("GET", "/postScores?score="+score.toString()+"&name="+name, true);
	req.send(null);
}
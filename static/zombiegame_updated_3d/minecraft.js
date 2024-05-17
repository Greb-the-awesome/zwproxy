// yes, I know the name of this file is minecraft.js.
// I was going to make minecraft but then I had another idea
// and I was too lazy to rename :/

var PLAYERID = Date.now();
var chunks, gl;
var debugDispNow = {"hi":"hi"};
var locations = {};
var bullets = [];
var zombies = [];
var vaxBullets = [];
var particles = [];
var numEnokers = 0;
var oTex;
var sio;
var useSound = true;
var settings = {};
var skyColors = [ // each one lasts for around 1/8 of a day
[0.529, 0.807, 0.921], // sky blue: morning
[0.784, 0.976, 0.98], // a bit lighter: noon
[0.529, 0.807, 0.921], // sky blue: afternoon
[0.98, 0.513, 0.078], // orange: sunset
[0.337, 0.482, 0.749], // dusk
[0.086, 0.211, 0.439], // midnight
[0.337, 0.482, 0.749], // dawn
[0.968, 0.105, 0.278], // sunrise
[0.529, 0.807, 0.921] // morning again
];
const COLORS = {
	red: [71/texW, 161/texH],
	grey: [199/texW, 219/texH], gray: [199/texW, 219/texH], // to avoid typos
	clearblue: [248/texW, 250/texH],
	clearwhite: [239/texW, 250/texH],
	yellow: [231/texW, 250/texW],
	brown: [251/texW, 244/texH]
}
var globalSkyColor = false;
var c;
var gameTime = 0;
var playerStats = {zombiesKilled: 0,};
console.log("main script loaded.");
var models = {};
var hitboxes = [];
function fakePerlin(x, y) {
	return [Math.sin((x + y) / 2)]
}
var normalRef = [null, ["pos2","pos4"], ["pos3","pos1"], ["pos4","pos2"], ["pos1","pos3"]];
var numRocketJumps = 0;

class Block {
	constructor(what, pos1, pos2, pos3, pos4) {
		this.pos1 = pos1;
		this.pos2 = pos2;
		this.pos3 = pos3;
		this.pos4 = pos4;
		this.normals = [];
		for (let i=1; i<5; i++) { // start from 1 because this.pos[1,2,3,4] starts from 1
			var ref = normalRef[i];
			var vec1 = glMatrix.vec3.create();
			var vec2 = glMatrix.vec3.create();
			glMatrix.vec3.subtract(vec1, this[ref[0]], this["pos"+i]);
			glMatrix.vec3.subtract(vec2, this[ref[1]], this["pos"+i]);
			var n = glMatrix.vec3.create();
			glMatrix.vec3.cross(n, vec1, vec2);
			this.normals[i-1] = [n[0], n[1], n[2]];
		}
		this.what = what;
	}
}

class Chunk {
	constructor(coords) {
		this.blocks = {};
		this.depthMap = {};
		this.normals = [];
		for (let x=coords[0] - 0.5; x<coords[0] + 11.5; x++) {
			for (let z=coords[1] - 0.5; z<coords[1] + 11.5; z++) {
				this.depthMap[[x, z]] = getTerrain(x, z);
			}
		}
		var toAdd = [];
		for (let x=coords[0]; x<coords[0] + 10; x++) {
			for (let z=coords[1]; z<coords[1] + 10; z++) {
				this.blocks[[x, z]] = new Block("beanz",
					[x - 0.5, this.depthMap[[(x - 0.5), (z - 0.5)]], z - 0.5],
					[x - 0.5, this.depthMap[[(x - 0.5), (z + 0.5)]], z + 0.5],
					[x + 0.5, this.depthMap[[(x + 0.5), (z + 0.5)]], z + 0.5],
					[x + 0.5, this.depthMap[[(x + 0.5), (z - 0.5)]], z - 0.5]
				);
				this.normals = this.normals.concat([])
			}
		}
	}
}

chunks = {};
var gamestart = false;

function _aList(lst, x, y, z, copy = true) {
	var res;
	if (copy) {
		res = JSON.parse(JSON.stringify(lst));
	} else {res = lst;}
	for (let i=0; i<lst.length; i+=3) {
		res[i] += x;
		res[i+1] += y;
		res[i+2] += z;
	}
	return res;
}

var a = new Audio("./static/dust.mp3");
a.currentTime = 0;
var playerName;
var verticalMultiplier = 0;
function startGame() {
	document.getElementById("homeDiv").style.display = "none";
	canvas.requestPointerLock();
	clearInterval(ambientHandle);
	var n = document.getElementById("nameBox").value;
	playerName = n == ""?"Player":n; // if they didn't enter anything, just put "you"
	if (n == "jerry is hot") {
		creative = true; // enable flying
		verticalMultiplier = 0.25;
		myPlayer.health = Infinity;
	}
}
var alreadyHelped;
var dead = false;
function gameHelp() {
	var h;
	if (!alreadyHelped) {
		h = document.getElementById('helpDiv');
		h.style.display = "block";
	}
	document.getElementById('homeDivInner').scroll({
		top: 1000,
		left: 0,
		behavior: "smooth"
	});
	alreadyHelped = true;
}

function pauseMenu() {
	if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
		var a = document.getElementById('pauseDiv');
		a.style.display = "none";
		console.log("lock on");
		if (gamestart) {mainHandle = setInterval(loop, 25);}
		gamestart = true;
	} else if (!dead) {
		var a = document.getElementById('pauseDiv');
		a.style.display = "block";
		console.log("lock off");
		if (gamestart) {clearInterval(mainHandle);}
	}
}

function toggleVolume() {
	useSound = !useSound;
	if (useSound) {document.getElementById('volumeButton').src = "./static/zombiegame_updated_3d/volume on.png";}
	else {document.getElementById('volumeButton').src = "./static/zombiegame_updated_3d/volume off.jpg";}
}

function getTerrain(x, z) {
	if (x > WORLDEND * 10+0.01 || x < WORLDSTART * 10-0.01 ||
		z > WORLDEND * 10+0.01 || z < WORLDSTART * 10-0.01) { // out of bounds
		return -Infinity;
	}
	function clamp(val, low, high) {return Math.min(Math.max(val, low), high);}
	var multiplier = clamp((x/6)**2 + (z/6) **2, 0, 4);
	return (noise.simplex2(x/15, z/15)) * (noise.simplex2(x/40,z/40)) * multiplier + multiplier - 3;
}

function loadObj(url, mtlUrl, callback) {
	var res = {"position":[], "normal":[], "color": []};
	request(url, function(txt) { // jimmy rigged but it works
		var data = parseOBJ(txt);
		request(mtlUrl, function(mats) {
			var materials = parseMTL(mats);
			for (const geom of data.geometries) {
				res.position = res.position.concat(geom.data.position);
				res.normal = res.normal.concat(geom.data.normal);
				res.color = res.color.concat(
					mList(materials[geom.material].diffuseColor.concat([1.0]),geom.data.position.length/3))
				// we don't use any of the mtl specs except for the diffuse color cuz yeah
			}
			callback(res);
		});
	});
}

// helper for loadObjAndHitbox
function avg(a, b) {return (a + b) / 2;}

function loadObjAndHitbox(url, mtlUrl, callback) {
	var res = {"position":[], "normal":[], "color": [], "hitboxes": []};
	// res.hitboxes: array of arrays. Each nested array has these values:
	// [x, y, z], [l, w, h]
	request(url, function(txt) { // jimmy rigged but it works
		var data = parseOBJ(txt);
		console.log(txt);
		request(mtlUrl, function(mats) {
			var materials = parseMTL(mats);
			for (const geom of data.geometries) {
				res.position = res.position.concat(geom.data.position);
				res.normal = res.normal.concat(geom.data.normal);
				res.color = res.color.concat(
					mList(materials[geom.material].diffuseColor.concat([1.0]),geom.data.position.length/3));
				// we don't use any of the mtl specs except for the diffuse color cuz yeah

				// turn the geometries into hitboxes
				// WARNING: only works with axis-aligned rectangular prisms (i think)
				// algo for creating hitboxes: first find the min and max x, y, z coords
				// difference of coords between those is the width and height
				// midpoint between those is the middle
				// also this is pretty slow but its the best algo i can think of
				var mins = [Infinity, Infinity, Infinity];
				var maxs = [-Infinity, -Infinity, -Infinity];
				var p = geom.data.position;
				for (let i=0; i<p.length; i+=3) {
					[p[i], p[i+1], p[i+2]].forEach((el, ind) => { // assign the max and min x, y, z values
						mins[ind] = Math.min(mins[ind], el);
						maxs[ind] = Math.max(maxs[ind], el);
					})
				}
				var toPush = [];
				toPush[0] = [avg(mins[0], maxs[0]), avg(mins[1], maxs[1]), avg(mins[2], maxs[2])];
				toPush[1] = [maxs[0] - mins[0], maxs[1] - mins[1], maxs[2] - mins[2]];
				res.hitboxes.push(toPush);
			}
			callback(res);
		});
	});
}


const DEBUGMODE = true;
function dO(x) {
	if (DEBUGMODE) {console.log(x);}
}

var assdfd;
var WORLDEND = 3;
var WORLDSTART = -3;
var worldwidth = (WORLDEND - WORLDSTART) * 10;
var overlay, oCtx;
var mouseDown = false;
let myPlayer;
function divisionOnLoad(gl) {
	particles.push(new ParticleSystem([-90, 25, -90],
		D_PLANE(90, 90), -5, 20, [266/texW, 0], 0.218, 100, 1));
	// setTimeout(function() {new Enoker([10,0,10], models.boss, 1, 100);}, 10000);
	loadModels();
	console.log("divisionOnLoad");
	createRenderBuffer("shaderProgram");
	myPlayer = new MyPlayer();
	oTex = new Image();
	oTex.src = "./static/zombiegame_updated_3d/grass.png";
	noise.seed(6969); // the funny number
	// size the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
	dO("resolutions set.");

	overlay = document.getElementById("overlay");
	overlay.width = canvas.width;
	overlay.height = canvas.height;
	oCtx = overlay.getContext("2d");
	oCtx.fillStyle = "rgb(0, 255, 255)";
	oCtx.font = "30px Open Sans";

	dO("canvasrenderingcontext2d initialized.");

	document.addEventListener("pointerlockchange", pauseMenu, false);
	dO("pointerlockchange listener set.");
	// terrain gen
	for (let x=WORLDSTART; x<WORLDEND; x++) {
		for (let z=WORLDSTART; z<WORLDEND; z++) {
			chunks[[x * 10, z * 10]] = new Chunk([x * 10, z * 10]);
		}
	}
	dO("chunks initialized.");
	serializeChunks();
	dO("chunks serialized.");
	genClouds();
	dO("clouds skipped for debugging.");
	refreshBillbs();
	dO("billboards refreshed.");
	loadModels();
	dO("models load async function started.");

	bindTexture(loadTexture("./static/zombiegame_updated_3d/grass.png?e="+Date.now()), 0);
	dO("webGL texture bound.");
	oTex = new Image();
	oTex.src = "./static/zombiegame_updated_3d/grass.png?e="+Date.now();
	dO("oTex started loading.");

	// addPositions([-100, 0, -100,
	// 			  100, 0, -100,
	// 			  100, 0, 100,
	// 			  100, 0, 100,
	// 			  -100, 0, 100,
	// 			  -100, 0, -100],
	// 			  [0.99, 0.99,0.99, 0.99,0.99, 0.99,0.99, 0.99,0.99, 0.99,0.99, 0.99,]) // remember to include normals
	dO("checkpoint 1.");
	refreshBillbs(0);
	flush("billboardShader");
	flush("overlayShader");
	flush("shaderProgram");
	flush("transformShader");
	window.gl = gl;
	//assdfd = new ParticleSystem([2.47-2.5, 1.23, 6.96-2.5], D_SQUARE_PLANE, 0, 0, [0.73, 0.746], 0.218);
	//assdfd = new ParticleSystem([1.01-2.5, 15, -9.82-2.5], D_SQUARE_PLANE, 0, 0, [142/texW, 166/texH], 32/texW);
	canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
	overlay.onclick = function() {canvas.requestPointerLock();};
	document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;
	canvas.addEventListener("mousemove", onCameraTurn);
	canvas.addEventListener("mousedown", ()=>{mouseDown = true;});
	canvas.addEventListener("mouseup", ()=>{mouseDown = false;});
	canvas.addEventListener("wheel", e=>{
		if (e.deltaY > 0) {
			if (myPlayer.selected == 3) {myPlayer.selected = 0;}
			else if (myPlayer.inv[myPlayer.selected + 1]) {myPlayer.selected += 1;}
		}
		if (e.deltaY < 0) {
			if (myPlayer.selected == 0) {myPlayer.selected = 3;}
			else if (myPlayer.inv[myPlayer.selected - 1]) {myPlayer.selected -= 1;}
		}
	});
	setInterval(debugRefresh, 20);
}
var billbOffsets = [-2,-0.7,-2];


function debugRefresh() {
	var disp = "";
	for (x in debugDispNow) {
		var toAdd = "" + x + ": " + debugDispNow[x] + "<br>";
		disp += toAdd;
	}
	document.getElementById("debugStuff").innerHTML = disp;
}

function ded(reason) {
	window.clearInterval(mainHandle);
	oCtx.font = "40px Open Sans";
	oCtx.fillText("you died lmao", overlay.width * 0.3, overlay.height * 0.4);
	a.play();
	document.getElementById("deadDiv").style.display = "block";
	document.getElementById("deadReason").innerHTML = reason;
	dead = true;
}

function onCameraTurn(e) {
	myPlayer.yaw   += e.movementX * 0.1;
	myPlayer.pitch -= e.movementY * 0.1;
	if (myPlayer.pitch > 89) { myPlayer.pitch = 89; }
	if (myPlayer.pitch < -89) { myPlayer.pitch = -89; }

	var front = glMatrix.vec3.create();
	front[0] = Math.cos(glMatrix.glMatrix.toRadian(myPlayer.yaw)) * Math.cos(glMatrix.glMatrix.toRadian(myPlayer.pitch));
	front[1] = Math.sin(glMatrix.glMatrix.toRadian(myPlayer.pitch));
	front[2] = Math.sin(glMatrix.glMatrix.toRadian(myPlayer.yaw)) * Math.cos(glMatrix.glMatrix.toRadian(myPlayer.pitch))
	glMatrix.vec3.normalize(myPlayer.cameraFront, front);
}

function checkCollision(pos1, pos2, w1, w2) { // pos1 and pos2 are the CENTER of the objects
	var colliding = 0;
	for (let i=0; i<3; i++) {
		if (Math.abs(pos1[i] - pos2[i]) < (w1[i] + w2[i])/2) {colliding += 1;}
	}
	return colliding == 3;
}

var ambientHandle;
function onLoad() {
	initGL("canvas");
	ambientHandle = setInterval(function() {
		onCameraTurn({"movementX": 1, "movementY": 0});
	}, 10);
}

window.onload = onLoad;
var buffer;
var frameSum = 0;
var numFrames = 0;
function dropItems(goodWeapon) {
	var eligible = []; // rarer weapons will be in this array less
	for (var weapon of weapons) {
		if (goodWeapon && weapon[1] > 4 && Math.floor(Math.random() * 3) == 0) { // goodWeapon gives rare weapons an advantage
			eligible.push(weapon[0]);
		}
		if (Math.floor(Math.random() * weapon[1]) == 0) {eligible.push(weapon[0]);}
	}
	return eligible[Math.floor(Math.random() * eligible.length)];
}
function getDifficulty(t) {
	return 0.5 / (2 * Math.abs(t - Math.floor(t + 0.5)) * Math.sqrt(t * 2));
}
function mix(a, b, amount) {
	return a * (1 - amount) + b * amount;
}
var DAYLENGTH = 3000; // divided by 40 = seconds
var COLORLENGTH = DAYLENGTH / 8; // the time each color lasts for
function loop() {
	var before = Date.now();
	gameTime += 1;
	var askPickUp = false;
	myPlayer.takingDamage = false;

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	oCtx.clearRect(0, 0, overlay.width, overlay.height);

	// color calcs
	var m = gameTime % DAYLENGTH;
	var dayNum = Math.floor(gameTime / DAYLENGTH);
	var amount = (m % COLORLENGTH) / COLORLENGTH;
	var ind = Math.floor(m/COLORLENGTH);
	debugDispNow["day number"] = dayNum;
	var color1 = skyColors[ind];
	var color2 = skyColors[ind+1];
	c = [mix(color1[0], color2[0], amount), mix(color1[1], color2[1], amount), mix(color1[2], color2[2], amount)];
	if (globalSkyColor) {c = globalSkyColor;}
	gl.clearColor(c[0], c[1], c[2], 1.0);
	var adj = m - 1 * COLORLENGTH; // bc the sun position is a bit wank
	var sunPosition = [Math.sin(adj / DAYLENGTH * 2 * Math.PI) * 50, Math.cos(adj / DAYLENGTH * 2 * Math.PI) * 30, 0];
	lightingInfo[3] = c[0]; lightingInfo[4] = c[1]; lightingInfo[5] = c[2];
	var normalizedSunPosition = glMatrix.vec3.create();
	glMatrix.vec3.normalize(normalizedSunPosition, sunPosition);
	glMatrix.vec3.multiply(normalizedSunPosition, normalizedSunPosition, [1.3, 1.3, 1.3]);
	lightingInfo[0] = normalizedSunPosition[0]; lightingInfo[1] = normalizedSunPosition[1]; lightingInfo[2] = normalizedSunPosition[2];


	if (mouseDown || divisDownKeys["KeyE"]) {
		if (myPlayer.invSelect.specs.shotgun) {
			myPlayer.shoot(myPlayer.invSelect.specs.shotgunrounds);
		} else {
			myPlayer.shoot(1);
		}
	}
	if(divisDownKeys["KeyA"]) { // a or <
		var crossed = glMatrix.vec3.create();
		var normalized = glMatrix.vec3.create();
		glMatrix.vec3.cross(crossed, myPlayer.cameraFront, myPlayer.cameraUp);
		glMatrix.vec3.normalize(normalized, crossed);
		glMatrix.vec3.subtract(myPlayer.userInputVelocity,
			myPlayer.userInputVelocity,
			normalized);
	}
	if(divisDownKeys["KeyD"]) { // d or >
		var crossed = glMatrix.vec3.create();
		var normalized = glMatrix.vec3.create();
		glMatrix.vec3.cross(crossed, myPlayer.cameraFront, myPlayer.cameraUp);
		glMatrix.vec3.normalize(normalized, crossed);
		glMatrix.vec3.add(myPlayer.userInputVelocity,
			myPlayer.userInputVelocity,
			normalized);
	}
	if(divisDownKeys["KeyW"]) { // w or ^
		glMatrix.vec3.add(myPlayer.userInputVelocity,
			myPlayer.cameraFront,
			myPlayer.userInputVelocity);
	}
	if(divisDownKeys["KeyS"]) { // s or down
		glMatrix.vec3.subtract(myPlayer.userInputVelocity,
			myPlayer.userInputVelocity,
			myPlayer.cameraFront,);
	}
	if (divisDownKeys["Space"] && !myPlayer.inAir) {
		myPlayer.velocity[1] = 0.25;
		if (!oldMap) {
			myPlayer.hitPos[1] += 2;
			myPlayer.cameraPos[1] += 2;
		}
		myPlayer.inAir = true;
	}
	if (divisDownKeys["ShiftLeft"] && myPlayer.stamina > 60) {
		myPlayer.userInputVelocity[0] *= 0.25;
		myPlayer.userInputVelocity[2] *= 0.25;
	} else if (myPlayer.stamina > 40) {
		myPlayer.userInputVelocity[0] *= 0.15;
		myPlayer.userInputVelocity[2] *= 0.15;
	} else { // stamina rlly low
		myPlayer.userInputVelocity[0] *= 0.08;
		myPlayer.userInputVelocity[2] *= 0.08;
	}
	myPlayer.velocity[0] *= 0.9;
	myPlayer.velocity[2] *= 0.9;
	myPlayer.userInputVelocity[1] *= verticalMultiplier;
	processArrowKeys();

	physicsUpdate();
	debugDispNow["player velocity"] = myPlayer.velocity[1];
	var buffer = getRBdata(0, "shaderProgram");
	{ // game thingies
		bulletsUpdate(buffer, dayNum);
		askPickUp = itemsUpdate();
		zombiesUpdate();
		multiplayerUpdate();
		// sun
		buffer.aVertexPosition = buffer.aVertexPosition.concat(sunPosition);
		buffer.aTexCoord = buffer.aTexCoord.concat(COLORS.yellow);
		spawnStuff(m);

		if (myPlayer.health < 0) { // oof
			if (zombies.length > 5) {
				ded(playerName + " was swarmed by a bunch of zombies because they suck. rip " + playerName + ".");
			} else if (myPlayer.reloading) {
				ded(playerName + " was assasinated by a zombie while reloading, imagine being so bad.");
			} else {
				ded(playerName + " was slain by zombies. LLLL, get rickrolled");
			}
		}
		debugDispNow["health"] = myPlayer.health;
		if (checkCollision(myPlayer.cameraPos, [1.01,15,-9.82], [3,3,3], [3,3,3]) && oldMap) {
			clearInterval(mainHandle);
			oldMap = false;
			new Audio("./static/zombiegame_updated_3d/sfx/Nether_portal_trigger.ogg").play();

			var x = setInterval(()=>{ // fade effect
				oCtx.fillStyle = "rgba(0, 200, 30, 0.08)";
				oCtx.fillRect(0, 0, overlay.width, overlay.height);
			}, 25);

			setTimeout(()=>{ // stop fade
				clearInterval(x);
				oCtx.fillStyle = "rgb(255, 255, 255)";
				oCtx.font = "100px 'Open Sans'";
				oCtx.fillText("Generating Terrain...", overlay.width / 6, overlay.height / 3);
			}, 1300);

			setTimeout(()=>{ // change map
				new Audio("/static/zombiegame_updated_3d/sfx/Portal_teleportation.ogg").play();
				oCtx.clearRect(0, 0, overlay.width, overlay.height);
				changeMap();
			}, 2750);
		}

		// flush
		flushBuffers();
	}
	{ // yum yum render em up
		var posPlusFront = glMatrix.vec3.create();
		glMatrix.vec3.add(posPlusFront, myPlayer.cameraPos, myPlayer.cameraFront);
		glMatrix.mat4.lookAt(modelViewMatrix,
			myPlayer.cameraPos,
			posPlusFront,
			myPlayer.cameraUp);
		settings.lightCol = glMatrix.vec3.fromValues(...c);
		flushUniforms();
		useShader("particleShader");
		updateParticles(particles);
		useShader("billboardShader");
		gl.drawArrays(gl.TRIANGLES, 0, buffers_d.billboardShader.data.aCorner.length/2);

		gl.useProgram(buffers_d.shaderProgram.compiled);
		useRenderBuffer(0, "shaderProgram");
		gl.drawArrays(gl.TRIANGLES, 0, buffer.aVertexPosition.length/3 - 1);
		// TODO: fog color stuff on shaders
		gl.uniform4f(buffers_d.shaderProgram.uniform.uFogColor, 1.0, 1.0, 0.0, 1.0);
		gl.drawArrays(gl.POINTS, buffer.aVertexPosition.length/3 - 1, 1);
		// TODO: more fog color stuff
		gl.uniform4f(buffers_d.shaderProgram.uniform.uFogColor, c[0], c[1], c[2], 1.0);

		useShader("shaderProgram"); // switch to the main renderbuffer
		gl.drawArrays(gl.TRIANGLES, 0, buffers_d.shaderProgram.data.aVertexPosition.length/3);
		// user-defined uniforms so flushUniforms() doesn't flush it
		// gl.uniform3f(infoStuff.uniformLocations.cameraPos, myPlayer.cameraPos[0], myPlayer.cameraPos[1], myPlayer.cameraPos[2]);


		useShader("objShader");
		gl.drawArrays(gl.TRIANGLES, 0, buffers_d.objShader.data.aVertexPosition.length/3);
		debugDispNow["player pos"] = [...myPlayer.cameraPos];

		// TODO: particle shader
		/*
		useShader(particleShader);
		assdfd.render();
		//assdfd2.render();
		*/
		useShader("transformShader");
		gl.drawArrays(gl.TRIANGLES, 0, buffers_d.transformShader.data.aVertexPosition.length / 3);

		gl.disable(gl.DEPTH_TEST);
		useShader("overlayShader");
		gl.drawArrays(gl.TRIANGLES, 0, buffers_d.overlayShader.data.aBillboardPos.length / 3);
		gl.enable(gl.DEPTH_TEST);

		renderGUI(askPickUp, dayNum);
	}
	frameSum += Date.now() - before;
	numFrames += 1;
}

window.setInterval(function() {
	debugDispNow["avg frame time"] = frameSum / numFrames;
	frameSum = 0;
	numFrames = 0;
}, 500);

mainHandle = window.setInterval(loop, 25);

function postScores() {
	request("https://zombiewars.repl.co/postscore/?s="+playerStats.zombiesKilled+"&n="+playerName, (a)=>{console.log(a);})
}

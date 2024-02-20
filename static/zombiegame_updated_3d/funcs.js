console.log("funcs.js loaded.");

function physicsUpdate() { // for the first map
	myPlayer.updatePos(); // would-be next position
	var x = myPlayer.cameraPos[0];
	var z = myPlayer.cameraPos[2];
	var height = getTerrain(x, z) + 2;

	if (height == -Infinity) {myPlayer.inAir = true;} // fell off the map RIP

	if (myPlayer.inAir) {myPlayer.velocity[1] -= 0.008;} else { // on the ground
		var speedMultiplier = (myPlayer.hitPos[1] - height + 2 - 0.1) * 2;
		if (speedMultiplier < -0.21) {
			myPlayer.stamina += speedMultiplier;
		} else if (myPlayer.stamina < 100) {
			if (speedMultiplier < -0.030) {myPlayer.stamina += 0.25;} else {myPlayer.stamina += 0.15;}
		}
		if (!creative) {
			myPlayer.cameraPos[1] = height;
		}
		debugDispNow["speed multiplier"] = speedMultiplier;
	}
	if (myPlayer.hitPos[1] < height - 1 && myPlayer.hitPos[1] > height - 2) { // landing
		myPlayer.inAir = false;
		if (myPlayer.velocity[1] < -1) {
			ded(playerName + " thought fall damage was a hoax created by the government and took their" +
				" experiments a bit far. TRUST THE GOVERNMENT!!!");
		}
		myPlayer.velocity[1] = 0;
	}
	myPlayer.hitPos[1] = myPlayer.cameraPos[1] - 2;
	if (myPlayer.hitPos[1] < -50) {ded(playerName + " didn't know the world was flat in Zombie Wars. skill issue!");}
	if (myPlayer.hitPos[1] > 150) {ded(playerName + " tried to break the game by going up too high.");}
}

function physicsUpdate_parkour() { // for the second map
	myPlayer.updatePos();
	myPlayer.hitPos[1] = myPlayer.cameraPos[1] - 2;
	myPlayer.inAir = true;
	for (const box of hitboxes) {
		if (!checkCollision(box[0], myPlayer.cameraPos, box[1], [1, 4, 1])) {
			continue;
		}
		// player is colliding with the obstacle, so calculate the new position
		myPlayer.inAir = false;
		const maxY = box[0][1] + box[1][1];
		/* code still under development
		const minY = box[0][1] - box[1][1] - 2;
		const maxX = box[0][0] + box[1][0] + 0.5;
		const maxZ = box[0][2] + box[1][2] + 0.5;
		const minX = box[0][2] - box[1][2] - 0.5;
		const minZ = box[0][2] - box[1][2] - 0.5;
		*/
		// check the Y only (don't ask me how this works)
		if (myPlayer.hitPos[1] <= maxY) {
			myPlayer.hitPos[1] = maxY;
			myPlayer.cameraPos[1] = maxY;
			myPlayer.velocity[1] = 0;
		}/* else if (myPlayer.hitPos[1] > minY) {
			myPlayer.hitPos[1] = minY;
			myPlayer.velocity[1] = 0;
		}*/
	}
	myPlayer.velocity[1] -= 0.03;
	if (myPlayer.cameraPos[1] < -50) {ded(playerName + " was bad at parkour. could not be me");}
}
var oldMap = true;
function changeMap() {
	loadObjAndHitbox("/static/multiplayer_3d_game/parkour.obj?a="+Math.random(), "/static/multiplayer_3d_game/parkour.mtl?a="+Math.random(), function(res) {
		[positions, colors, texCoords, normals, indexes] = [[], [], [], [], []];
		transformInfos = {position:[], color:[], rot:[], translate:[], normal:[]};
		objInfos = res;

		flush();
		flushObj();
		flushTransformedPositions();

		oldMap = false;
		loop();
		alert(`This is supposed to be a new map, but the map has not been fully implemented yet.
So just play with this invisible map (and bugged GUI) for now, and hopefully the new map gets added soon!`);
		hitboxes = res.hitboxes;
		mainHandle = setInterval(loop, 25);
		physicsUpdate = physicsUpdate_parkour;
	});
}

function bulletsUpdate(buffer, dayN) {
	var finalBullet = [];
	buffer.aTexCoord = [];
	// check zombies colliding bullets + update bullets
	var bulletNum = 0;
	for (bullet of bullets) {
		var zombNum = 0;
		for (zomb of zombies) { // check if the bullets are colliding the zombies
			// TODO: change hitboxes (last argument of checkCollision)
			if (checkCollision([zomb.pos[0],zomb.pos[1]+3,zomb.pos[2]], bullet.pos, [2,4,2], [bullet.size*2, bullet.size*2, bullet.size*2])) {
				zomb.takeDamage(bullet.damage);
				if (zomb.checkDestruction()) { // drop items
					zomb.dead(dayN);
					zombies.splice(zombNum, 1);
					playerStats.zombiesKilled++;
				}
			}
			zombNum++;
		}
		if (checkCollision(myPlayer.cameraPos, bullet.pos, [0,0,0], [bullet.size*2, bullet.size*2, bullet.size*2]) &&
			bullet.fart) {
			myPlayer.health--;
		}
		if (bullet.checkDestruction()) {
			bullet.destruct();
			bullets.splice(bulletNum, 1);
		} else {
			finalBullet = finalBullet.concat(bullet.updatePos());
			buffer.aTexCoord = buffer.aTexCoord.concat(mList(bullet.texCoordsCycle, 6));
		}
		bulletNum += 1;
	}
	// vax bullets
	bulletNum = 0;
	for (bullet of vaxBullets) {
		var temp = myPlayer.cameraPos;
		if (checkCollision([temp[0], temp[1] + 2, temp[2]], bullet.pos, [1, 2, 1], [1,1,1])) {
			vaxBullets.splice(bulletNum, 1);
			myPlayer.health -= bullet.damage;
			if (myPlayer.health < 0) {ded(playerName + " was killed by enoker using m a j i q u e");}
		}
		if (bullet.pos[0] > 50 || bullet.pos[0] < -50 || bullet.pos[2] > 50 || bullet.pos[2] < -50 ||
			bullet.pos[1] < getTerrain(bullet.pos[0], bullet.pos[2]) || bullet.pos[1] > 50) {
			bullet.destruct();
			vaxBullets.splice(bulletNum, 1);
		} else {
			finalBullet = finalBullet.concat(bullet.updatePos());
			buffer.aTexCoord = buffer.aTexCoord.concat(mList(bullet.texCoordsCycle, 6));
		}
		bulletNum++;
	}
	buffer.aVertexPosition = finalBullet;
	buffer.aVertexNormal = mList([0, 1, 0], buffer.aVertexPosition.length+1); // +1 because the sun needs normals too
}

function itemsUpdate() {
	// update items
	var itemNum = 0;
	var pickUp = false;
	for (var item of items) {
		item.timer--;
		item.updatePos();
		if (item.timer <= 0) {
			if (item.name == "Jump!!!") {numRocketJumps--;}
			items.splice(itemNum, 1);continue;
		} // despawn
		if (checkCollision(item.pos, myPlayer.hitPos, [2,2,2], [2,2,2])) {
			if (item.type == 0) {
				for (var i=0; i<myPlayer.inv.length; i++) {
					if (!myPlayer.inv[i]) {myPlayer.inv[i] = item; item.destruct(); items.splice(itemNum, 1); break;} // pick it up
				}
				if (i == 4) { // no empty space
					pickUp = true;
					if (divisDownKeys["KeyQ"]) {myPlayer.inv[myPlayer.selected] = item; item.destruct(); items.splice(itemNum, 1);}
				}
			} else if (item.type == 1) {
				myPlayer.upgradeInv.addUpgrade(item); item.destruct(); items.splice(itemNum, 1);
			}
		}
		itemNum++;
	}

	// update buffers
	var bData = buffers_d.billboardShader.data;
	bData.aCenterOffset = []; bData.aTexCoord = []; bData.aCorner = [];
	for (var item of items) {
		bData.aTexCoord = bData.aTexCoord.concat(item.texCoordsCycle);
		for (let i=0; i<6; i++) {bData.aCenterOffset = bData.aCenterOffset.concat(item.pos);}
		bData.aCorner = bData.aCorner.concat(item.cycle);
	}
	return pickUp;
}

function transmitItem(a) {}

function multiplayerUpdate() {}

function zombiesUpdate() {
	// update zombies
	var transformInfos = buffers_d.transformShader.data;
	var realBillboardData = buffers_d.billboardShader.data;
	transformInfos.aVertexPosition = [];
	transformInfos.aColor = [];
	transformInfos.aVertexNormal = [];
	transformInfos.aYRot = [];
	transformInfos.aTranslation = [];
	for (zombie of zombies) {
		transformInfos.aVertexPosition = transformInfos.aVertexPosition.concat(zombie.model.position);
		transformInfos.aColor = transformInfos.aColor.concat(zombie.model.color);
		transformInfos.aVertexNormal = transformInfos.aVertexNormal.concat(zombie.model.normal);
		transformInfos.aYRot = transformInfos.aYRot.concat(mList([zombie.update()], zombie.model.position.length/3));
		transformInfos.aTranslation = transformInfos.aTranslation.concat(mList(zombie.pos, zombie.model.position.length/3));
		// bar outline
		// TODO: health bars
		realBillboardData.aTexCoord = realBillboardData.aTexCoord.concat(zombieBarTexCoord);
		for (let i=0; i<zombieBarPos.length; i+=2) {
			realBillboardData.aCorner.push(zombieBarPos[i] * zombie.health / 100);
			realBillboardData.aCorner.push(zombieBarPos[i+1]);
		}
		for (let x=0; x<6; x++) {
			realBillboardData.aCenterOffset = realBillboardData.aCenterOffset.concat([
			zombie.pos[0], zombie.pos[1] + 3, zombie.pos[2]]);
		}

// 71/texW,161/texH
		if (checkCollision(myPlayer.cameraPos, [zombie.pos[0],zombie.pos[1]+2.5,zombie.pos[2]], [1, 1.6, 1], [1.5,2,1.5])) {
			myPlayer.health -= zombie.damage;
			myPlayer.takingDamage = true;
		}
	}
}

function randomAroundPlayer(range) { // helper for spawning upgrades
	return [Math.random() * range + myPlayer.cameraPos[0], 2, Math.random() * range + myPlayer.cameraPos[2]];
}

function spawnStuff(t) {
	if (Math.floor(Math.random() * 60 * getDifficulty(gameTime / DAYLENGTH)) == 2) {
		var attemptedPos = [Math.random() * worldwidth - WORLDEND * 10, 0, Math.random() * worldwidth - WORLDEND * 10];
		if (Math.floor(Math.random() * 20) == 2 && numEnokers < 2 && t > 2000) { // zombies have a 1 in 10 chance of being an enoker in the last 1/3 of the day
			new Enoker(attemptedPos, models.boss, 1, 100);
			numEnokers++;
		} else {
			new Zombie(attemptedPos, models.zombie, 1, 100);
		}
	}
	if (Math.floor(Math.random() * 170) == 2 && t < 1500 && !globalSkyColor) { // spawn items if not multiplayer
		items.push(new Item(randomAroundPlayer(20),
			...upgrades[Math.floor(Math.random() * upgrades.length)], 0.3, 1, true, true));
	}
	if (Math.floor(Math.random() * 75) == 2) {
		(async function() { // to avoid holding up the frame
			for (let z of zombies) {
				if (z.zombieType == "enoker") {
					z.spawnVaxes();
				}
			}
		}());
	}
}



function flushBuffers() {
	flush("transformShader");
	flushRB(0, "shaderProgram");
	flush("billboardShader");
	flush("objShader");
	refreshBillbs();
}

function renderGUI(pickUp, dayN) {
	if (myPlayer.takingDamage) {oCtx.fillStyle = "rgb("+(Math.sin(Date.now())*100+100)+", 0, 0)"}
	else {oCtx.fillStyle = "rgb(0, 255, 255)"}
	oCtx.fillRect(overlay.width * 0.3, overlay.height * 0.94, overlay.width * 0.4*myPlayer.health/100, overlay.height * 0.05);
	oCtx.strokeRect(overlay.width * 0.3, overlay.height * 0.94, overlay.width * 0.4, overlay.height * 0.05);
	oCtx.strokeRect(overlay.width * 0.3, overlay.height * 0.75, overlay.width * 0.4, overlay.height * 0.03);
	// inv: one square is 0.1 wide and high, and 0.02 space between squares
	oCtx.strokeRect(overlay.width * 0.36, overlay.height * 0.79, overlay.width * 0.28, overlay.height * 0.14);
	var selectNum = 0;
	for (let i=0.38; i<0.62; i+=0.06) {
		if (myPlayer.selected == selectNum) {oCtx.lineWidth = 5;} else {oCtx.lineWidth = 1;}
		if (myPlayer.inv[selectNum] && myPlayer.inv[selectNum].type == 0) {
			var theItem = myPlayer.inv[selectNum];
			oCtx.drawImage(oTex, theItem.texCoordStart[0]*texW, theItem.texCoordStart[1]*texH,
				texCoordDimension * texW, texCoordDimension * texW,
				overlay.width * i, overlay.height * 0.81, overlay.width * 0.05, overlay.width * 0.05);
		}
		oCtx.strokeRect(overlay.width * i, overlay.height * 0.81, overlay.width * 0.05, overlay.width * 0.05);
		selectNum += 1;
	}
	oCtx.lineWidth = 1;
	if (myPlayer.reloading) {oCtx.fillText("Reloading", overlay.width * 0.4, overlay.height * 0.6);}
	oCtx.fillText("Current Item: "+myPlayer.inv[myPlayer.selected].name, overlay.width * 0.4, overlay.height * 0.7);
	oCtx.fillText(""+myPlayer.invSelect.roundsRemaining+"/"+myPlayer.invSelect.specs.capacity, overlay.width * 0.45, overlay.height * 0.74);
	if (pickUp) {oCtx.fillText("q to pick up", overlay.width * 0.4, overlay.height * 0.5)}
	oCtx.fillStyle = "rgb(200, 150, 0)";
	oCtx.fillRect(overlay.width * 0.3, overlay.height * 0.75, overlay.width * 0.4 * myPlayer.stamina/100, overlay.height * 0.03);
	if (myPlayer.invSelect.specs.desc) {
		oCtx.fillStyle = "rgb(0,0,0)";
		oCtx.globalAlpha = 0.5;
		oCtx.fillRect(overlay.width * 0.4-15, overlay.height * 0.1-45, overlay.width * 0.4+30, 60);
		oCtx.globalAlpha = 1;
		oCtx.fillStyle = "#22AA22";
		oCtx.fillText(myPlayer.invSelect.specs.desc, overlay.width * 0.4, overlay.height * 0.1, overlay.width * 0.4);
	}
	oCtx.fillText("Day #: " + dayN, overlay.width * 0.85, overlay.height * 0.1);
	oCtx.fillText("Zombies Killed: "+playerStats.zombiesKilled, overlay.width * 0.8, overlay.height * 0.2);
}

function serializeChunks() {
	var values = Object.values(chunks);
	var regularTex = [0.0, 128/texH,
			    0.0, 0.0,
			    128/texW, 0.0,
			    128/texW, 0.0,
			    128/texW, 128/texH,
			    0.0, 128/texH];
	var specialTex = [256/texW, 128/texH,
			    256/texW, 0.0,
			    384/texW, 0.0,
			    384/texW, 0.0,
			    384/texW, 128/texH,
			    256/texW, 128/texH];
	for (let c=0; c<values.length; c++) {
		var chunk = values[c];
		var chunkBlocks = chunk.blocks;
		//console.log(buffers_d.shaderProgram.data.aVertexNormal);
		console.log(chunk, chunkBlocks);
		for (const blockPos in chunkBlocks) {
			var block = chunkBlocks[blockPos];
			var triang1 = block.pos1.concat(block.pos2.concat(block.pos3));
			var n1 = block.normals[0].concat(block.normals[1].concat(block.normals[2]));
			var triang2 = block.pos3.concat(block.pos4.concat(block.pos1));
			var n2 = block.normals[2].concat(block.normals[3].concat(block.normals[0]));
			var tex;
			tex = regularTex;
			addPositions(triang1.concat(triang2),
			   tex, "e", n1.concat(n2));
		}
	}
	console.log(buffers_d.shaderProgram.data.aVertexNormal);
}

function genClouds() {
	for (let i=0; i<30; i++) {
		var offsets = [Math.random() * worldwidth * 1.5 - WORLDEND * 12.5, Math.random() * 10 + 10, Math.random() * worldwidth * 1.5 - WORLDEND * 12.5];
		var scale = [Math.random() * 10, Math.random(), Math.random() * 10];
		var toAdd = [];
		var cloud = cube;
		for (let j=0; j<cloud.length; j+=3) {
			toAdd.push(cloud[j] * scale[0] + offsets[0]);
			toAdd.push(cloud[j+1] * scale[1] + offsets[1]);
			toAdd.push(cloud[j+2] * scale[2] + offsets[2]);
		}
		addPositions(toAdd, mList([239/texW, 249/texH], toAdd.length/3*2), [], mList([0,1,0], toAdd.length/3));
	}
}

function loadModels() {
	loadObj("/static/multiplayer_3d_game/zombie.obj", "/static/multiplayer_3d_game/zombie.mtl", function(res) {
		models.zombie = res;
		dO("set zombie model.");
	});
	loadObj("/static/multiplayer_3d_game/zombieboss.obj", "/static/multiplayer_3d_game/zombieboss.mtl", function(res) {
		models.boss = res;
		dO("set boss model.");
	});
	loadObj("/static/multiplayer_3d_game/airdrop.obj", "/static/multiplayer_3d_game/airdrop.mtl", function(res) {
		models.airdrop = res;
		dO("set airdrop model.");
	});
	loadObj("/static/multiplayer_3d_game/vax.obj", "/static/multiplayer_3d_game/vax.mtl", function(res) {
		models.vax = res;
		dO("set vax model.");
	});
	dO("loadModels async ended without fatal exceptions.");
}
var airdropHandle;
function airdrop() {
	// new Audio("static/zombiegame_updated_3d/sfx/airdrop.mp3").play(); // the most cringe soundtrack ik
	airdropHandle = setInterval(function() {

	}, 50);
	setTimeout(function() {
		clearInterval(airdropHandle);

	})
}

function refreshBillbs() {
	var pos = [1,-1,-1, 1,-1,1, 1,1,1, 1,-1,-1, 1,1,1, 1,1,-1];
	for (let i=0; i<pos.length; i+=3) {
		pos[i] += billbOffsets[0];
		pos[i+1] += billbOffsets[1];
		pos[i+2] += billbOffsets[2];
	}
	var tex = myPlayer.inv[myPlayer.selected].texCoordsCycle;
	var data = buffers_d.overlayShader.data;
	data.aBillboardPos = pos;
	data.abTexCoord = tex;
	// crosshair
	data.aBillboardPos = data.aBillboardPos.concat(
	[-0.1, 0.1, -4,
					   0.1, -0.1, -4,
					   0.1, 0.1, -4,
					   -0.1, -0.1, -4,
					   -0.1, 0.1, -4,
					   0.1, -0.1, -4,]);
	data.abTexCoord = data.abTexCoord.concat(
					   [128/texW, 128/texH,
					    256/texW, 0.0,
					   256/texW, 128/texH,
					   128/texW, 0.0,
					   128/texW, 128/texW,
					   256/texW, 0.0,]);
	flush("overlayShader");
}

function jumpBoost() {
	var f = myPlayer.cameraFront;
	glMatrix.vec3.subtract(myPlayer.velocity, myPlayer.velocity, [f[0], f[1] * 0.5, f[2]]);
}

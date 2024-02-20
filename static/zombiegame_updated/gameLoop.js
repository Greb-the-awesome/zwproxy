function gameLoop() {
	// clear
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// frame number (tick happens every 100 frames)
	frameNumber += 1;
	time += 0.0003;

	// score
	score += 0.5;
	ctx.fillStyle = "#000000";
	ctx.fillText("SCORE: " + score, canvasWidth-widthIncrement*20, heightIncrement*30);


	// keyboard
	if((downKeys[65] || downKeys[37]) && player.canMove.left) { // a or <
		player.posX -= player.speed;
		if (player.posX < 0) {
			player.posX = widthIncrement * 99;
		}
	}
	if((downKeys[68] || downKeys[39]) && player.canMove.right) { // d or >
		player.posX += player.speed;
		if (player.posX > canvasWidth) {
			player.posX = 1;
		}
	}
	if((downKeys[87] || downKeys[38]) && player.canMove.up) { // w or ^
		player.posY -= player.speed;
		if (player.posY < 0) {
			player.posY = canvasHeight - 1;
		}
	}
	if((downKeys[83] || downKeys[40]) && player.canMove.down) { // s or down
		player.posY += player.speed;
		if (player.posY > canvasHeight) {
			player.posY = 1;
		}
	}
	if ((downKeys[32] || mouseDown) && !player.cookingNade && !player.firingDelay && !player.usingMed) {
		if (player.selected.type == "nade") {
			player.cookingNade = true;
			player.nadeTimer = player.selected.specs.fuseTime;
			console.log(player.nadeTimer)
		} else { player.shoot(); }
	}

	if (player.cookingNade) {
		player.nadeTimer -= 10; // nadeTimer becomes timer attr of object in `nades` dict when player releases shoot button
		if (player.nadeTimer <= 0) { // nade explodes in hand
			explosions.push({
				"posX":player.posX + widthIncrement,
				"posY":player.posY + widthIncrement,
				"radius":player.selected.specs.explosionRadius,
				"dmg":player.selected.specs.explosionDmg,
				"stage":0
			});
			player.cookingNade = false;
			player.inv[player.invSelect] = false;
		}
	}

	// do stuff to the items
	for(let i=0; i<items.length; i++) {
		itemInQuestion = items[i];
		itemInQuestion.draw();
		if (checkCollision(itemInQuestion, player)) {
			if (!player.inv[0]) {
				player.inv[0] = itemInQuestion; items.splice(i, 1);
			} else if (!player.inv[1]) {
				player.inv[1] = itemInQuestion; items.splice(i, 1);
			} else if (!player.inv[2]) {
				player.inv[2] = itemInQuestion; items.splice(i, 1);
			} else if (!player.inv[3]) {
				player.inv[3] = itemInQuestion; items.splice(i, 1);
			} else {
				ctx.fillText("q to pick up", player.posX - widthIncrement, player.posY + widthIncrement * 6);
				if (downKeys[81]) {
					player.inv[player.invSelect] = itemInQuestion;
					items.splice(i, 1);
				}
			}
		}
	}

	// update the bullets and draw them
	for(let i=0; i<bullets.length; i++) {
		var bulletInQuestion = bullets[i];
		bulletInQuestion.updatePos();
		bulletInQuestion.draw();
		// despawn bullets
		if(bulletInQuestion.posX > widthIncrement*102 || bulletInQuestion.posX < widthIncrement*-2 ||
			bulletInQuestion.posY > heightIncrement * 102 || bulletInQuestion.posY < heightIncrement*-2) {
			bullets.splice(i, 1);
		}
	}

	// spawn zombies
	if(Math.floor(Math.random() * (70 - calculatedSpawnChance * 10)) == 8) { // this means 1/100 chance per frame for zombie to spawn
		var attemptedSpawnPoint = Math.floor(Math.random() * 100);
		var attemptedSpawnEdge = Math.floor(Math.random() * 4);

		var x, y;
		if (attemptedSpawnEdge == 0) { // ^
			y = 0;
			x = attemptedSpawnPoint * widthIncrement;
		} else if (attemptedSpawnEdge == 1) { // >
			y = attemptedSpawnPoint * heightIncrement;
			x = canvasWidth;
		} else if (attemptedSpawnEdge == 2) { // v
			y = canvasHeight;
			x = attemptedSpawnPoint * widthIncrement;
		} else if (attemptedSpawnEdge == 3) { // <
			y = attemptedSpawnPoint * heightIncrement;
			x = 0;
		}
		let zombie = new Zombie(x, y, 20);
		zombies.push(zombie);
	}
	// do wave stuff
	calculatedSpawnChance = calcSpawnChance(time);
	ctx.fillStyle = "#000000";
	wave = Math.floor(time);
	ctx.fillText("Current Wave: "+(wave+1), 0, 100);
	
	ctx.fillText("spawn chance "+calculatedSpawnChance, 500, 100);
	ctx.strokeRect(0, 140, widthIncrement * 10, widthIncrement * 2);
	var offset = time - wave;
	ctx.fillRect(0, 140, offset * 10 * widthIncrement, widthIncrement * 2);
	ctx.font = "15px Helvetica";
	ctx.fillText("Wave Progress:", 0, 130);
	ctx.font = "30px Helvetica";
	if (oldwave != wave) { // survived a wave
		document.getElementById("wavedefeat").innerHTML = "SURVIVED WAVE "+wave;
		setTimeout(()=>{
			document.getElementById("wavedefeat").innerHTML = "";
		}, 2000);
		console.log("survivd");
	}
	oldwave = wave;

	for(let i=0; i<horses.length; i++) {
		var h = horses[i];
		h.draw();
		h.updatePos();
		h.checkDrop();
		if (h.x < -3 || h.x > canvasWidth + 1 || h.y < -3 || h.y > canvasHeight + 1) {
			horses.splice(i, 1);
		}
	}

	// zombie pathfind + draw + other stuff
	
	for(let i=0; i<zombies.length; i++) {
		var zombieInQuestion = zombies[i];
		if (zombieInQuestion) // zombieInQuestion might be false bc array.splice sometimes dosnt work
		{
		if(zombieInQuestion.posX < player.posX && zombieInQuestion.canMove.right) { // zombie to the left of the player
			zombieInQuestion.posX += widthIncrement/8;
		} else if(zombieInQuestion.posX > player.posX && zombieInQuestion.canMove.left) { // zombie to the right of the player
			zombieInQuestion.posX -= widthIncrement/8;
		}

		if (zombieInQuestion.posY < player.posY && zombieInQuestion.canMove.down) { // zombie to the top of the player
			zombieInQuestion.posY += heightIncrement/8;
		} else if (zombieInQuestion.posY > player.posY && zombieInQuestion.canMove.up) { // zombie to the bottom of the player
			zombieInQuestion.posY -= heightIncrement/8;
		}

		zombieInQuestion.draw();
		zombieInQuestion.canMove.up = true;
		zombieInQuestion.canMove.down = true;
		zombieInQuestion.canMove.right = true;
		zombieInQuestion.canMove.left = true;
		
		}
	}
	try {
	checkZombieCollideBullet(bullets, zombies);
	}
	catch (TypeError) {}
	// ammo
	ctx.fillStyle = "#333333";
	if (player.selected) {
		if (player.selected.type == "gun") {
			ctx.fillText(player.selected.roundsRemaining.toString() + "/" + player.selected.specs.capacity.toString(), widthIncrement * 40, heightIncrement * 75);
		}
		ctx.fillText("current item: "+player.selected.what, widthIncrement * 40, heightIncrement * 30);
	}

	if (player.usingMed) {
		ctx.fillText("healing up...", widthIncrement * 40, heightIncrement * 25);
	}

	if (Math.floor(Math.random() * 20) == 8) {
		snowflakes.push([Math.floor(Math.random() * 100) * widthIncrement, 0, Math.random() * 50, (Math.random()/10 + 0.1) * widthIncrement]);
	}
	for (let i=0;i<snowflakes.length;i++) {
		flakeInQuestion = snowflakes[i];
		flakeInQuestion[1] += flakeInQuestion[3];
		ctx.drawImage(imgs.flakeImg, flakeInQuestion[0], flakeInQuestion[1], flakeInQuestion[2], flakeInQuestion[2]);
		if (flakeInQuestion[1] >= canvasHeight) {
			snowflakes.splice(i, 1);
		}
	}
	player.canMove.up = true;
	player.canMove.down = true;
	player.canMove.right = true;
	player.canMove.left = true;
	for (let i=0;i<walls.length;i++) {
		wallInQuestion = walls[i];
		ctx.drawImage(imgs.wallImg, wallInQuestion.posX, wallInQuestion.posY, widthIncrement * 3, widthIncrement * 3);
		var a = advancedCollisionCheck(player, wallInQuestion);
		var b = checkCollision(player, wallInQuestion);
		
		if (b) {
			if (a.down) {player.canMove.up = false;}
			if (a.up) {player.canMove.down = false;}
			if (a.left) {player.canMove.right = false;}
			if (a.right) {player.canMove.left = false;}
		}
		for(let j=0; j<zombies.length; j++) {
			var zombieInQuestion = zombies[j];
			var a = advancedCollisionCheck(zombieInQuestion, wallInQuestion);
			var b = checkCollision(zombieInQuestion, wallInQuestion);
			if (b) {
				if (a.down) {zombieInQuestion.canMove.up = false;}
				if (a.up) {zombieInQuestion.canMove.down = false;}
				if (a.left) {zombieInQuestion.canMove.right = false;}
				if (a.right) {zombieInQuestion.canMove.left = false;}
				wallInQuestion.health -= 0.5;
				if (wallInQuestion.health < 0) {
					walls.splice(i, 1);
				}
			}
		}
	}

	for (var i=0;i<nades.length;i++) {
		var nadeInQuestion = nades[i];
		nadeInQuestion.rotation += 0.05;

		// draw
		ctx.save();
		ctx.translate(nadeInQuestion.posX + widthIncrement, nadeInQuestion.posY + widthIncrement);
		ctx.rotate(nadeInQuestion.angle + nadeInQuestion.rotation);
		ctx.translate(-nadeInQuestion.posX - widthIncrement, -nadeInQuestion.posY - widthIncrement);
		ctx.drawImage(imgs.nadeImg, nadeInQuestion.posX, nadeInQuestion.posY, widthIncrement * 2, widthIncrement * 2);
		ctx.restore();

		// update pos
		nadeInQuestion.posX += nadeInQuestion.moveX;
		nadeInQuestion.posY += nadeInQuestion.moveY;

		nadeInQuestion.timer -= 10;
		if (nadeInQuestion.timer <= 0) {
			nades.splice(i, 1);
			explosions.push({
				"posX":nadeInQuestion.posX + widthIncrement,
				"posY":nadeInQuestion.posY + widthIncrement,
				"radius":nadeInQuestion.specs.explosionRadius,
				"dmg":nadeInQuestion.specs.explosionDmg,
				"stage":0
			});
			canvas.classList.add("shake");
			for (let j=0;j<nadeInQuestion.specs.shrapnel;j++) {
				bullets.push(new Bullet(nadeInQuestion.posX, nadeInQuestion.posY, Math.random() * 2 * Math.PI, nadeInQuestion.specs.shrapnelDmg, "#555555", widthIncrement, 1));
			}
		}
	}

	for (var i=0;i<explosions.length;i++) {
		var e = explosions[i];

		e.stage += 0.7;
		var g = ctx.createRadialGradient(e.posX, e.posY, 1,
			e.posX, e.posY, e.stage * widthIncrement * 2);
		g.addColorStop(0, "#e3bc52");
		g.addColorStop(1, "#00000000");
		ctx.fillStyle = g;
		ctx.fillRect(e.posX - 100000, e.posY - 100000, 1000000, 1000000);

		if (e.stage >= 15) {
			explosions.splice(i, 1);
			canvas.classList.remove("shake");
		}

		for (var j=0;j<zombies.length;j++) {
			var zombieInQuestion = zombies[j];
			let dist = Math.sqrt(Math.abs(zombieInQuestion.posX - e.posX) ** 2, Math.abs(zombieInQuestion.posY - e.posY) ** 2);

			if (dist < widthIncrement * e.stage * widthIncrement) {
				zombieInQuestion.health -= e.dmg / (dist / widthIncrement / 35);
				if (zombieInQuestion.health <= 0) {zombies.splice(j, 1);}
			}
		}
		let dist = Math.sqrt(Math.abs(player.posX - e.posX) ** 2, Math.abs(player.posY - e.posY) ** 2);
		if (dist < widthIncrement * e.stage * widthIncrement) {
			player.health -= e.dmg / (dist / widthIncrement / 35);
			if (player.health <= 0) {die();}
		}
	}

	// draw the ppl
	player.draw();
}

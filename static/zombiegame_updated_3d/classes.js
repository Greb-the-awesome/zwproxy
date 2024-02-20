// TODO: copy the replit code to freeze multiplayer updates

console.log("classes.js loaded.");
var bullets = [];
var texW = 1024;
var texH = 1024;
var items = [];
// generate the zombie stuffs
var zombieBarTexCoord = [1, 1,
0, 1,
0, 0,
1, 1,
0, 0,
1, 0];
for (let a=0; a<zombieBarTexCoord.length; a+=2) {
	zombieBarTexCoord[a] *= (71/texW);
	zombieBarTexCoord[a+1] *= (13/texW);
	zombieBarTexCoord[a+1] += (241/texH);
}
var zombieBarPos = [-1.0, -1.0,
1.0, -1.0,
1.0, 1.0,
-1.0, -1.0,
1.0, 1.0,
-1.0, 1.0];
for (let a=0; a<zombieBarPos.length; a+=2) {
	zombieBarPos[a] *= 1.625;
	zombieBarPos[a+1] *= 0.35;
	zombieBarPos[a+1] += 3;
}
var zombieBarRemaining = JSON.parse(JSON.stringify(zombieBarPos));
for (let a=0; a<zombieBarRemaining.length; a+=2) {
	zombieBarRemaining[a] *= 1;
	zombieBarRemaining[a+1] *= 1;
}

var texCoordDimension = 100/texW; // if at any point I don't use a square texture then it will fail soooooooo

var creative = false;

class Item {
	constructor(pos, name, texCoordStart, specs, size, type = 0, add = true, despawn = true) {
		console.log(texCoordStart);
		this.name = name;
		this.pos = pos;
		this.type = type; // 0 = weapon, 1 = upgrade
		this.texCoordsCycle = [1, 1,
		 0, 1,
		 0, 0,
		 1, 1,
		 0, 0,
		 1, 0];
		this.cycle = [-1.0, -1.0,
		1.0, -1.0,
		1.0, 1.0,
		-1.0, -1.0,
		1.0, 1.0,
		-1.0, 1.0];
		for (let a=0; a<this.texCoordsCycle.length; a+=2) {
			this.texCoordsCycle[a] *= texCoordDimension;
			this.texCoordsCycle[a+1] *= texCoordDimension;
			this.texCoordsCycle[a] += texCoordStart[0];
			this.texCoordsCycle[a+1]+=  texCoordStart[1];
			this.cycle[a] *= size;
			this.cycle[a+1] *= size;
		}
		var realBillboardData = buffers_d.billboardShader.data;
		if (add) {
			for (let i=0; i<6; i++) {realBillboardData.aCenterOffset = realBillboardData.aCenterOffset.concat(pos);}
			realBillboardData.aCorner = realBillboardData.aCorner.concat(this.cycle);
			realBillboardData.aTexCoord = realBillboardData.aTexCoord.concat(this.texCoordsCycle);
		}
		this.specs = specs;
		this.texCoordStart = texCoordStart;
		this.timer = despawn?1000:2147483647;
		this.roundsRemaining = this.specs.capacity;
		if (!type) { // type == 0
			this.clutcher = false; // weapons can have upgrades
			this.rocketJump = false;
		}
		this.velocity = [0,0,0]; // manually set it if u want smth diff
		this.id = Date.now();
		this.size = size;
	}
	updatePos() {
		if (this.pos[1] > getTerrain(this.pos[0], this.pos[2]) + 1) {
			this.pos[0] += this.velocity[0];
			this.pos[1] += this.velocity[1];
			this.pos[2] += this.velocity[2];
			this.velocity[1] -= 0.008;
		}
	}
	destruct() {}
	toJSON() {
		return {pos: [...this.pos], type: this.type, name: this.name,
			specs: this.specs, texCoordStart: this.texCoordStart,
			clutcher: this.clutcher,
			rocketJump: this.rocketJump, velocity: this.velocity, size: this.size, id: this.id};
	}
}


class MyPlayer {
	constructor() {
		// thanks to learnOpenGL.com for these values cos dumb at linear algebra :D
		this.cameraPos = glMatrix.vec3.fromValues(0.0, 1.6, 0.0);
		this.hitPos = glMatrix.vec3.fromValues(0.0, 0.1, 0.0);
		this.cameraPointTo = glMatrix.vec3.fromValues(0.0, 1.6, 1.0);
		this.cameraFront = glMatrix.vec3.fromValues(0.0, 0.0, -1.0);
		this.cameraUp = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
		this.yaw = -90.0;
		this.pitch = 0.0;

		this.velocity = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
		this.userInputVelocity = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);

		this.acceleration = 0.000000002; // + 0.02 per frame

		this.health = creative?Infinity:100;
		this.stamina = creative?Infinity:100;
		this.takingDamage = false;
		this.firingDelay = false;
		this.reloading = false;
		this.inAir = false;
		this.inv = [new Item([0,10,0], "GL Gun", [266/texW, 300/texH],
			{damage:20,delay:100,reloadTime:1000,capacity:20,spread:10,speed:0.9,fire:genNoise("gl_fire"),rel:genNoise("gl_reload")},
			0, 0, false), false, false, false];
		this.upgradeInv = [];
		this.selected = 0;

		this.upgradeInv.addUpgrade = function(u) {
			//myPlayer.upgradeInv.push(u);
			var div = document.getElementById("upgradeItem");
			var clone = div.cloneNode(true);
			clone.style.display = "block";
			clone.id = "upgradeItem-" + myPlayer.upgradeInv.length;
			clone.querySelector("#upHeading").innerHTML = u.name; // they all have identical ids
			clone.querySelector("#upDesc").innerHTML = u.specs.desc;
			clone.querySelector("#upButton").onclick = ()=>{
				u.specs.action();clone.remove();
				if (u.name == "Jump!!!") {numRocketJumps--;}
			};
			div.after(clone);
		}
	}
	toJSON() {
		return {cameraPos: [...this.cameraPos], id: PLAYERID, room: gameRoomName};
	}
	updatePos() {
		glMatrix.vec3.add(this.cameraPos, this.cameraPos, this.velocity);
		glMatrix.vec3.add(this.cameraPos, this.cameraPos, this.userInputVelocity);
		glMatrix.vec3.add(this.hitPos, this.hitPos, this.velocity);
		glMatrix.vec3.add(this.hitPos, this.hitPos, this.userInputVelocity);
		// some other housekeeping
		this.invSelect = this.inv[this.selected];
	}
	sendShootEvent(_) {}
	shoot(numBullets) {
		if (this.invSelect.specs.fartGun) {
			if (this.invSelect.roundsRemaining <= 0) {return;}
			var p = glMatrix.vec3.create();
			var multipliedFront = glMatrix.vec3.create();
			var temp = this.invSelect.roundsRemaining * 1.5 + 3;
			glMatrix.vec3.mul(multipliedFront, myPlayer.cameraFront, [temp,temp,temp]);
			glMatrix.vec3.add(p, myPlayer.cameraPos, multipliedFront);
			new Bullet(p, [0,0,0], 0.5, COLORS.clearblue, 0, true, this.invSelect.roundsRemaining, 280); // lifetime=7s
			bullets[bullets.length-1].fart = true;
			this.invSelect.roundsRemaining = 0;
			return;
		}
		if (!this.firingDelay && !this.reloading && myPlayer.invSelect) { // a lot of code for each shot lmao
			var toPlay = new Audio(this.invSelect.specs.fire);
			// rocket jump
			if (this.invSelect.rocketJump &&
				(this.invSelect.roundsRemaining % 3 == 0)) {
				jumpBoost();
				toPlay.preservesPitch = false;
				toPlay.playbackRate = 0.7;
			}
			// sounds
			if (this.invSelect.specs.fire && useSound) {toPlay.play();}

			// subtract bullet
			this.invSelect.roundsRemaining--;

			// front vector calcs
			for (let i=0; i<numBullets; i++) {
				var distanceFromPlayer = 2;
				var vel = glMatrix.vec3.create();
				var pos = glMatrix.vec3.create();
				var adjYaw = this.yaw + (Math.random() * 2 - 1) * this.invSelect.specs.spread;
				var adjPitch = this.pitch + (Math.random() * 2 - 1) * this.invSelect.specs.spread;
				vel[0] = Math.cos(glMatrix.glMatrix.toRadian(adjYaw)) * Math.cos(glMatrix.glMatrix.toRadian(adjPitch));
				vel[1] = Math.sin(glMatrix.glMatrix.toRadian(adjPitch));
				vel[2] = Math.sin(glMatrix.glMatrix.toRadian(adjYaw)) * Math.cos(glMatrix.glMatrix.toRadian(adjPitch));
				glMatrix.vec3.normalize(vel, vel);
	
				var multipliedFront = glMatrix.vec3.fromValues(
					this.cameraFront[0]*distanceFromPlayer, this.cameraFront[1]*distanceFromPlayer, this.cameraFront[2]*distanceFromPlayer);
				glMatrix.vec3.add(pos, this.cameraPos, multipliedFront);
				
				var tc = COLORS.red, tcdim = 0;
				if (this.invSelect.specs.bulletTc) {
					tc = this.invSelect.specs.bulletTc;
					tcdim = this.invSelect.specs.bulletTcDimension;
				}
				var bul = new Bullet(pos, vel, this.invSelect.specs.damage, tc, tcdim, true);
				this.sendShootEvent(bul);
			}

			this.firingDelay = true;

			// recoil animation
			billbOffsets[2] += 0.3;
			setTimeout(()=>billbOffsets[2]-=0.3, this.invSelect.specs.delay/2)
			setTimeout(()=>{myPlayer.firingDelay = false;}, this.invSelect.specs.delay);

			// beans
			if (this.invSelect.specs.beanWeapon) {
				for (var x of this.inv) {
					if (x.name == "Fart Gun") {x.roundsRemaining++;}
				}
			}
			
			// reload
			if (this.invSelect.roundsRemaining <= 0) {
				if (this.invSelect.clutcher && this.health < 25) {
					this.invSelect.roundsRemaining = this.invSelect.specs.capacity;
				} else {
					this.reloading = true; setTimeout(()=>{
						myPlayer.reloading = false;myPlayer.invSelect.roundsRemaining = myPlayer.invSelect.specs.capacity;
					}, this.invSelect.specs.reloadTime);
					if (this.invSelect.specs.rel && useSound) {new Audio(this.invSelect.specs.rel).play();}
				}
			}
		}
	}
}

class OtherPlayer {
	constructor(pos, id) {
		this.cameraPos = pos;
		this.id = id;
	}
	toJSON() {
		return {cameraPos: [...this.cameraPos], id: this.id}
	}
}


class Bullet {
	constructor(pos, front, damage, texCoordStart = COLORS.red, texCoordDimension = 0, add = true, size = 1, timer = 800) {
		this.front = glMatrix.vec3.fromValues(front[0], front[1], front[2]);
		this.pos = glMatrix.vec3.fromValues(pos[0], pos[1], pos[2]);
		this.size = size;
		this.posCycle = new Array(cube.length);
		for (let i=0; i<cube.length; i++) {
			this.posCycle[i] = cube[i] * size;
		}
		this.location = buffers_d.shaderProgram.data.aVertexPosition.length;
		this.damage = damage;
		this.texCoordsCycle = [1, 1,
							  0, 1,
							  0, 0,
							  1, 1,
							  0, 0,
							  1, 0];
		// offset the texture coordinates
		for (let a=0; a<this.texCoordsCycle.length; a+=2) {
			this.texCoordsCycle[a] *= texCoordDimension;
			this.texCoordsCycle[a+1] *= texCoordDimension;
			this.texCoordsCycle[a] += texCoordStart[0];
			this.texCoordsCycle[a+1]+=  texCoordStart[1];
		}
		var buffer = getRBdata(0, "shaderProgram");
		buffer.aVertexPosition = buffer.aVertexPosition.concat(_aList(cube, pos[0], pos[1], pos[2]));
		buffer.aTexCoord = buffer.aTexCoord.concat(mList([0,0], 72));
		buffer.aVertexNormal = buffer.aVertexNormal.concat(mList([0, 1, 0], 108));
		flushRB(0, "shaderProgram");
		this.timer = timer;
		if (add) {bullets.push(this)};
	}
	updatePos() {
		glMatrix.vec3.add(this.pos, this.pos, this.front);
		this.timer--;
		return _aList(this.posCycle, this.pos[0], this.pos[1], this.pos[2]);
	}
	checkDestruction() {
		if (this.timer < 0) {
			return true;
		}
		return this.pos[0] > 50 || this.pos[0] < -50 || this.pos[2] > 50 || this.pos[2] < -50 ||
			this.pos[1] < getTerrain(this.pos[0], this.pos[2]) || this.pos[1] > 50;
	}
	destruct() {
		particles.push(new ParticleSystem(
			this.pos, D_ONE_POINT(), 20, 0.05, COLORS.red, 0.0, 0.1, 10, 1
		));
	}
	toJSON() {
		return {pos: [...this.pos], front: [...this.front], damage: this.damage, room: gameRoomName};
	}
}
var epsilon = 1;
function closeTo(a, b) {
	return Math.abs(a - b) < epsilon;
}
var rads = {
	45: Math.PI/4,
	90: Math.PI/2,
	135: Math.PI*0.75,
	180: Math.PI,
	225: Math.PI*1.25,
	270: Math.PI*1.5,
	315: Math.PI*1.75
};
class Zombie {
	constructor(pos, model, damage, health) {
		this.pos = pos;
		this.health = health;
		this.angle = 0;
		this.model = model;
		this.damage = damage;
		this.zombieType = "base";
		this.target = myPlayer;
		this.id = Date.now();
		zombies.push(this);
	}
	checkDestruction() {return this.health <= 0;}
	takeDamage(a) {this.health -= a;}
	toJSON() {
		return {pos: this.pos, angle: this.angle, type: this.zombieType, id: this.id, target: this.target.id, health: this.health, damage: this.damage,
			room: gameRoomName};
	}
	updatePos() {
		// player speed (walking) is 0.136/frame so zombie is 0.14 (so u can only run to escape zombie)
		// returns [moveForward, moveSideways] for udpateAngle()
		var moveForward = 0; var moveSideways = 0;
		if (!closeTo(this.target.cameraPos[0], this.pos[0])) {
			if (this.target.cameraPos[0] > this.pos[0]) { this.pos[0] += 0.14; moveForward = 1; }
			else { this.pos[0] -= 0.14; moveForward = 2; }
		}

		if (!closeTo(myPlayer.cameraPos[2], this.pos[2])) {
			if (this.target.cameraPos[2] > this.pos[2]) { this.pos[2] += 0.14; moveSideways = 1; }
			else { this.pos[2] -= 0.14; moveSideways = 2; }
		}
		this.pos[1] = getTerrain(this.pos[0], this.pos[2]);
		return [moveForward, moveSideways];
	}
	updateAngle(moveForward, moveSideways) {
		if (moveForward == 1) {
			if (!moveSideways) {this.angle = rads[180];}
			else if (moveSideways == 1) {this.angle = rads[135];}
			else if (moveSideways == 2) {this.angle = rads[225];}
		} else if (moveForward == 2) {
			if (!moveSideways) {this.angle = 0;}
			else if (moveSideways == 1) {this.angle = rads[45];}
			else if (moveSideways == 2) {this.angle = rads[315];}
		} else if (moveForward == 0) {
			if (moveSideways == 1) {this.angle = rads[90];}
			else if (moveSideways == 2) {this.angle = rads[270];}
		}
		return this.angle;
	}
	update() {return this.updateAngle(...this.updatePos());}
	
	dead(dayN) {
		var zomb = this; // so i can just copy and paste code lmao
		if (Math.random() > 0.6) {
			var toDrop = dropItems(dayN < 2);
			items.push(new Item([zomb.pos[0], zomb.pos[1]+1, zomb.pos[2]], toDrop.name, toDrop.texCoordStart, toDrop.specs, 1));
			transmitItem(items[items.length-1]);
			if (Math.random() > 0.9 && numRocketJumps < 3) {
				var toPush = new Item([zomb.pos[0], zomb.pos[1] + 2, zomb.pos[2]],
					...jumpBoostUpgrade, 0.3, 1, true, true);
				items.push(toPush);
				toPush.velocity = [Math.random() * 0.1, 0.5 * Math.random(), Math.random() * 0.1];
				numRocketJumps++;
				transmitItem(toPush);
			}
		}
		particles.push(new ParticleSystem(
			this.pos, D_ONE_POINT(), 7, 10, COLORS.grey, 0, 0.3, 5, 3
		));
	}
}

// enokers and vaxes are both in the zombies array
// this is because they have the same methods that can be called
// when zombiesUpdate() iterates through the zombies

class Enoker extends Zombie {
	constructor(pos, model, damage, health) {
		super(pos, model, damage, health);
		console.log(model);
		console.log("^^ enoker");
		this.vaxes = [];
		this.zombieType = "enoker";
	}
	spawnVaxes() {
		if (this.vaxes.length < 10) {
			for (let i=0; i<Math.random()*3; i++) {
				this.vaxes.push(new Vax([this.pos[0] + Math.random() * 10,
					this.pos[1] + 5, this.pos[2] + Math.random() * 10], models.vax, 1, 50));
			}
		}
	}
}

class Vax extends Zombie {
	constructor(pos, model, damage, health) {
		super(pos, model, damage, health);
		this.targetOffset = glMatrix.vec3.fromValues(Math.random() * 5, 0, Math.random() * 5);
		this.target = myPlayer;
		this.timeOffset = Math.random() * Math.PI;
		this.heightOffset = Math.random() * 10 + 2;
		this.firingDelay = false;
		this.zombieType = "vax";
	}
	updatePos() {
		var target = glMatrix.vec3.create();
		glMatrix.vec3.add(target, this.targetOffset, this.target.cameraPos);

		var moveForward = 0; var moveSideways = 0;
		if (!closeTo(target[0], this.pos[0])) {
			if (target[0] > this.pos[0]) { this.pos[0] += 0.14; moveForward = 1; }
			else { this.pos[0] -= 0.14; moveForward = 2; }
		}

		if (!closeTo(target[2], this.pos[2])) {
			if (target[2] > this.pos[2]) { this.pos[2] += 0.14; moveSideways = 1; }
			else { this.pos[2] -= 0.14; moveSideways = 2; }
		}
		this.pos[1] = Math.sin(Date.now()/100 + this.timeOffset) + this.heightOffset;

		return [moveForward, moveSideways];
	}
	update() {
		if (Math.random() > 0.85 && !this.firingDelay) { // shoot
			this.firingDelay = true;
			setTimeout(()=>{this.firingDelay = false;}, 2500);
			var front = glMatrix.vec3.create();
			glMatrix.vec3.sub(front, myPlayer.cameraPos, this.pos);
			glMatrix.vec3.normalize(front, front);
			vaxBullets.push(new Bullet(this.pos, front, 5, COLORS.yellow, 0, false)); // vax bullets are non-piercing so higher damage
		}
		return this.updateAngle(...this.updatePos());
	}
}

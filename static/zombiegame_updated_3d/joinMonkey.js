var gameRoomName;
var otherPlayers = [myPlayer];
// NOTE: there is inconsistent indentation. whatever

function findInOtherPlayers(id) {
	for (var o of otherPlayers) {if (o.id == id) {return o;}}
	return -1;
}

function joinGame_monkey() {
  spawnStuff = function() {};
  {
	multiplayerUpdate = function() {
        var transformInfos = buffers_d.transformShader.data;
        for (let i=1; i<otherPlayers.length; i++) {
          transformInfos.aVertexPosition = transformInfos.aVertexPosition.concat(cube);
          transformInfos.aColor = transformInfos.aColor.concat(mList([1,1,1,1],cube.length*4/3));
          transformInfos.aVertexNormal = transformInfos.aVertexNormal.concat(mList([1,1,1],cube.length/3));
          transformInfos.aYRot = transformInfos.aYRot.concat(mList([0],cube.length/3));
          transformInfos.aTranslation = transformInfos.aTranslation.concat(mList(otherPlayers[i].cameraPos,cube.length/3));
        }
    };
	myPlayer.sendShootEvent = function(bul) {
		sio.emit("playerShoot", bul);
	}
	sio.emit("getOtherPlayers", {room: gameRoomName});
	sio.on("receiveOtherPlayers", function(data) {
		console.log("RECEIVE OTHER PLAYERS:");
		console.log(data);
		otherPlayers = [myPlayer];
		for (var p of data.content) {
			if (p.id == PLAYERID) {continue;}
			otherPlayers.push(new OtherPlayer(p.cameraPos, p.id));
		}
	});
	sio.on("s_update", function(data) {
		for (var oth of data.content) {
			if (oth.id == PLAYERID) {continue;}
			var f = findInOtherPlayers(oth.id);
			if (f == -1) {
				otherPlayers.push(new OtherPlayer(oth.cameraPos, oth.id));
				console.log("findinotherplayers actually not found");
			} else {
				f.cameraPos = oth.cameraPos;
			}
		}
		globalSkyColor = data.skyCol;
		for (let i=0; i<items.length; i++) {
			var di = data.items[items[i].id];
			var ii = items[i];
			if (!di) {
				items.splice(i, 1); continue;
			}
			ii.pos = di.pos; ii.specs = di.specs; ii.texCoordStart = di.texCoordStart;
			ii.type = di.type; ii.clutcher = di.clutcher; ii.rocketJump = di.rocketJump;
			ii.velocity = di.velocity; ii.size = di.size;
			data.items[items[i].id].good = true;
		}
		for (var itk in data.items) {
			var it = data.items[itk];
			if (!it.good) {
				items.push(new Item(it.pos, it.name, it.texCoordStart,
					it.specs, it.size, it.type, true, true));
				items[items.length-1].id = it.id;
				console.log("push new item");
			}
		}
		for (let i=0; i<zombies.length; i++) {
			var dz = data.zombies[zombies[i].id];
			var iz = zombies[i];
			if (!dz) {
				zombies.splice(i, 1); continue;
			}
			iz.pos = dz.pos; iz.zombieType = dz.zombieType; iz.angle = dz.angle; iz.health = dz.health;
			data.zombies[zombies[i].id].good = true;
			if (dz.target == PLAYERID) {iz.target = myPlayer;} else {
				if (findInOtherPlayers(dz.target) == -1) {zombies.splice(i, 1); continue;}
				iz.target = findInOtherPlayers(dz.target);
			}
		}
		for (var zombk in data.zombies) {
			var zomb = data.zombies[zombk];
			if (!zomb.good) {
				new Zombie(zomb.pos, models.zombie, zomb.damage, zomb.health);
				zombies[zombies.length-1].id = zomb.id;
				if (zomb.target == PLAYERID) {zombies[zombies.length-1].target = myPlayer;} else {
					if (findInOtherPlayers(zomb.target) != -1) {
						zombies[zombies.length-1].target = findInOtherPlayers(zomb.target);
					}
				}
				console.log("push new zombie");
			}
		}
	});
	let _Item = class extends Item {
		constructor(pos, name, texCoordStart, specs, size, type = 0, add = true, despawn = true) {
			super(pos, name, texCoordStart, specs, size, type, add, despawn);
		}
		destruct() {
			sio.emit("itemDelete", {room: gameRoomName, id: this.id});
		}
	};
	Item = _Item;
	sio.on("playerShoot", function(data) {
		bullets.push(new Bullet(data.pos, data.front, data.damage));
	});
	sio.on("itemDelete", function(data) {
		for (let i=0; i<items.length; i++) {
			if (items[i].id == data.id) {items.splice(i, 1);}
		}
	});
  }
  setInterval(function() {
	sio.emit("playerUpdate", myPlayer);
  }, 100);
}

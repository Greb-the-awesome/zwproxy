var gameRoomName;
var otherPlayers = [myPlayer];
function findInOtherPlayers(id) {
	for (var o of otherPlayers) {if (o.id == id) {return o;}}
  return -1;
}

// NOTE: there are multiple problems in this code
// that cause suboptimal performance
// but 1) if it aint broke dont fix it
// 2) theres not gonna be like 69 players in one lobby

function hostGame_monkey() {
    {
      transmitItem = function(a) {
        sio.emit("s_itemcreate", a);
      };
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
    };
    let _Item = class extends Item {
			constructor(pos, name, texCoordStart, specs, size, type = 0, add = true, despawn = true) {
				super(pos, name, texCoordStart, specs, size, type, add, despawn);
			}
			destruct() {
				sio.emit("itemDelete", {room: gameRoomName, id: this.id});
			}
		};
		Item = _Item;
    let _Enoker = class {
      constructor(a,b,c,d) {}
    };
    Enoker = _Enoker; // too lazy to implement multiplayer enokers
      sio.on("s_playerjoin", function(data) {
        otherPlayers.push(new OtherPlayer([0,0,0], data.id));
        console.log("player joined!");
      });
      sio.on("playerUpdate", function(data) {
        var toChange = findInOtherPlayers(data.id);
        toChange.cameraPos = data.cameraPos;
      });
      sio.on("getOtherPlayers", function(_) {
        sio.emit("receiveOtherPlayers", {content: otherPlayers, room: gameRoomName});
      });
      sio.on("playerShoot", function(data) {
        bullets.push(new Bullet(data.pos, data.front, data.damage));
      });
      sio.on("itemDelete", function(data) {
        for (let i=0; i<items.length; i++) {
          if (items[i].id == data.id) {items.splice(i, 1);}
        }
      });
      setInterval(function() {
        var itemFinal = {};
        var zombieFinal = {};
        for (var it of items) {itemFinal[it.id] = it;}
        for (var zomb of zombies) {zombieFinal[zomb.id] = zomb;}
        sio.emit("s_update", {
          content: otherPlayers,
          room: gameRoomName,
          items: itemFinal,
          zombies: zombieFinal,
          skyCol: c
        });
      }, 100);
    }
}
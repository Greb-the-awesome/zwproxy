console.log("weapons.js loaded.");
function genNoise(path) {
	return "/static/zombiegame_updated_3d/sfx/"+path+".mp3";
}

var stinkyFartGun = {name: "Fart Gun", texCoordStart: [456/texW, 100/texH], specs: {damage: 30, delay: 300, reloadTime: 2300, capacity: 10, spread: 40, speed: 0.7, fire: genNoise("beans_fire"), rel: genNoise("beans_fire"),
desc: "Fire bean weapons to charge this gun!", bulletTc: [251/texW, 244/texH], bulletTcDimension: 5/texW, fartGun: true},};

var canOfBeans = {name: "Can Of Beans", texCoordStart: [456/texW, 100/texH], specs: {damage: 30, delay: 300, reloadTime: 2300, capacity: 30, spread: 40, speed: 0.7, fire: genNoise("beans_fire"), rel: genNoise("beans_fire"),
	desc: "Press C to turn into a fart gun!", swapInto: stinkyFartGun, swapNum: 1, shotgun: true, shotgunrounds: 5, bulletTc: [251/texW, 244/texH], bulletTcDimension: 5/texW, beanWeapon: true},};

var podOfBeans = {name: "Pod Of Beans", texCoordStart: [456/texW, 0], specs: {damage: 30, delay: 300, reloadTime: 2300, capacity: 9, spread: 40, speed: 0.7, fire: genNoise("beans_fire"), rel: genNoise("beans_fire"),
	desc: "Press C to combine two pods into a can of beans!", swapInto: canOfBeans, swapNum: 2, shotgun: true, shotgunrounds: 4, bulletTc: [251/texW, 244/texH], bulletTcDimension: 5/texW, beanWeapon: true},};

var weapons = [
	[{name: "AA-12", texCoordStart: [266/texW, 0], specs: {damage: 100, delay: 40, reloadTime: 1800, capacity: 20, spread: 15, speed: 0.8}}, 4],
	[{name: "AK-47", texCoordStart: [366/texW, 0], specs: {damage: 150, delay: 75, reloadTime: 2000, capacity: 30, spread: 3, speed: 1}}, 3],
	[{name: "Kar98K", texCoordStart: [266/texW, 100/texH], specs: {damage: 40, delay: 500, reloadTime: 2000, capacity: 12, spread: 0, speed: 1.7, fire:genNoise("kar_fire"),rel:genNoise("kar_reload")}}, 1],
	[{name: "Macaroni Gun Mk II", texCoordStart: [366/texW, 100/texH], specs: {damage: 40, delay: 50, reloadTime: 3500, capacity: 690, spread: 5, speed: 1}}, 69],
	[{name: "QCW-05", texCoordStart: [366/texW, 200/texH], specs: {damage: 40, delay: 30, reloadTime: 1100, capacity: 50, spread: 3, speed: 1.3}}, 5],
	[{name: "M249", texCoordStart: [266/texW, 200/texH], specs: {damage: 40, delay: 80, reloadTime: 4000, capacity: 100, spread: 3, speed: 1.4, fire: genNoise("m249_fire"), rel: genNoise("m249_reload")}}, 1],
	[{name: "Vector", texCoordStart: [266/texW, 400/texH], specs: {damage: 30, delay: 30, reloadTime: 1000, capacity: 33, spread: 20, speed: 0.7, fire: genNoise("vector_fire"), rel: genNoise("gl_reload")},}, 2],
	[{name: "BEANSSSS", texCoordStart: [366/texW, 400/texH], specs: {damage: 40, delay: 10, reloadTime: 400, capacity: 1, spread: 10, speed: 3.5, fire: genNoise("beans_fire"),
		bulletTc: [251/texW, 244/texH], bulletTcDimension: 5/texW, desc: "Press C to combine three beans into a pod of beans!", swapInto: podOfBeans, swapNum: 3, beanWeapon: true}}, 1],
];

var upgrades = [
["Extra Ammo", [0, 0.5], {action:()=>myPlayer.invSelect.specs.capacity = 100,
	desc:"do you really not know what extra ammo means?"}],
["ClUtCh!!!", [0, 0.69], {action:()=>myPlayer.invSelect.clutcher = true,
	desc: "When you are low on health, this weapon does not need to reload!"}],
["Sus Juice", [0.195, 0.5], {action:()=>myPlayer.health = Math.min(myPlayer.health + 75, 100),
	desc: "Heal 75 health on application. (this doesn't affect your weapon)"}],
["Sus Juice", [0.195, 0.5], {action:()=>{
		myPlayer.health = Math.min(myPlayer.health + 75, 100);
	},
	desc: "Heal 75 health on application. (this doesn't affect your weapon)"}],
];

var jumpBoostUpgrade = ["Jump!!!", [0.195, 0.69], {action:()=>myPlayer.invSelect.rocketJump = true,
	desc: "<a href='https://youtu.be/MHi9mKq0slA?t=92'>Rocket Jump!</a> (every third bullet "+
	"boosts you up when jumping)"}];

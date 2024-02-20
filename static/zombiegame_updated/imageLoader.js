var gunImg;
var loadedImgs = {};
var imgs = {};
function loadImgs() {
	// gun
	imgs.gunImg = new Image();
	imgs.gunImg.src = "static/zombiegame_updated/gun.png";
	imgs.gunImg.onload = function() {
		loadedImgs["gun"] = true;
	};
	console.log("gunImg=" + gunImg);

	// plane (or horse)
	imgs.horseImg = new Image();
	imgs.horseImg.src = "static/zombiegame_updated/horseUnridable.png";
	imgs.horseImg.onload = function() {
		loadedImgs["horseUnridable"] = true;
	};

	// nuke
	imgs.nukeImg = new Image();
	imgs.nukeImg.src = "static/zombiegame_updated/nuke.png";
	imgs.nukeImg.onload = function() {
		loadedImgs["nuke"] = true;
	};

	// opgun
	imgs.opGunImg = new Image();
	imgs.opGunImg.src = "static/zombiegame_updated/opgun.png";
	imgs.opGunImg.onload = function() {
		loadedImgs["opgun"] = true;
	};

	// horse egg
	imgs.eggImg = new Image();
	imgs.eggImg.src = "static/zombiegame_updated/egg.png";
	imgs.eggImg.onload = function() {
		loadedImgs["egg"] = true;
	};

	// kar98
	imgs.kar98Img = new Image();
	imgs.kar98Img.src = "static/zombiegame_updated/kar98.png";
	imgs.kar98Img.onload = function() {
		loadedImgs["kar98"] = true;
	};

	// ak
	imgs.akImg = new Image();
	imgs.akImg.src = "static/zombiegame_updated/ak.png";
	imgs.akImg.onload = function() {
		loadedImgs["ak"] = true;
	};

	// m1918
	imgs.m1918Img = new Image();
	imgs.m1918Img.src = "static/zombiegame_updated/m1918.png";
	imgs.m1918Img.onload = function() {
		loadedImgs["m1918"] = true;
	};

	// qcw05
	imgs.qcwImg = new Image();
	imgs.qcwImg.src = "static/zombiegame_updated/qcw05.png";
	imgs.qcwImg.onload = function() {
		loadedImgs["qcw"] = true;
	};

	// m1887
	imgs.m1887Img = new Image();
	imgs.m1887Img.src = "static/zombiegame_updated/m1887.png";
	imgs.m1887Img.onload = function() {
		loadedImgs["m1887"] = true;
	};

	// medkit
	imgs.medkitImg = new Image();
	imgs.medkitImg.src = "static/zombiegame_updated/medkit.png";
	imgs.medkitImg.onload = function() {
		loadedImgs["medkit"] = true;
	};

	// medicine
	imgs.medicineImg = new Image();
	imgs.medicineImg.src = "static/zombiegame_updated/medicine.png";
	imgs.medicineImg.onload = function() {
		loadedImgs["medicine"] = true;
	};

	// aa12
	imgs.aa12Img = new Image();
	imgs.aa12Img.src = "static/zombiegame_updated/aa12.png";
	imgs.aa12Img.onload = function() {
		loadedImgs["aa12"] = true;
	};

	// snowflake
	imgs.flakeImg = new Image();
	imgs.flakeImg.src = "static/zombiegame_updated/snowflake.png";
	imgs.flakeImg.onload = function() {
		loadedImgs["snowflake"] = true;
	};

	// snowball
	imgs.snowballImg = new Image();
	imgs.snowballImg.src = "static/zombiegame_updated/snowball.png";
	imgs.snowballImg.onload = function() {
		loadedImgs["snowball"] = true;
	};

	// snowball
	imgs.wallImg = new Image();
	imgs.wallImg.src = "static/zombiegame_updated/wall.png";
	imgs.wallImg.onload = function() {
		loadedImgs["wall"] = true;
	};

	// mk2
	imgs.mk2Img = new Image();
	imgs.mk2Img.src = "static/zombiegame_updated/mk2.png";
	imgs.mk2Img.onload = function() {
		loadedImgs["mk2"] = true;
	};

	// nade
	imgs.nadeImg = new Image();
	imgs.nadeImg.src = "static/zombiegame_updated/nade.png";
	imgs.nadeImg.onload = function() {
		loadedImgs["nade"] = true;
	};

	// sword of smite
	imgs.smiteSwordImg = new Image();
	imgs.smiteSwordImg.src = "static/zombiegame_updated/smite.png";
	imgs.smiteSwordImg.onload = function() {
		loadedImgs["smiteSword"] = true;
	};
}

loadImgs();
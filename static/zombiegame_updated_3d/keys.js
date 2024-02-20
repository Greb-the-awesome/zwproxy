var divisDownKeys = {};

var arrowKeySensitivity = 20;
		function onKeyDown(event) {
			var keyCode = event.code;
			if (gamestart) {
				divisDownKeys[keyCode] = true;
				if (keyCode == "KeyU") {
					var el = document.getElementById("upgradeMenu");
					if (el.style.display == "block") {
						el.style.display = "none";
						canvas.requestPointerLock();
					} else {
						el.style.display = "block";
						document.exitPointerLock();
					}
				}
				if (keyCode == "KeyC") {
					if (myPlayer.invSelect.specs.swapInto) {
						var count = 0;
						for (let i=0; i<4; i++) {
							if (myPlayer.inv[i].name == myPlayer.invSelect.name) {
								count++;
							}
						}
						if (count >= myPlayer.invSelect.specs.swapNum) {
							var last = 0;
							for (let i=0; i<4; i++) {
								if (myPlayer.inv[i].name == myPlayer.invSelect.name) {
									myPlayer.inv[i] = false;
									last = i;
								}
							}
							var info = myPlayer.invSelect.specs.swapInto;
							myPlayer.inv[last] = new Item([0,0,0], info.name, info.texCoordStart, info.specs, 1);
							myPlayer.selected = last;
						}
					}
				}
				if (keyCode.startsWith("Digit")) {
					var d = parseInt(keyCode[5], 10) - 1;
					if (myPlayer.inv[d]) {myPlayer.selected = d;}
				}
			}
		}
		function onKeyUp(event) {
			keyCode = event.code;
			divisDownKeys[keyCode] = false;
		}
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		function processArrowKeys() {
			if (divisDownKeys["ArrowUp"]) {onCameraTurn({movementX: 0, movementY: -arrowKeySensitivity});}
			if (divisDownKeys["ArrowDown"]) {onCameraTurn({movementX: 0, movementY: arrowKeySensitivity});}
			if (divisDownKeys["ArrowLeft"]) {onCameraTurn({movementX: -arrowKeySensitivity, movementY: 0});}
			if (divisDownKeys["ArrowRight"]) {onCameraTurn({movementX: arrowKeySensitivity, movementY: 0});}
		}

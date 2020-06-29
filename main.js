/**
 * Get element.
 * @returns {HTMLElement}
 * @param {string} string
 * @param {HTMLElement} [parent=document]
 */
function get(string, parent = document) {
	return parent.querySelector(string);
}

/**
 * Get elements.
 * @returns {HTMLElement[]}
 * @param {string} string
 * @param {HTMLElement} [parent=document]
 */
function gets(string, parent = document) {
	return Array.from(parent.querySelectorAll(string));
}

String.prototype.replaceAt = function (index, replacement) {
	return (
		this.substr(0, index) +
		replacement +
		this.substr(index + replacement.length)
	);
};

const getCurrentTurn = () => get(".current.turn");

const generateCode = () => {
	let code = "";
	for (let i = 0; i < 4; i++) {
		code += Math.floor(Math.random() * 6);
	}
	return code;
};

let colors = ["red", "blue", "yellow", "green", "purple", "orange"];
let code = generateCode();
let guessesLeft = 10;

// Drag and drop pins
gets(".pin", get("#pins")).forEach((pin) => {
	pin.onmousedown = (e) => {
		let el = document.createElement("div");
		let color = Array.from(pin.classList.entries())[1][1];

		el.classList.add("pin", color);

		el.style.position = "absolute";
		el.style.left = "calc(" + e.clientX + "px - (var(--pin-size) - 20px) / 2)";
		el.style.top = "calc(" + e.clientY + "px - (var(--pin-size) - 20px) / 2)";
		document.body.appendChild(el);

		document.onmousemove = (e) => {
			el.style.left =
				"calc(" + e.clientX + "px - (var(--pin-size) - 20px) / 2)";
			el.style.top = "calc(" + e.clientY + "px - (var(--pin-size) - 20px) / 2)";
		};

		el.onmouseup = (e) => {
			el.remove();
			let target = document.elementFromPoint(e.clientX, e.clientY);

			if (
				target != null &&
				target.classList.contains("pin") &&
				target.parentElement.classList.contains("current")
			) {
				target.classList.remove(...colors);
				target.classList.add(color);

				if (
					Array.from(getCurrentTurn().children).filter((pin) => {
						let colored = false;
						pin.classList.forEach(
							(className) => (colored = colors.includes(className) || colored)
						);
						return !colored && pin.classList.contains("pin");
					}).length == 0
				) {
					get("#guess").disabled = false;
				}
			}
		};
	};
});

// Guess function
function guess() {
	let outcome = 0;
	let oldTurn = getCurrentTurn();

	// Save old turn
	oldTurn.classList.remove("current");
	get("button#guess", oldTurn).remove();

	// Get user guess
	let userGuess = [];
	gets(".pin", oldTurn).forEach((pin) => {
		let color = Array.from(pin.classList.entries())[1][1];
		userGuess.push(colors.indexOf(color));
	});

	// Score guess
	let codeLeft = code;
	let redPins = [];
	let whitePins = [];
	userGuess.forEach((color, index) => {
		let pinType = -1;
		console.log("%c" + index + "-----", "color:green;");
		console.log(
			`%c${color}%c ${codeLeft.includes(color)} ${parseInt(code[index])}`,
			`color:${colors[color]}`,
			"color:unset;"
		);
		if (codeLeft.includes(color)) {
			pinType = 0;
			if (code[index] == color) {
				pinType = 1;
				codeLeft = codeLeft.replaceAt(codeLeft.indexOf(color), "-");
			} else codeLeft = codeLeft.replaceAt(codeLeft.indexOf(color), ".");
		} else {
			let found = false;
			if (
				code.includes(color) &&
				code[index] == color &&
				codeLeft.split("").filter((char, i) => {
					let isColor = code[i] == color;
					if (isColor && !found) {
						codeLeft[i] = "-";
						found = true;
					}
					return char == "." && isColor;
				}).length > 0
			) {
				whitePins.pop();
				pinType = 1;
			}
		}
		console.log(codeLeft);

		console.log(
			"%c" + pinType,
			`color:${["white", "red", "unset"][pinType != -1 ? pinType : 2]};`
		);

		if (pinType > -1) {
			let pin = document.createElement("div");
			pin.classList.add("code-pin", ["white", "red"][pinType]);
			(pinType ? redPins : whitePins).push(pin);
		}
	});

	// Append code pins
	let pinContainer = document.createElement("div");

	redPins.forEach((pin) => pinContainer.appendChild(pin));
	whitePins.forEach((pin) => pinContainer.appendChild(pin));

	oldTurn.appendChild(pinContainer);

	// Check outcome
	guessesLeft--;
	if (userGuess.join("") == code) {
		outcome = 1;
	} else if (guessesLeft == 0) {
		outcome = -1;
	}

	// Run outcome
	switch (outcome) {
		case 0:
			// Create new blank guess
			let newTurn = document.createElement("div");
			newTurn.classList.add("current", "turn");

			for (let i = 0; i < 4; i++) {
				let pin = document.createElement("span");
				pin.classList.add("pin");
				newTurn.appendChild(pin);
			}

			let guessBtn = document.createElement("button");
			guessBtn.id = "guess";
			guessBtn.innerHTML = "Guess";
			guessBtn.disabled = true;
			guessBtn.onclick = guess;
			newTurn.appendChild(guessBtn);

			get("#game").appendChild(newTurn);
			break;

		case 1:
			end("You won!", "green");
			break;

		case -1:
			end("You lost!", "red");
			break;
	}
}

get("button#guess", getCurrentTurn()).onclick = guess;

function end(msg, color) {
	let codeEl = document.createElement("div");
	codeEl.classList.add("turn");

	for (let i = 0; i < 4; i++) {
		let pin = document.createElement("span");
		pin.classList.add("pin", colors[code[i]]);
		codeEl.appendChild(pin);
	}

	let msgEl = document.createElement("span");
	msgEl.classList.add("msg");
	msgEl.innerHTML = msg;
	msgEl.style.color = color;

	get("#game").appendChild(codeEl);
	get("#game").appendChild(msgEl);
}

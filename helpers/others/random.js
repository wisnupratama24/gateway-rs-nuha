// Generate a random letter (uppercase or lowercase)
function getRandomLetter() {
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	return letters.charAt(Math.floor(Math.random() * letters.length));
}

// Generate a random digit (0-9)
function getRandomDigit() {
	const digits = "0123456789";
	return digits.charAt(Math.floor(Math.random() * digits.length));
}

// Generate the desired random string
function getRandomString() {
	let result = "";

	// Add 3 random letters
	for (let i = 0; i < 3; i++) {
		result += getRandomLetter();
	}

	// Add 2 random digits
	for (let i = 0; i < 2; i++) {
		result += getRandomDigit();
	}

	// Shuffle the result to mix letters and digits
	result = result
		.split("")
		.sort(() => 0.5 - Math.random())
		.join("");

	return result;
}

// Export the functions
module.exports = {
	getRandomLetter,
	getRandomDigit,
	getRandomString,
};

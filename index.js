const Lights = require('./Lights');
const config = require('./tally.config.json');
const { Atem } = require('atem-connection');

const switcher = new Atem();
// Each tally is an object with its own configuration properties and a set of R/G/B LEDs.
const tallies = [];

if(!config.tallies || !config.switcherIP) {
	console.error('No tally lights or switcher IP configured!');
	process.exit();
}

for(let i = 0; i < config.tallies.length; i++) {
	tallies[i] = {};
	/**
	 * @type {{inputID, ledGpioPins: {red,green,blue},
	 * invertSignals, disconnectedFlashColor: {red,blue,green}, disconnectedFlashFrequency}}
	 */
	tallies[i].config = config.tallies[i];

	tallies[i].lights = new Lights(tallies[i].config.ledGpioPins.red, tallies[i].config.ledGpioPins.green,
		tallies[i].config.ledGpioPins.blue, tallies[i].config.invertSignals);

	tallies[i].lights.write(true, false, false);
	// Flash to indicate the tally is currently disconnected
	tallies[i].lights.startFlashing(tallies[i].config.disconnectedFlashColor.red, tallies[i].config.disconnectedFlashColor.green,
		tallies[i].config.disconnectedFlashColor.blue, tallies[i].config.disconnectedFlashFrequency);
}

console.log("Connecting...");
switcher.connect(config.switcherIP);

switcher.on('connected', () => {
	console.log("Connected.");
	for(let i = 0; i < tallies.length; i++) {
		tallies[i].lights.stopFlashing();
	}
});

switcher.on('disconnected', () => {
	console.log("Lost connection!");
	// Flash to indicate the tally is currently disconnected
	for(let i = 0; i < tallies.length; i++) {
		tallies[i].lights.startFlashing(tallies[i].config.disconnectedFlashColor.red,
			tallies[i].config.disconnectedFlashColor.green, tallies[i].config.disconnectedFlashColor.blue,
			tallies[i].config.disconnectedFlashFrequency);
	}
});

switcher.on('stateChanged', (state) => {
	// State does not always contain ME video data; Return if necessary data is missing.
	if(!state || !state.video || !state.video.ME || !state.video.ME[0])
		return;

	const preview = state.video.ME[0].previewInput;
	const program = state.video.ME[0].programInput;

	for(let i = 0; i < tallies.length; i++) {
		// If faded to black, lights are always off
		if(state.video.ME[0].fadeToBlack && state.video.ME[0].fadeToBlack.isFullyBlack) {
			tallies[i].lights.off();
			// This camera is either in program OR preview, and there is an ongoing transition.
		} else if(state.video.ME[0].inTransition && (program === tallies[i].config.inputID || preview === tallies[i].config.inputID)) {
			tallies[i].lights.yellow();
		} else if(program === tallies[i].config.inputID) {
			tallies[i].lights.red();
		} else if(preview === tallies[i].config.inputID) {
			tallies[i].lights.green();
		} else { // Camera is not in preview or program
			tallies[i].lights.off();
		}
	}
});

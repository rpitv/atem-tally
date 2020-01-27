const Lights = require('./Lights');
const { Atem } = require('atem-connection');

const conn = new Atem();
const lights = new Lights(17, 22, 27);
const CAMERA_INPUT = 1; // The input ID that this tally is listening to.
const DISCONNECTED_FLASH_FREQUENCY = 700; // Frequency of the flashing in milliseconds

// Flash to indicate the tally is currently disconnected
lights.startFlashing(255, 0, 0, DISCONNECTED_FLASH_FREQUENCY);

console.log("Connecting...");
conn.connect('172.16.11.25');

conn.on('connected', () => {
	console.log("Connected.");
	lights.stopFlashing();
});

conn.on('disconnected', () => {
	console.log("Lost connection!");
	// Flash to indicate the tally is currently disconnected
	lights.startFlashing(255, 0, 0, DISCONNECTED_FLASH_FREQUENCY);
});

conn.on('stateChanged', (state) => {
	// State does not always contain ME video data; Return if necessary data is missing.
	if(!state || !state.video || !state.video.ME || !state.video.ME[0])
		return;

	const preview = state.video.ME[0].previewInput;
	const program = state.video.ME[0].programInput;

	// If faded to black, lights are always off
	if(state.video.ME[0].fadeToBlack && state.video.ME[0].fadeToBlack.isFullyBlack) {
		lights.off();
	// This camera is featured in a transition
	} else if(state.video.ME[0].inTransition && (program === CAMERA_INPUT || preview === CAMERA_INPUT)) {
		lights.yellow();
	} else if(program === CAMERA_INPUT) {
		lights.red();
	} else if(preview === CAMERA_INPUT) {
		lights.green();
	} else { // Camera is not in preview or program
		lights.off();
	}
});

import Lights from './classes/Lights';
import Colors from './classes/Colors';
import fs from 'fs';
import { Atem } from 'atem-connection';
import IConfig from './classes/IConfig';
const config: IConfig = JSON.parse(fs.readFileSync('./tally.config.json', 'utf-8'));

const switcher = new Atem();

function allDisconnected() {
	for (const tally of config.tallies) {
		const lights = tally.lights;
		if (lights === undefined) {
			console.warn('Light object on the configured tally is not yet defined.');
			continue;
		}
		lights.startFlashing(
			tally.disconnectedFlashColor[0],
			tally.disconnectedFlashColor[1],
			tally.disconnectedFlashColor[2],
			tally.disconnectedFlashFrequency
		);
	}
}

function allConnected() {
	for (const tally of config.tallies) {
		const lights = tally.lights;
		if (lights === undefined) {
			console.warn('Light object on the configured tally is not yet defined.');
			continue;
		}
		lights.stopFlashing();
	}
}

switcher.on('connected', () => {
	console.log('Connected.');
	allConnected();
});

switcher.on('disconnected', () => {
	console.warn('Lost connection!');
	allDisconnected();
});

switcher.on('stateChanged', (state: any) => {
	// State does not always contain ME video data; Return if necessary data is missing.
	if (!state || !state.video || !state.video.ME || !state.video.ME[0]) {
		return;
	}

	const mixer = state.video.ME[0];
	const pvw = mixer.previewInput;
	const pgm = mixer.programInput;

	for (const tally of config.tallies) {
		if (tally.lights === undefined) {
			console.warn('Light object on the configured tally is not yet defined.');
			continue;
		}
		// If faded to black, lights are always off
		if (mixer?.fadeToBlack?.isFullyBlack) {
			tally.lights.off();
			continue;
		}

		// This camera is either in program OR preview, and there is an ongoing transition.
		if (mixer.inTransition && (tally.inputID === pgm || tally.inputID === pvw)) {
			tally.lights.write(Colors.YELLOW);
		} else if (tally.inputID === pgm) { // This camera is in program.
			tally.lights.write(Colors.RED);
		} else if (tally.inputID === pvw) { // This camera is in preview.
			tally.lights.write(Colors.GREEN);
		} else { // Camera is not in any preview or program.
			tally.lights.off();
		}
	}
});


if (!config.tallies || !config.switcherIP) {
	console.error('No tally lights or switcher IP configured!');
	process.exit();
}

for (const tally of config.tallies) {
	// Create the Lights object based off the Tally's config values
	tally.lights = new Lights(
		tally.ledGpioPins[0],
		tally.ledGpioPins[1],
		tally.ledGpioPins[2],
		tally.invertSignals
	);
}
allDisconnected();

console.log('Connecting...');
switcher.connect(config.switcherIP);

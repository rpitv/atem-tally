# ATEM Tally for Raspberry Pi

[![Node.js CI](https://github.com/rpitv/atem-tally/actions/workflows/node.js.yml/badge.svg)](https://github.com/rpitv/atem-tally/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/rpitv/atem-tally/branch/master/graph/badge.svg?token=doiWhO8Q1K)](https://codecov.io/gh/rpitv/atem-tally)

This is a simple camera tally system built to work with Blackmagic Design ATEM 2 switchers on a Raspberry Pi over 3 pins. This allows for easy wired connection over an XLR cable.

## Necessary supplies

* Raspberry Pi (any should do, as long as it has GPIO and network connectivity).
* R/G/B LEDs or at least one RGB LED w/ necessary resistors.
* Ethernet connection to your switcher.
* Diodes for the ground connection.

Hardware instructions coming sometime in the future.

## Usage

1. Connect your LED(s) to the appropriate GPIO pins and edit the config file to contain the right pin numbers.
2. Configure your Raspberry Pi to be on the same network as your ATEM switcher, making sure the Raspberry Pi
is able to ping and connect to the switcher. 
3. Edit the config file to contain the right IP of your switcher and the right input ID to listen to (more info for this step in the future).
4. Install the dependencies with `npm install`.
5. Start the program with `npm start` or your favorite process manager.

## Testing

A unit testing suite is available in [./test](./test). You can run it with `npm test`.

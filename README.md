# Atem Tally for Raspberry Pi &middot;

[![Node.js CI](https://github.com/rpitv/atem-tally/actions/workflows/node.js.yml/badge.svg)](https://github.com/rpitv/atem-tally/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/rpitv/atem-tally/branch/master/graph/badge.svg?token=doiWhO8Q1K)](https://codecov.io/gh/rpitv/atem-tally)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

This is a simple camera tally system built to work with Blackmagic Design ATEM 2 switchers on a Raspberry Pi over 3 pins. This allows for easy wired connection over an XLR cable.

## Necessary supplies

- Raspberry Pi (any should do, as long as it has GPIO and network connectivity).
- R/G/B LEDs or at least one RGB LED w/ necessary resistors.
- Ethernet connection to your switcher.
- Diodes for the ground connection.

Hardware instructions coming sometime in the future.

## Usage

To install the software:

1. Connect your LED(s) to the appropriate GPIO pins and edit the config file to contain the right pin numbers.
2. Configure your Raspberry Pi to be on the same network as your ATEM switcher, making sure the Raspberry Pi
   is able to ping and connect to the switcher.
3. Edit the config file to contain the right IP of your switcher and the right input ID to listen to (more info for this step in the future).
4. Install the dependencies with `npm install`.
5. Start the program with `npm start` or your favorite process manager.

This will start the program, running `src/index.ts` and updating the tally lights until execution is stopped. The state of LEDs will be preserved when the process ends until it is overwritten.

## Configuration

Here you should write what are all of the configurations a user can enter when using the project.

## Development

### Prerequisites

You must install Node.js and NPM before beginning to develop or use this application. Currently, only Node LTS v12, v14, and v16 are tested. Any other version is not guaranteed to work.

It's recommended you install Node.js and NPM using [nvm](https://github.com/nvm-sh/nvm).

### Setting up Dev Environment

Run the following script in order to begin development:

```shell
git clone https://github.com/rpitv/atem-tally.git
cd atem-tally/
npm install
```

You are now ready to write code. All application code is located within [/src](./src). Begin writing in your `.ts` files. It is presumed you will not be developing on a Raspberry Pi. If you do, then you may run the application using `npm start`. Otherwise, use `npm test` to run unit tests on your code.

### Testing

A unit test suite is available for the internal API. Current plans are to eventually add an external API, allowing for arbitrary usage. You may run the test suite by executing:

```shell
npm test
```

Since you presumably will not be developing on a Raspberry Pi, it's important to have a complete testing suite, particularly for components which interact with the Raspberry Pi GPIO pins.

### Style guide

This project follows the guidelines found here: https://github.com/elsewhencode/project-guidelines

The main rule from these guidelines that we do not follow is commits do not necessarily have to go into a dev branch before master. It is up to your distrection to determine whether it would be appropriate to do so.

Code style is enforced using ESLint. Continuous Integration runs the linter before unit tests, however you may also run the linter yourself using:

```shell
npm run lint
```

Automatically fix style issues with:

```shell
npm run fix
```

This command will automatically run in a pre-commit Git hook.

## Licensing

[This project is licensed under the MIT license.](./LICENSE)

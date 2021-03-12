# ATEM Tally for Raspberry Pi
This is a simple camera tally system built to work with Blackmagic Design ATEM 2 switchers on a Raspberry Pi.

A system for multiple tallies has been developed, however I cannot confirm that it fully works at the moment due to the pandemic. Feel free to give it a shot yourself: https://github.com/rpitv/atem-tally/tree/add-multiple-tallys
See issue https://github.com/rpitv/atem-tally/issues/3 for more info and other solutions.

Necessary supplies:
* Raspberry Pi (any should do, as long as it has GPIO and network connectivity)
* R/G/B LEDs or one RGB LED
* Ethernet connection to your switcher

1. Connect your LED(s) to the appropriate GPIO pins and edit the config file to contain the right pin numbers.
2. Configure your Raspberry Pi to be on the same network as your ATEM switcher, making sure the Raspberry Pi
is able to ping and connect to the switcher. 
3. Edit the config file to contain the right IP of your switcher and the right input ID to listen to.
4. Install the dependencies with `npm install`.
5. Start the program with `node index.js` or your favorite process manager.

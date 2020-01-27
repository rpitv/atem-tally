const Gpio = require('pigpio').Gpio;

/**
 * RGB light interface
 */
class Lights {

    /**
     * Constructor
     * @param redGpioPort GPIO pin corresponding to the red LED
     * @param greenGpioPort GPIO pin corresponding to the green LED
     * @param blueGpioPort GPIO pin corresponding to the blue LED
     */
    constructor(redGpioPort, greenGpioPort, blueGpioPort) {
        this.redLight = new Gpio(redGpioPort, {mode: Gpio.OUTPUT});
        this.greenLight = new Gpio(greenGpioPort, {mode: Gpio.OUTPUT});
        this.blueLight = new Gpio(blueGpioPort, {mode: Gpio.OUTPUT});
        this.flashTimer = null;
        this.flashStateIsOn = false;
    }

    /**
     * Start flashing a given color at a given frequency. LED will continue to flash until
     * the program stops, {@link stopFlashing} is called, or one of the specific color methods are
     * called, including {@link off}. {@link pwmWrite} and {@link write} do NOT stop flashing.
     * @param redPwm {number} PWM value to flash for the red LED
     * @param greenPwm {number} PWM value to flash for the green LED
     * @param bluePwm {number} PWM value to flash for the blue LED
     * @param frequency Frequency in milliseconds to flash the LEDs at.
     */
    startFlashing(redPwm, greenPwm, bluePwm, frequency) {
        this.stopFlashing();

        this.flashTimer = setInterval(() => {
            if(this.flashStateIsOn) {
                this.pwmWrite(0, 0, 0);
            } else {
                this.pwmWrite(redPwm, greenPwm, bluePwm);
            }

            this.flashStateIsOn = !this.flashStateIsOn;
        }, frequency);
    }

    /**
     * Stop the flashing interval
     */
    stopFlashing() {
        if(this.flashTimer != null) {
            clearInterval(this.flashTimer);
            this.flashTimer = null;
        }
    }

    /**
     * Turn off all three LEDs
     */
    off() {
        this.stopFlashing();
        this.write(false, false, false);
    }

    /**
     * Turn on the red LED and turn off the blue and green LEDs
     */
    red() {
        this.stopFlashing();
        this.write(true, false, false);
    }

    /**
     * Turn on the green LED and turn off the blue and red LEDs
     */
    green() {
        this.stopFlashing();
        this.write(false, true, false);
    }

    /**
     * Turn on the red LED and green LED (at 27% brightness).
     * This replicates a yellow-like color but necessary powers may vary between different LEDs.
     */
    yellow() {
        this.stopFlashing();
        this.pwmWrite(255, 70, 0);
    }

    /**
     * Write an on/off state to all three LEDs.
     * @param red {boolean} Whether the red LED should be turned on.
     * @param green {boolean} Whether the green LED should be turned on.
     * @param blue {boolean} Whether the blue LED should be turned on.
     */
    write(red = false, green = false, blue = false) {
        this.redLight.digitalWrite(red ? 1 : 0);
        this.greenLight.digitalWrite(green ? 1 : 0);
        this.blueLight.digitalWrite(blue ? 1 : 0);
    }

    /**
     * Write a PWM state to all three LEDs.
     * @param red {number} Red LED PWM value. Expected to be between 0 and 255, inclusive.
     * @param green {number} Green LED PWM value. Expected to be between 0 and 255, inclusive.
     * @param blue {number} Blue LED PWM value. Expected to be between 0 and 255, inclusive.
     */
    pwmWrite(red, green, blue) {
        this.redLight.pwmWrite(red);
        this.greenLight.pwmWrite(green);
        this.blueLight.pwmWrite(blue);
    }
}

module.exports = Lights;

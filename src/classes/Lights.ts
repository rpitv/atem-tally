import Blinker from './Blinker';
import { Gpio } from 'pigpio';

type ColorArray = [number, number, number]|[boolean, boolean, boolean];

/**
 * Raspberry Pi GPIO RGB light API.
 */
class Lights {

    /**
     * GPIO pin connected to the red LED
     * @private
     */
    private redLight: Gpio;
    /**
     * GPIO pin connected to the green LED
     * @private
     */
    private greenLight: Gpio;
    /**
     * GPIO pin connected to the blue LED
     * @private
     */
    private blueLight: Gpio;
    /**
     * Whether it's necessary to invert the colors before they are displayed in PWM writes.
     *   For example, when set to true, 255 is interpreted as off while 0 is interpreted as on.
     * @private
     * @readonly
     */
    private readonly invert: boolean;
    /**
     * Last blinker to be used. Null if blinker has not yet been used. Blinker may still be active.
     *   Thus, you should probably call {@link Blinker#stop} before altering this variable.
     * @private
     */
    private blinker: Blinker|null = null;

    /**
     * Constructor
     * @param redGpioPort {number} GPIO pin corresponding to the red LED
     * @param greenGpioPort {number} GPIO pin corresponding to the green LED
     * @param blueGpioPort {number} GPIO pin corresponding to the blue LED
     * @param invert {boolean} Whether the signals to these lights should be inverted before
     *   writing. E.g., true = off and false = on.
     */
    constructor(redGpioPort: number, greenGpioPort: number, blueGpioPort: number, invert: boolean) {
        this.redLight = new Gpio(redGpioPort, { mode: Gpio.OUTPUT });
        this.greenLight = new Gpio(greenGpioPort, { mode: Gpio.OUTPUT });
        this.blueLight = new Gpio(blueGpioPort, { mode: Gpio.OUTPUT });
        this.invert = invert;
    }

    /**
     * Start flashing a given color at a given frequency. LED will continue to flash until
     *   the program stops or {@link stopFlashing} or {@link off} is called. {@link write} does
     *   NOT stop flashing.
     * @param red {number} PWM value to flash for the red LED.
     *   Expected to be between 0 and 255 inclusively.
     * @param green {number} PWM value to flash for the green LED.
     *   Expected to be between 0 and 255 inclusively.
     * @param blue {number} PWM value to flash for the blue LED.
     *   Expected to be between 0 and 255 inclusively.
     * @param frequency {number} Frequency in milliseconds to flash the LEDs at.
     *   Expected to be greater than or equal to 1.
     * @throws Error if any of the three color values passed fall outside the range 0-255.
     * @throws Error if the passed frequency is less than or equal to 0.
     */
    public startFlashing(red: number, green: number, blue: number, frequency: number): void;
    /**
     * Start flashing a given color at a given frequency. LED will continue to flash until
     *   the program stops or {@link stopFlashing} or {@link off} is called. {@link write} does
     *   NOT stop flashing.
     * @param red {boolean} Boolean digital write value for the red LED.
     * @param green {boolean} Boolean digital write value for the green LED.
     * @param blue {boolean} Boolean digital write value for the blue LED.
     * @param frequency {number} Frequency in milliseconds to flash the LEDs at.
     *   Expected to be greater than or equal to 1.
     * @throws Error if the passed frequency is less than or equal to 0.
     */
    public startFlashing(red: boolean, green: boolean, blue: boolean, frequency: number): void;
    public startFlashing(red: number|boolean, green: number|boolean, blue: number|boolean,
                         frequency: number): void {
        if (frequency <= 0) {
            throw new Error('Flash frequency must be greater than or equal to 1.');
        }

        if (typeof red === 'boolean' && typeof green === 'boolean' && typeof blue === 'boolean') {
            this.stopFlashing();

            this.blinker = new Blinker(frequency).subscribe((state: boolean) => {
                if (state) {
                    this.write(true, true, true);
                } else {
                    this.write(false, false, false);
                }
            });
        } else if (
            typeof red === 'number' &&
            typeof green === 'number' &&
            typeof blue === 'number'
        ) {
            if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) {
                throw new Error(
                    'Color values passed to startFlashing() must be between 0 and 255 inclusively.'
                );
            }
            this.stopFlashing();

            this.blinker = new Blinker(frequency).subscribe((state: boolean) => {
                if (state) {
                    this.write(red, green, blue);
                } else {
                    this.write(0, 0, 0);
                }
            });
        }
    }

    /**
     * Stop any flashing which is currently happening. If the Light is not currently flashing,
     * nothing happens.
     */
    public stopFlashing(): void {
        this.blinker?.stop();
    }

    /**
     * Turn off all three LEDs. Also disables any flashing.
     */
    public off(): void {
        this.stopFlashing();
        this.write(false, false, false);
    }

    /**
     * Write an on/off state to all three LEDs.
     * @param rgb Array of 3 boolean states OR values between 0-255 to assign to the red,
     *   green, and blue LEDs respectively.
     * @throws Error if an illegal combination of arguments is provided.
     */
    public write(rgb: ColorArray): void;
    /**
     * Write an on/off state to all three LEDs.
     * @param red Whether the red LED should be turned on.
     * @param green Whether the green LED should be turned on.
     * @param blue Whether the blue LED should be turned on.
     * @throws Error if an illegal combination of arguments is provided.
     */
    public write(red: boolean, green: boolean, blue: boolean): void;
    /**
     * Write a PWM state to all three LEDs.
     * @param red Red LED value. Expected to be between 0 and 255, inclusive.
     * @param green Green LED value. Expected to be between 0 and 255, inclusive.
     * @param blue Blue LED value. Expected to be between 0 and 255, inclusive.
     * @throws Error if provided a color value outside the range 0-255.
     * @throws Error if an illegal combination of arguments is provided.
     */
    public write(red: number, green: number, blue: number): void;
    public write(red: number|boolean|ColorArray, green?: number|boolean,
                 blue?: number|boolean): void {
        if (Array.isArray(red)) {
            green = red[1];
            blue = red[2];
            red = red[0];
        }

        if (typeof red === 'number' && typeof green === 'number' && typeof blue === 'number') {
            if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) {
                throw new Error(
                    'Colors must be between 0 and 255 (inclusively) or boolean values.');
            }
            if (this.invert) {
                red = 255 - red;
                green = 255 - green;
                blue = 255 - blue;
            }

            this.redLight.pwmWrite(red);
            this.greenLight.pwmWrite(green);
            this.blueLight.pwmWrite(blue);

        } else if (typeof red === 'boolean' &&
            typeof green === 'boolean' &&
            typeof blue === 'boolean'
        ) {
            if (this.invert) {
                red = !red;
                green = !green;
                blue = !blue;
            }

            if (red && green && blue) {
                red = green = blue = false;
            }

            this.redLight.digitalWrite(red ? 1 : 0);
            this.greenLight.digitalWrite(green ? 1 : 0);
            this.blueLight.digitalWrite(blue ? 1 : 0);
        } else {
            throw new Error(
                'Arguments to Lights.write() must be either all numbers or all booleans.');
        }
    }
}

export default Lights;

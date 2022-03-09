import Lights from "./Lights";
import { Gpio } from "../../__mocks__/pigpio";

jest.useFakeTimers();

const digitalSpy = jest.spyOn(Gpio.prototype, "digitalWrite");
const pwmSpy = jest.spyOn(Gpio.prototype, "pwmWrite");

interface IDiode {
    pins: [number, number, number];
    vals: [boolean, boolean, boolean] | [number, number, number];
    invert: boolean;
    writeAsArray: boolean;
}
class DigitalDiode implements IDiode {
    pins: [number, number, number];
    vals: [boolean, boolean, boolean];
    invert: boolean;
    writeAsArray: boolean;

    constructor(
        pin1: number,
        pin2: number,
        pin3: number,
        val1: boolean,
        val2: boolean,
        val3: boolean,
        invert: boolean,
        writeAsArray: boolean
    ) {
        this.pins = [pin1, pin2, pin3];
        this.vals = [val1, val2, val3];
        this.invert = invert;
        this.writeAsArray = writeAsArray;
    }
}
class PwmDiode implements IDiode {
    pins: [number, number, number];
    vals: [number, number, number];
    invert: boolean;
    writeAsArray: boolean;

    constructor(
        pin1: number,
        pin2: number,
        pin3: number,
        val1: number,
        val2: number,
        val3: number,
        invert: boolean,
        writeAsArray: boolean
    ) {
        this.pins = [pin1, pin2, pin3];
        this.vals = [val1, val2, val3];
        this.invert = invert;
        this.writeAsArray = writeAsArray;
    }
}

/**
 * Helper function that allows for blackbox testing of writes to GPIO pins.
 * @param diodes Array of LED diodes.
 */
function testBasicWrites(diodes: IDiode[]) {
    // Count the total number of digital pins and pwm diodes.
    let digitalDiodes = 0;
    let pwmDiodes = 0;
    for (const diode of diodes) {
        if (diode instanceof PwmDiode) {
            pwmDiodes++;
        } else {
            digitalDiodes++;
        }
    }

    // Call the write methods for each diode.
    for (const diode of diodes) {
        const lights = new Lights(
            diode.pins[0],
            diode.pins[1],
            diode.pins[2],
            diode.invert
        );
        if (diode instanceof PwmDiode) {
            if (diode.writeAsArray) {
                lights.write(diode.vals);
            } else {
                lights.write(diode.vals[0], diode.vals[1], diode.vals[2]);
            }
        } else if (diode instanceof DigitalDiode) {
            if (diode.writeAsArray) {
                lights.write(diode.vals);
            } else {
                lights.write(diode.vals[0], diode.vals[1], diode.vals[2]);
            }
        }
    }
    // Confirm the correct methods have been called. Each will be called 3 times,
    //  one for each pin.
    expect(digitalSpy).toHaveBeenCalledTimes(digitalDiodes * 3);
    expect(pwmSpy).toHaveBeenCalledTimes(pwmDiodes * 3);

    // We don't know which of the three pins is written to first in each write() call,
    //  however we do know that all 3 of them will be called in succession. So,
    //  verify that each pin for each diode is written to with the correct value.
    let pwmDiodesSeen = 0;
    let digitalDiodesSeen = 0;
    for (const diode of diodes) {
        // Two different spies, so we must figure out which spy is necessary for this diode,
        //  and then get the index based off of how many other diodes previously used this spy.
        let spy, spyIndex;
        if (diode instanceof PwmDiode) {
            spy = pwmSpy;
            spyIndex = pwmDiodesSeen++ * 3;
        } else {
            spy = digitalSpy;
            spyIndex = digitalDiodesSeen++ * 3;
        }
        let pinsSeen = 0;
        // For each call to the spy (there's always 3 calls, corresponding to 3 pins)
        for (let i = 0; i < 3; i++) {
            // And for each pin on the diode
            for (let j = 0; j < diode.pins.length; j++) {
                // If this mock call index corresponds to the current diode pin
                if (
                    (spy.mock.instances[spyIndex + i] as any).pin ===
                    diode.pins[j]
                ) {
                    // Confirm that the value passed to this mock call matches the diode
                    //  value that was passed to this function. Digital diodes written as a 1/0,
                    //  but we store true/false in our tests.
                    if (diode instanceof DigitalDiode) {
                        // Invert expected output if necessary
                        let expected;
                        if (diode.invert) {
                            expected = diode.vals[j] ? 0 : 1;
                        } else {
                            expected = diode.vals[j] ? 1 : 0;
                        }
                        expect(
                            (spy.mock.calls[spyIndex + i] as any)[0]
                        ).toEqual(expected);
                    } else if (diode instanceof PwmDiode) {
                        // Invert expected output if necessary
                        let expected = diode.vals[j];
                        if (diode.invert) {
                            expected = 255 - expected;
                        }
                        expect(
                            (spy.mock.calls[spyIndex + i] as any)[0]
                        ).toEqual(expected);
                    }
                    pinsSeen++;
                    break;
                }
            }
        }
        // For each diode, all 3 pins should have received a GPIO write.
        expect(pinsSeen).toEqual(3);
    }
}

it("Does not allow pins less than 0.", () => {
    expect(() => {
        new Lights(0, 1, -2, false);
    }).toThrow(Error);
});

it("Writes the correct values on digital writes.", () => {
    testBasicWrites([
        new DigitalDiode(11, 12, 13, true, true, false, false, false),
        new DigitalDiode(14, 15, 16, false, true, true, false, false),
        new DigitalDiode(18, 19, 20, false, false, false, false, false),
    ]);
});

it("Writes the correct values on PWM writes.", () => {
    testBasicWrites([
        new PwmDiode(10, 100, 1353, 50, 150, 10, false, false),
        new PwmDiode(7, 6, 4, 13, 123, 84, false, false),
        new PwmDiode(31, 65, 1, 50, 63, 137, false, false),
    ]);
});

it("Does not allow pin IDs less than 0.", () => {
    expect(() => {
        testBasicWrites([
            new PwmDiode(10, -100, 1353, 50, 150, 10, false, false),
        ]);
    }).toThrow(Error);
});

it("Does not allow PWM writes less than 0.", () => {
    expect(() => {
        testBasicWrites([
            new PwmDiode(10, 100, 1353, -50, 150, 10, false, false),
        ]);
    }).toThrow(Error);
});

it("Does not allow PWM writes greater than 255.", () => {
    expect(() => {
        testBasicWrites([
            new PwmDiode(10, 100, 1353, 50, 256, 10, false, false),
        ]);
    }).toThrow(Error);
});

it("Does not allow writes of different values to the same pin.", () => {
    expect(() => {
        testBasicWrites([
            new PwmDiode(10, 10, 1353, 50, 256, 10, false, false),
            new DigitalDiode(10, 10, 1353, false, false, false, false, false),
        ]);
    }).toThrow(Error);
});

it("Accepts writes in the form of an array.", () => {
    testBasicWrites([
        new DigitalDiode(10, 100, 1353, true, false, true, false, true),
        new PwmDiode(10, 100, 1353, 50, 150, 10, false, true),
    ]);
});

it("Properly inverts writes.", () => {
    testBasicWrites([
        new PwmDiode(1, 2, 3, 50, 150, 10, true, true),
        new PwmDiode(1, 2, 3, 0, 0, 0, true, true),
        new PwmDiode(1, 2, 3, 255, 255, 255, true, true),
        new DigitalDiode(1, 2, 3, true, true, true, true, true),
        new DigitalDiode(1, 2, 3, false, false, true, true, false),
        new DigitalDiode(1, 2, 3, true, true, false, true, false),
    ]);
});

it("Does not allow digital writes to all three LEDs at the same time.", () => {
    expect(() => {
        testBasicWrites([
            new DigitalDiode(1, 2, 3, true, true, true, false, true),
        ]);
    }).toThrow(Error);
    expect(() => {
        testBasicWrites([
            new DigitalDiode(1, 2, 3, true, true, true, false, false),
        ]);
    }).toThrow(Error);
    expect(() => {
        testBasicWrites([
            new DigitalDiode(1, 2, 3, false, false, false, true, true),
        ]);
    }).toThrow(Error);
    expect(() => {
        testBasicWrites([
            new DigitalDiode(1, 2, 3, false, false, false, true, false),
        ]);
    }).toThrow(Error);
});

it("Does not allow mixed writes of PWM and digital.", () => {
    expect(() => {
        const lights = new Lights(1, 2, 3, false);
        // @ts-ignore Intentional test
        lights.write(false, 100, true);
    }).toThrow(Error);
});

it("Turns off all pins with off().", () => {
    const lights = new Lights(1, 2, 3, false);
    lights.write(25, 66, 127);
    expect(digitalSpy).toHaveBeenCalledTimes(0);
    lights.off();
    expect(digitalSpy).toHaveBeenCalledTimes(3);
    expect((digitalSpy.mock.calls[0] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[1] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[2] as any)[0]).toEqual(0);
    lights.write(true, false, true);
    lights.off();
    expect(digitalSpy).toHaveBeenCalledTimes(9);
    expect((digitalSpy.mock.calls[6] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[7] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[8] as any)[0]).toEqual(0);
    lights.write([false, false, true]);
    lights.off();
    expect(digitalSpy).toHaveBeenCalledTimes(15);
    expect((digitalSpy.mock.calls[12] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[13] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[14] as any)[0]).toEqual(0);
    lights.write([11, 22, 33]);
    lights.off();
    expect(digitalSpy).toHaveBeenCalledTimes(18);
    expect((digitalSpy.mock.calls[15] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[16] as any)[0]).toEqual(0);
    expect((digitalSpy.mock.calls[17] as any)[0]).toEqual(0);
});

it("Enables PWM flashing with startFlashing()", () => {
    const lights = new Lights(1, 2, 3, false);
    lights.startFlashing(255, 70, 0, 500);
    setTimeout(() => {
        expect(pwmSpy).toHaveBeenCalledTimes(12);
        lights.stopFlashing();
    }, 2000);
    jest.runAllTimers();
});

it("Enables digital flashing with startFlashing()", () => {
    const lights = new Lights(1, 2, 3, false);
    lights.startFlashing(true, false, false, 500);
    setTimeout(() => {
        expect(digitalSpy).toHaveBeenCalledTimes(12);
        lights.stopFlashing();
    }, 2000);
    jest.runAllTimers();
});

it("Stops flashing with stopFlashing()", () => {
    const digitalLights = new Lights(1, 2, 3, false);
    const pwmLights = new Lights(1, 2, 3, false);
    digitalLights.startFlashing(true, false, false, 500);
    pwmLights.startFlashing(100, 200, 255, 250);
    setTimeout(() => {
        expect(digitalSpy).toHaveBeenCalledTimes(12);
        expect(pwmSpy).toHaveBeenCalledTimes(24);
        digitalLights.stopFlashing();
        pwmLights.stopFlashing();
        setTimeout(() => {
            expect(digitalSpy).toHaveBeenCalledTimes(12);
            expect(pwmSpy).toHaveBeenCalledTimes(24);
        }, 2000);
    }, 2000);
    jest.runAllTimers();
});

it("Stops flashing with off()", () => {
    const digitalLights = new Lights(1, 2, 3, false);
    const pwmLights = new Lights(1, 2, 3, false);
    digitalLights.startFlashing(true, false, false, 500);
    pwmLights.startFlashing(100, 200, 255, 250);
    setTimeout(() => {
        expect(digitalSpy).toHaveBeenCalledTimes(12);
        expect(pwmSpy).toHaveBeenCalledTimes(24);
        digitalLights.off();
        pwmLights.off();
        setTimeout(() => {
            expect(digitalSpy).toHaveBeenCalledTimes(18);
            expect(pwmSpy).toHaveBeenCalledTimes(24);
        }, 2000);
    }, 2000);
    jest.runAllTimers();
});

it("Does not allow flashing at a frequency less than or equal to 0.", () => {
    const digitalLights = new Lights(1, 2, 3, false);
    const pwmLights = new Lights(1, 2, 3, false);
    expect(() => {
        digitalLights.startFlashing(true, false, false, 0);
    }).toThrow(Error);
    expect(() => {
        pwmLights.startFlashing(100, 200, 255, 0);
    }).toThrow(Error);
    expect(() => {
        digitalLights.startFlashing(true, false, false, -10);
    }).toThrow(Error);
    expect(() => {
        pwmLights.startFlashing(100, 200, 255, -10);
    }).toThrow(Error);
    setTimeout(() => {
        expect(digitalSpy).toHaveBeenCalledTimes(0);
        expect(pwmSpy).toHaveBeenCalledTimes(0);
    }, 2000);
    jest.runAllTimers();
});

it("Does not allow flashing values less than 0.", () => {
    const lights = new Lights(1, 2, 3, false);
    expect(() => {
        lights.startFlashing(100, -200, 255, 100);
    }).toThrow(Error);
    setTimeout(() => {
        expect(digitalSpy).toHaveBeenCalledTimes(0);
        expect(pwmSpy).toHaveBeenCalledTimes(0);
    }, 500);
    jest.runAllTimers();
});

it("Does not allow flashing values greater than 255.", () => {
    const lights = new Lights(1, 2, 3, false);
    expect(() => {
        lights.startFlashing(100, 200, 256, 100);
    }).toThrow(Error);
    setTimeout(() => {
        expect(digitalSpy).toHaveBeenCalledTimes(0);
        expect(pwmSpy).toHaveBeenCalledTimes(0);
    }, 500);
    jest.runAllTimers();
});

import { LEDArray } from "pi-led-control";

interface ITally {
    inputID: number;
    ledGpioPins: [number, number, number];
    disconnectedFlashFrequency: number;
    disconnectedFlashColor: [number, number, number];
    invertSignals: false;
    lights?: LEDArray;
}

export default ITally;

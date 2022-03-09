import Lights from "./Lights";

interface ITally {
    inputID: number;
    ledGpioPins: [number, number, number];
    disconnectedFlashFrequency: number;
    disconnectedFlashColor: [number, number, number];
    invertSignals: false;
    lights?: Lights;
}

export default ITally;

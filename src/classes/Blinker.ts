/**
 * Handles blinking between an on and off state at a given frequency. What any given
 *   Blinker toggles on and off is up to the client, by using the {@link Blinker#subscribe}
 *   method. Blinker will continue to run even if there are no subscribers, until
 *   {@link Blinker#stop} is called.
 */
class Blinker {
    /**
     * Number of milliseconds between each toggle of the state on and off.
     * @private
     */
    private readonly millis: number;
    /**
     * Node.JS interval timer, if the blinker is currently running. Otherwise null.
     * @private
     */
    private timer: NodeJS.Timer | null = null;
    /**
     * The state that was most recently passed to all subscribers. Even if there are
     *   no current subscribers, this state will continue to update until {@link #stop}
     *   is called.
     * @private
     */
    private currentState = false;
    /**
     * List of all listening functions. Each function is called every time the state of
     * this Blinker is toggled, passing the new state.
     * @private
     */
    private listeners: ((state: boolean) => void)[] = [];

    /**
     * Constructor
     * @param millis Number of milliseconds between each toggle of the state of this Blinker.
     *   Expected to be greater than 0.
     * @throws Error if millis is less than or equal to 0.
     */
    public constructor(millis: number);
    /**
     * Constructor
     * @param millis Number of milliseconds between each toggle of the state of this Blinker.
     *   Expected to be greater than 0.
     * @param start Whether the blinker should start as soon as constructed. If set to false,
     *   you can start the Blinker by calling {@link #start()}
     * @throws Error if millis is less than or equal to 0.
     */
    public constructor(millis: number, start: boolean);
    /**
     * Constructor
     * @param millis Number of milliseconds between each toggle of the state of this Blinker.
     *   Expected to be greater than 0.
     * @param start Whether this Blinker should immediately be started upon construction.
     *   Defaults true.
     * @throws Error if millis is less than or equal to 0.
     */
    public constructor(millis: number, start?: boolean) {
        if (millis <= 0) {
            throw new Error("Milliseconds must be greater than or equal to 1.");
        }
        this.millis = millis;
        if (start || start === undefined) {
            this.start();
        }
    }

    /**
     * Subscribe to any changes in this Blinker's state.
     * @param fn Function which should be called every time the state of this Blinker changes.
     *   If you wish to stop listening, pass the same instance of this Function to
     *   {@link #unsubscribe}. Passing a Function which is already subscribed has no effect.
     */
    public subscribe(fn: (state: boolean) => void): Blinker {
        if (!this.listeners.includes(fn)) {
            this.listeners.push(fn);
        }
        return this;
    }

    /**
     * Unsubscribe from changes to this Blinker's state.
     * @param fn Function which you want to stop listening for changes. This must be the
     *   same instance of the Function that was originally passed to {@link #subscribe}.
     *   Passing a Function which is not currently subscribed has no effect.
     */
    public unsubscribe(fn: (state: boolean) => void): Blinker {
        const idx = this.listeners.indexOf(fn);
        if (idx >= 0) {
            this.listeners.splice(idx, 1);
        }
        return this;
    }

    /**
     * Start blinking. Has no effect if this Blinker is already in the process of blinking.
     */
    public start(): Blinker {
        if (this.timer === null) {
            this.timer = setInterval(() => {
                this.currentState = !this.currentState;
                for (const listener of this.listeners) {
                    listener(this.currentState);
                }
            }, this.millis);
        }
        return this;
    }

    /**
     * Stop blinking. Has no effect if this Blinker is not currently blinking.
     */
    public stop(): Blinker {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
        return this;
    }

    /**
     * Get the current state of this Blinker.
     */
    public get state() {
        return this.currentState;
    }

    /**
     * Get whether this Blinker is currently Blinking. If true, then {@link #subscribe}
     *   will eventually be called. Calling {@link #start} is not necessary.
     */
    public get isActive() {
        return this.timer !== null;
    }
}

export default Blinker;

import Blinker from '../src/classes/Blinker';

jest.useFakeTimers();

it('Throws error when milliseconds equal to 0.', () => {
    expect(() => {
        new Blinker(0);
    }).toThrow(Error);
});

it('Throws error when milliseconds less than 0.', () => {
    expect(() => {
        new Blinker(-100);
    }).toThrow(Error);
});

it('Auto-starts when only milliseconds is passed to constructor.', () => {
    expect(new Promise((resolve, reject) => {
        const timeout: NodeJS.Timer = setTimeout(() => {
            resolve(false);
        }, 1000);
        try {
            new Blinker(100).subscribe(() => {
                resolve(true);
                clearTimeout(timeout);
            });
        } catch (e) {
            reject(e);
        }
    })).resolves.toEqual(true);
});

it('Auto-starts when start = true is passed to constructor.', () => {
    expect(new Promise((resolve, reject) => {
        let blinker: Blinker;
        const timeout: NodeJS.Timer = setTimeout(() => {
            resolve(false);
            blinker.stop();
        }, 1000);
        try {
            blinker = new Blinker(100, true).subscribe(() => {
                clearTimeout(timeout);
                blinker.stop();
                resolve(true);
            });
        } catch (e) {
            reject(e);
        }
    })).resolves.toEqual(true);
});

it('Does not auto-start when start = false is passed to constructor.', () => {
    expect(new Promise((resolve, reject) => {
        let blinker: Blinker;
        const timeout: NodeJS.Timer = setTimeout(() => {
            resolve(true);
            blinker.stop();
        }, 1000);
        try {
            blinker = new Blinker(100, false).subscribe(() => {
                clearTimeout(timeout);
                blinker.stop();
                resolve(false);
            });
        } catch (e) {
            reject(e);
        }
    })).resolves.toEqual(true);
});

it('Calls all subscribers within at the appropriate period of time.', () => {
    jest.spyOn(global, 'setInterval');
    const interval = 765;
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const blinker = new Blinker(interval)
        .subscribe(callback1)
        .subscribe(callback2)
        .subscribe(callback3);

    setTimeout(() => {
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), interval);
        expect(callback1).toHaveBeenCalledTimes(5);
        expect(callback2).toHaveBeenCalledTimes(5);
        expect(callback3).toHaveBeenCalledTimes(5);
        blinker.stop();
    }, interval * 5);
    jest.advanceTimersByTime(interval * 10);
});

it('Does not call subscribers once stopped.', () => {
    jest.spyOn(global, 'setInterval');
    const interval = 765;
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const blinker = new Blinker(interval)
        .subscribe(callback1)
        .subscribe(callback2)
        .subscribe(callback3);

    setTimeout(() => {
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), interval);
        expect(callback1).toHaveBeenCalledTimes(5);
        expect(callback2).toHaveBeenCalledTimes(5);
        expect(callback3).toHaveBeenCalledTimes(5);
        blinker.stop();

        setTimeout(() => {
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), interval);
            expect(callback1).toHaveBeenCalledTimes(5);
            expect(callback2).toHaveBeenCalledTimes(5);
            expect(callback3).toHaveBeenCalledTimes(5);
        }, interval * 5);
    }, interval * 5);
    jest.advanceTimersByTime(interval * 10);
});

it('Calls subscribers once started.', () => {
    jest.spyOn(global, 'setInterval');
    const interval = 765;
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const blinker = new Blinker(interval, false)
        .subscribe(callback1)
        .subscribe(callback2)
        .subscribe(callback3);

    setTimeout(() => {
        expect(callback1).toHaveBeenCalledTimes(0);
        expect(callback2).toHaveBeenCalledTimes(0);
        expect(callback3).toHaveBeenCalledTimes(0);
        blinker.start();

        setTimeout(() => {
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), interval);
            expect(callback1).toHaveBeenCalledTimes(5);
            expect(callback2).toHaveBeenCalledTimes(5);
            expect(callback3).toHaveBeenCalledTimes(5);
            blinker.stop();
        }, interval * 5);
    }, interval * 5);
    jest.advanceTimersByTime(interval * 10);
});

it('Does not allow a subscriber to be subscribed multiple times.', () => {
    const interval = 432;
    const callback = jest.fn();
    const blinker = new Blinker(interval)
        .subscribe(callback).subscribe(callback);

    setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(3);
        blinker.stop();
    }, interval * 3);
    jest.advanceTimersByTime(interval * 6);
});

it('Does not call subscribers which have unsubscribed.', () => {
    const interval = 891;
    const callback = jest.fn();
    const blinker = new Blinker(interval).subscribe(callback);

    setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(3);
        blinker.unsubscribe(callback);
        setTimeout(() => {
            expect(callback).toHaveBeenCalledTimes(3);
            blinker.stop();
        }, interval * 3);
    }, interval * 3);
    jest.advanceTimersByTime(interval * 9);
});

it('Alternates between on and off, starting with on.', () => {
    const interval = 639;
    const callback = jest.fn();
    const blinker = new Blinker(interval).subscribe(callback);

    setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenLastCalledWith(true);
        expect(blinker.state).toEqual(true);
    }, interval);
    setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenLastCalledWith(false);
        expect(blinker.state).toEqual(false);
    }, interval * 2);
    setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(3);
        expect(callback).toHaveBeenLastCalledWith(true);
        expect(blinker.state).toEqual(true);
        blinker.stop();
    }, interval * 3);
    jest.advanceTimersByTime(interval * 3);
});

it('isActive properly reports whether the blinker is running.', () => {
    const interval = 113;
    const blinker = new Blinker(interval).subscribe(jest.fn());
    expect(blinker.isActive).toEqual(true);
    blinker.stop();
    expect(blinker.isActive).toEqual(false);
    blinker.start();
    expect(blinker.isActive).toEqual(true);
});

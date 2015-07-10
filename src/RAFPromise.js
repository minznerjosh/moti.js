const raf = global.requestAnimationFrame ||
    global.webkitRequestAnimationFrame ||
    global.mozRequestAnimationFrame ||
    global.msRequestAnimationFrame ||
    function(fn) { setTimeout(fn, 16); };

const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

const flush = (() => {
    const items = [];
    let flushScheduled = false;

    return function flush(fn) {
        items.push(fn);

        if (!flushScheduled) {
            flushScheduled = true;

            raf(() => {
                let item;

                while (item = items.shift()) {
                    item();
                }

                flushScheduled = false;
            });
        }
    };
}());

function isObject(value) {
    return Object(value) === value;
}

function onlyOnce(fn) {
    const onceFn = function(...args) {
        if (onceFn.called) { return; }
        onceFn.called = true;

        return fn(...args);
    };
    onceFn.called = false;

    return onceFn;
}

function onlyIf(predicate, fn) {
    return function(...args) {
        if (predicate()) { return fn(...args); }
    };
}

function notify(listeners, data) {
    flush(() => {
        let listener;

        while (listener = listeners.shift()) {
            const { handler, child } = listener;

            try {
                resolve(child, handler(data));
            } catch (exception) {
                reject(child, exception);
            }
        }
    });
}

function isPending(promise) {
    return promise.__private__.state === PENDING;
}

function fulfill(promise, value) {
    if (!isPending(promise)) { return; }

    const $private = promise.__private__;

    $private.state = FULFILLED;
    $private.value = value;
    notify($private.listeners.fulfillment, value);
}

function reject(promise, reason) {
    if (!isPending(promise)) { return; }

    const $private = promise.__private__;

    $private.state = REJECTED;
    $private.reason = reason;
    notify($private.listeners.rejection, reason);
}

function resolve(promise, value) {
    if (!isPending(promise)) { return; }

    const resolver = onlyOnce(value => resolve(promise, value));
    const rejecter = onlyIf(() => !resolver.called, reason => reject(promise, reason));

    try {
        const then = isObject(value) && value.then;

        if (value === promise) {
            return rejecter(new TypeError('Cannot resolve promise with itself.'));
        }

        if (typeof then === 'function') {
            then.call(value, resolver, rejecter);
        } else {
            fulfill(promise, value);
        }
    } catch (exception) {
        rejecter(exception);
    }
}

export default class RAFPromise {
    constructor(resolver) {
        if (typeof resolver !== 'function') {
            throw new Error('Resolver must be a function.');
        }

        this.__private__ = {
            state: PENDING,
            value: undefined,
            reason: undefined,
            listeners: {
                fulfillment: [],
                rejection: []
            }
        };

        const resolvePromise = (value => resolve(this, value));
        const rejectPromise = (reason =>  reject(this, reason));

        resolver(resolvePromise, rejectPromise);
    }

    then(onFulfillment, onRejection) {
        const $private = this.__private__;

        let resolveChild, rejectChild;
        const promise = new this.constructor((resolve, reject) => {
            resolveChild = resolve;
            rejectChild = reject;
        });

        $private.listeners.fulfillment.push({
            handler: typeof onFulfillment === 'function' ? onFulfillment : resolveChild,
            child: promise
        });
        $private.listeners.rejection.push({
            handler: typeof onRejection === 'function' ? onRejection : rejectChild,
            child: promise
        });

        switch ($private.state) {
        case FULFILLED:
            notify($private.listeners.fulfillment, $private.value);
            break;
        case REJECTED:
            notify($private.listeners.rejection, $private.reason);
            break;
        }

        return promise;
    }

    catch(onRejection) {
        return this.then(null, onRejection);
    }

    finally(handler) {
        const Constructor = this.constructor;

        const notify = (() => Constructor.resolve(handler()));
        const handleFulfillment = (value => notify().then(() => value));
        const handleRejection = (reason => notify().then(() => Constructor.reject(reason)));

        return this.then(handleFulfillment, handleRejection);
    }
}

RAFPromise.resolve = function resolve(data) { // jshint ignore:line
    return new this(resolve => resolve(data));
};

RAFPromise.reject = function reject(reason) { // jshint ignore:line
    return new this((resolve, reject) => reject(reason));
};

RAFPromise.all = function all(promises) { // jshint ignore:line
    if (promises.length === 0) {
        return this.resolve([]);
    }

    return new this((resolve, reject) => {
        const total = promises.length;
        const result = [];

        let resolutions = 0;
        const onValue = (index => value => {
            result[index] = value;
            if (++resolutions === total) { resolve(result); }
        });

        promises.forEach((promise, index) => this.resolve(promise).then(onValue(index), reject));
    });
};

import RAFPromise from './RAFPromise.js';
import prefix from 'prefix';
const testing = !!global.__karma__;

const onTransitionEnd = (function() {
    let possibleEvents = [
        'transitionend', 'webkitTransitionEnd', 'oTransitionEnd', 'otransitionend'
    ];

    return function onTransitionEnd(element, callback) {
        function handle(event) {
            callback(event);
            possibleEvents.forEach(event => element.removeEventListener(event, handle, false));

            if (!testing) {
                possibleEvents = [event.type];
            }
        }

        possibleEvents.forEach(event => element.addEventListener(event, handle, false));
    };
}());

function reflow(element) {
    /* jshint expr:true */
    element.offsetHeight;
    return element;
}

function parseTransition(element) {
    const value = element.style[prefix('transition')];

    return (value && value.split(/,\s+/).map(directive => {
        const [prop, duration, easing] = directive.split(/\s+/);
        return { prop, duration, easing };
    })) || [];
}

function compileTransition(configs) {
    return configs.map(({ prop, duration, easing }) => `${prop} ${duration} ${easing}`).join(', ');
}

function addTransition(element, prop, duration, easing) {
    element.style[prefix('transition')] = compileTransition(
        parseTransition(element).concat([{ prop, duration, easing }])
    );
}

function removeTransition(element, propToRemove) {
    element.style[prefix('transition')] = compileTransition(
        parseTransition(element).filter(({ prop }) => prop !== propToRemove)
    );
}

export function select(selector) {
    const isString = (typeof selector === 'string');

    if (!isString && !(selector instanceof Element)) {
        return RAFPromise.reject(new Error(
            'You must pass a selector String or Element to select().'
        ));
    }

    return RAFPromise.resolve(isString ? document.querySelector(selector) : selector);
}

export function transition(prop, value, duration = 1, easing = 'linear') {
    return function animate(element) {
        const style = element.style;

        return new RAFPromise(resolve => {
            addTransition(element, prefix(prop), `${duration}s`, easing);
            reflow(element);

            style[prefix(prop)] = value;

            onTransitionEnd(element, ({ propertyName }) => {
                if (propertyName !== prefix(prop)) { return; }

                removeTransition(element, propertyName);
                resolve(element);
            });
        });
    };
}

export function many(fns) {
    return function callAll(element) {
        return RAFPromise.all(fns.map(fn => fn(element))).then(() => element);
    };
}

export function translate(x, y, duration, easing) {
    const xString = typeof x === 'string' ? x : `${x}px`;
    const yString = typeof x === 'string' ? y : `${y}px`;

    return transition('transform', `translate3d(${xString}, ${yString}, 0)`, duration, easing);
}

export function set(prop, value) {
    return function setProp(element) {
        element.style[prefix(prop)] = value;

        return RAFPromise.resolve(element);
    };
}

/* global chai */
/* jshint esnext:true, browserify: true, strict:false */
chai.use(require('sinon-chai'));

let autoflush = false;
const rafFns = [];
const raf = global.requestAnimationFrame || (function() {
    const fns = [];
    let flushScheduled = false;

    return function requestAnimationFrame(fn) {
        fns.push(fn);

        if (!flushScheduled) {
            flushScheduled = true;

            setTimeout(() => {
                const tasks = fns.slice();

                fns.length = 0;

                let task;
                while ((task = tasks.shift())) {
                    task();
                }

                flushScheduled = false;
            }, 16);
        }
    };
}());

function flushFrame() {
    const fns = rafFns.slice();
    let fn;

    rafFns.length = 0;

    while ((fn = fns.shift())) {
        fn();
    }
}


global.requestAnimationFrame = function(fn) {
    if (autoflush) { return raf(fn); }

    rafFns.push(fn);
};
global.requestAnimationFrame.autoflush = function(value) {
    autoflush = value;
};
global.flushFrame = flushFrame;

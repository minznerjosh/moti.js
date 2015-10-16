import RAFPromise from '../../src/RAFPromise.js';
import prefix from 'prefix';

import {
    select,
    transition,
    many,
    translate,
    set
} from '../../src/moti.js';

describe('(moti.js module)', function() {
    before(function() {
        global.requestAnimationFrame.autoflush(true);
    });

    after(function() {
        global.requestAnimationFrame.autoflush(false);
    });

    describe('select(selector)', function() {
        let success, failure;

        beforeEach(function() {
            success = sinon.stub();
            failure = sinon.stub();
        });

        describe('if an element is provided', function() {
            let element;

            beforeEach(function() {
                element = document.createElement('div');

                select(element).then(success, failure);
                return RAFPromise.resolve();
            });

            it('should fulfill with the element', function() {
                expect(success).to.have.been.calledWith(element);
            });
        });

        describe('if a selector string is provided', function() {
            let selector;
            let element;

            beforeEach(function() {
                selector = '.some-class';

                element = document.createElement('p');
                element.className = 'some-class';
                document.body.appendChild(element);

                select(selector).then(success, failure);
                return RAFPromise.resolve();
            });

            afterEach(function() {
                document.body.removeChild(element);
            });

            it('should fulfill with the element', function() {
                expect(success).to.have.been.calledWith(element);
            });
        });

        describe('if a non-element or string is provided', function() {
            beforeEach(function() {
                select({ foo: 'bar' }).then(success, failure);

                return RAFPromise.resolve();
            });

            it('should reject with an error', function() {
                expect(failure).to.have.been.called;

                const reason = failure.args[0][0];
                expect(reason).to.be.instanceOf(Error);
                expect(reason.message).to.equal('You must pass a selector String or Element to select().');
            });
        });
    });

    describe('transition(prop, value, duration, easing)', function() {
        let prop, value, duration, easing;
        let result;

        beforeEach(function() {
            prop = 'transform';
            value = 'translateX(50px)';
            duration = 3;
            easing = 'ease-in-out';

            result = transition(prop, value, duration, easing);
        });

        it('should return a function', function() {
            expect(result).to.be.instanceOf(Function);
        });

        describe('if used twice on the same element', function() {
            let element;

            beforeEach(function() {
                element = document.createElement('span');

                transition('width', '800px', 3, 'ease-in-out')(element);
                transition('height', '600px', 5, 'ease-out')(element);
                return RAFPromise.resolve();
            });

            it('should combine the transition settings', function() {
                expect(element.style[prefix('transition')]).to.equal(`${prefix('width')} 3s ease-in-out, ${prefix('height')} 5s ease-out`);
            });

            describe('when one animation finishes', function() {
                beforeEach(function() {
                    const event = document.createEvent('CustomEvent');
                    event.initCustomEvent('transitionend', null, null, null);
                    event.propertyName = 'width';

                    element.dispatchEvent(event);
                    return RAFPromise.resolve();
                });

                it('should only remove the transition settings for that animation', function() {
                    expect(element.style[prefix('transition')]).to.equal(`${prefix('height')} 5s ease-out`);
                });
            });
        });

        describe('if called with just a prop and value', function() {
            let element;

            beforeEach(function() {
                element = document.createElement('span');

                transition('width', '10px')(element);
                return RAFPromise.resolve();
            });

            it('should default the duration and easing', function() {
                expect(element.style[prefix('transition')]).to.equal(`${prefix('width')} 1s linear`);
            });
        });

        describe('the returned function', function() {
            let element;
            let success, failure;

            beforeEach(function() {
                element = document.createElement('span');
                success = sinon.stub();
                failure = sinon.stub();

                result(element).then(success, failure);
                return RAFPromise.resolve();
            });

            it('should not fulfill the promise', function() {
                expect(success).not.to.have.been.called;
                expect(failure).not.to.have.been.called;
            });

            it('should set the transition prop', function() {
                expect(element.style[prefix('transition')]).to.equal(`${prefix(prop)} ${duration}s ${easing}`);
            });

            it('should set the prop to the supplied value', function() {
                expect(element.style[prefix(prop)]).to.equal(value);
            });

            ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'otransitionend'].forEach(eventName => {
                describe(`when the element emits ${eventName}`, function() {
                    beforeEach(function() {
                        const event = document.createEvent('CustomEvent');
                        event.initCustomEvent(eventName, null, null, null);
                        event.propertyName = prop;

                        element.dispatchEvent(event);
                        return RAFPromise.resolve();
                    });

                    it('should remove the transition property', function() {
                        expect(element.style[prefix('transition')]).to.equal('');
                    });

                    it('should fulfill the promise with the element', function() {
                        expect(success).to.have.been.calledWith(element);
                    });
                });

                describe(`when the element emits ${eventName} for a different prop`, function() {
                    beforeEach(function() {
                        const event = document.createEvent('CustomEvent');
                        event.initCustomEvent(eventName, null, null, null);
                        event.propertyName = 'other-prop';

                        element.dispatchEvent(event);
                        return RAFPromise.resolve();
                    });

                    it('should not remove the transition property', function() {
                        expect(element.style[prefix('transition')]).not.to.equal('');
                    });

                    it('should not fulfill the promise with the element', function() {
                        expect(success).not.to.have.been.called;
                    });
                });
            });
        });
    });

    describe('many(fns)', function() {
        let fns;
        let resolve1, resolve2;
        let result;

        beforeEach(function() {
            fns = [
                sinon.stub().returns(new RAFPromise(resolve => resolve1 = resolve)),
                sinon.stub().returns(new RAFPromise(resolve => resolve2 = resolve))
            ];

            result = many(fns);
        });

        it('should return a function', function() {
            expect(result).to.be.instanceOf(Function);
        });

        describe('when the returned fn is called', function() {
            let success, failure;
            let element;

            beforeEach(function() {
                success = sinon.stub();
                failure = sinon.stub();
                element = document.createElement('div');

                result(element).then(success, failure);

                return RAFPromise.resolve();
            });

            it('should not resolve the promise', function() {
                expect(success).not.to.have.been.called;
                expect(failure).not.to.have.been.called;
            });

            it('should call each function with the element', function() {
                fns.forEach(fn => expect(fn).to.have.been.calledWith(element));
            });

            describe('when the fns fulfill', function() {
                beforeEach(function() {
                    resolve1(element);
                    resolve2(element);

                    return RAFPromise.resolve().then(function() {}).then(function() {}).then(function() {});
                });

                it('should fulfill with the element', function() {
                    expect(success).to.have.been.calledWith(element);
                });
            });
        });
    });

    describe('translate(x, y, duration, easing)', function() {
        let x, y, duration, easing;
        let result;

        beforeEach(function() {
            x = 100; y = 200; duration = 5; easing = 'ease-in';

            result = translate(x, y, duration, easing);
        });

        it('should return a function', function() {
            expect(result).to.be.instanceOf(Function);
        });

        describe('calling that function', function() {
            let element, expected;

            beforeEach(function() {
                element = document.createElement('div');
                expected = document.createElement('div');

                transition('transform', `translate3d(${x}px, ${y}px, 0)`, duration, easing)(expected);
                result(element);
                return RAFPromise.resolve();
            });

            it('should translate the element', function() {
                expect(element.style).to.eql(expected.style);
            });

            describe('if x and y are Strings', function() {
                beforeEach(function() {
                    element = document.createElement('div');
                    expected = document.createElement('div');
                    x = '200%';
                    y = '-100%';

                    transition('transform', `translate3d(${x}, ${y}, 0`)(expected);
                    translate(x, y)(element);
                    return RAFPromise.resolve();
                });

                it('should translate the element with just the Strings', function() {
                    expect(element.style).to.eql(expected.style);
                });
            });
        });
    });

    describe('set(prop, value)', function() {
        let prop, value;
        let result;

        beforeEach(function() {
            prop = 'transform';
            value = 'skewX(30deg)';

            result = set(prop, value);
        });

        it('should return a Function', function() {
            expect(result).to.be.instanceOf(Function);
        });

        describe('calling the returned Function', function() {
            let success, failure;
            let element;

            beforeEach(function() {
                success = sinon.stub();
                failure = sinon.stub();

                element = document.createElement('div');

                return result(element).then(success, failure);
            });

            it('should set the prop to the value', function() {
                expect(element.style[prefix(prop)]).to.equal(value);
            });

            it('should fulfill with the element', function() {
                expect(success).to.have.been.calledWith(element);
            });
        });
    });
});

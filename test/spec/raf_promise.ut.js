import RAFPromise from '../../src/RAFPromise.js';
import specTests from 'promises-aplus-tests';

const {flushFrame} = global;

describe('RAFPromise', function() {
    it('should exist', function() {
        expect(RAFPromise).to.be.instanceOf(Function);
    });

    it('should throw an error if not passed a function', function() {
        expect(function() {
            new RAFPromise('foo');
        }).to.throw();
    });

    describe('methods:', function() {
        describe('then(onFulfilled, onRejected)', function() {
            let fulfilled, rejected;
            let promise;
            let fulfill, reject;
            let result;

            beforeEach(function() {
                fulfilled = sinon.stub();
                rejected = sinon.stub();

                promise = new RAFPromise((_fulfill, _reject) => {
                    fulfill = _fulfill;
                    reject = _reject;
                });

                result = promise.then(fulfilled, rejected);
            });

            it('should return an RAFPromise', function() {
                expect(result).to.be.an.instanceOf(RAFPromise);
            });

            describe('if no handlers are provided', function() {
                let fulfilled2;
                let rejected2;
                let promise2;

                beforeEach(function() {
                    fulfilled2 = sinon.stub();
                    rejected2 = sinon.stub();

                    promise2 = promise.then();
                    promise2.then(fulfilled2, rejected2);
                });

                describe('when the promise is resolved', function() {
                    let value;

                    beforeEach(function() {
                        value = { name: 'Josh', age: 23 };
                        fulfill(value);
                    });

                    it('should not fulfill the returned promise', function() {
                        expect(fulfilled2).not.to.have.been.called;
                    });

                    describe('in the next animation frame', function() {
                        beforeEach(function() {
                            flushFrame();
                        });

                        it('should fulfill the promise returned by then()', function() {
                            expect(fulfilled2).to.have.been.calledWith(value);
                        });
                    });
                });

                describe('when the promise is rejected', function() {
                    let reason;

                    beforeEach(function() {
                        reason = new Error('Because the world sucks and people don\'t matter.');
                        reject(reason);
                    });

                    it('should not reject the returned promise', function() {
                        expect(rejected2).not.to.have.been.called;
                    });

                    describe('in the next animation frame', function() {
                        beforeEach(function() {
                            flushFrame();
                        });

                        it('should reject the promise returned by then()', function() {
                            expect(rejected2).to.have.been.calledWith(reason);
                        });
                    });
                });
            });

            describe('if the fulfillment handler returns a promise', function() {
                let fulfilled2;
                let rejected2;
                let fulfill2;
                let reject2;
                let promise2;

                beforeEach(function() {
                    promise2 = new RAFPromise((_fulfill2, _reject2) => {
                        fulfill2 = _fulfill2;
                        reject2 = _reject2;
                    });
                    rejected2 = sinon.stub();
                    fulfilled2 = sinon.stub();

                    fulfilled.returns(promise2);
                    result.then(fulfilled2, rejected2);

                    fulfill();
                    flushFrame();
                });

                it('should not resolve the promise returned by then()', function() {
                    expect(fulfilled).to.have.been.calledWith(undefined);
                    expect(fulfilled2).not.to.have.been.called;
                    expect(rejected2).not.to.have.been.called;
                });

                describe('when the promise is fulfilled', function() {
                    let value2;

                    beforeEach(function() {
                        value2 = { data: 'some more data' };
                        fulfill2(value2);
                    });

                    it('should not fulfill the promise', function() {
                        expect(fulfilled2).not.to.have.been.called;
                    });

                    describe('in the next animation frame', function() {
                        beforeEach(function() {
                            flushFrame();
                        });

                        it('should move the parent into a fulfilled state', function() {
                            expect(fulfilled2).to.have.been.calledWith(value2);
                        });
                    });
                });

                describe('when the promise is rejected', function() {
                    let reason;

                    beforeEach(function() {
                        reason = new Error('I failed!');
                        reject2(reason);
                    });

                    it('should not reject the promise', function() {
                        expect(rejected2).not.to.have.been.called;
                    });

                    describe('in the next animation frame', function() {
                        beforeEach(function() {
                            flushFrame();
                        });

                        it('should move the parent into a rejected state', function() {
                            expect(rejected2).to.have.been.calledWith(reason);
                        });
                    });
                });
            });

            describe('if the rejection handler returns a promise', function() {
                let fulfilled2;
                let rejected2;
                let fulfill2;
                let reject2;
                let promise2;

                beforeEach(function() {
                    promise2 = new RAFPromise((_fulfill2, _reject2) => {
                        fulfill2 = _fulfill2;
                        reject2 = _reject2;
                    });
                    rejected2 = sinon.stub();
                    fulfilled2 = sinon.stub();

                    rejected.returns(promise2);
                    result.then(fulfilled2, rejected2);

                    reject();
                    flushFrame();
                });

                it('should not resolve the promise returned by then()', function() {
                    expect(rejected).to.have.been.calledWith(undefined);
                    expect(fulfilled2).not.to.have.been.called;
                    expect(rejected2).not.to.have.been.called;
                });

                describe('when the promise is fulfilled', function() {
                    let value2;

                    beforeEach(function() {
                        value2 = { data: 'some more data' };
                        fulfill2(value2);
                    });

                    it('should not fulfill the promise', function() {
                        expect(fulfilled2).not.to.have.been.called;
                    });

                    describe('in the next animation frame', function() {
                        beforeEach(function() {
                            flushFrame();
                        });

                        it('should move the parent into a fulfilled state', function() {
                            expect(fulfilled2).to.have.been.calledWith(value2);
                        });
                    });
                });

                describe('when the promise is rejected', function() {
                    let reason;

                    beforeEach(function() {
                        reason = new Error('I failed!');
                        reject2(reason);
                    });

                    it('should not reject the promise', function() {
                        expect(rejected2).not.to.have.been.called;
                    });

                    describe('in the next animation frame', function() {
                        beforeEach(function() {
                            flushFrame();
                        });

                        it('should move the parent into a rejected state', function() {
                            expect(rejected2).to.have.been.calledWith(reason);
                        });
                    });
                });
            });

            describe('if the fulfillment handler returns a non-promise', function() {
                let fulfilled2;
                let value;

                beforeEach(function() {
                    value = 42;
                    fulfilled2 = sinon.stub();

                    fulfilled.returns(value);
                    result.then(fulfilled2);

                    fulfill();
                });

                it('should not call back with the value', function() {
                    expect(fulfilled2).not.to.have.been.called;
                });

                describe('in the next raf', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should fulfill with the value', function() {
                        expect(fulfilled2).to.have.been.calledWith(value);
                    });
                });
            });

            describe('if the rejection handler returns a non-promise', function() {
                let fulfilled2;
                let value;

                beforeEach(function() {
                    value = 42;
                    fulfilled2 = sinon.stub();

                    rejected.returns(value);
                    result.then(fulfilled2);

                    reject();
                });

                it('should not call back with the value', function() {
                    expect(fulfilled2).not.to.have.been.called;
                });

                describe('in the next raf', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should fulfill with the value', function() {
                        expect(fulfilled2).to.have.been.calledWith(value);
                    });
                });
            });

            describe('if the fulfillment handler throws an error', function() {
                let rejected2;
                let error;

                beforeEach(function() {
                    error = new SyntaxError('I can\'t type.');
                    rejected2 = sinon.stub();

                    fulfilled.throws(error);
                    result.then(null, rejected2);

                    fulfill();
                });

                it('should not call the rejection handler', function() {
                    expect(rejected2).not.to.have.been.called;
                });

                describe('in the next raf', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should fulfill with the value', function() {
                        expect(rejected2).to.have.been.calledWith(error);
                    });
                });
            });

            describe('if the rejection handler throws an error', function() {
                let rejected2;
                let error;

                beforeEach(function() {
                    error = new SyntaxError('I can\'t type.');
                    rejected2 = sinon.stub();

                    rejected.throws(error);
                    result.then(null, rejected2);

                    reject();
                });

                it('should not call the rejection handler', function() {
                    expect(rejected2).not.to.have.been.called;
                });

                describe('in the next raf', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should fulfill with the value', function() {
                        expect(rejected2).to.have.been.calledWith(error);
                    });
                });
            });

            describe('when the promise is fulfilled', function() {
                let value;

                beforeEach(function() {
                    value = { data: 'my data' };
                    fulfill(value);
                });

                it('should not call the fulfillment handler', function() {
                    expect(fulfilled).not.to.have.been.called;
                });

                describe('in the next animation frame', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should call the handler with the value', function() {
                        expect(fulfilled).to.have.been.calledWith(value);
                    });

                    describe('if another handler is added', function() {
                        let fulfilled2;
                        let result;

                        beforeEach(function() {
                            fulfilled2 = sinon.stub();

                            result = promise.then(fulfilled2);
                        });

                        it('should not call the handler', function() {
                            expect(fulfilled2).not.to.have.been.called;
                        });

                        describe('in the next animation frame', function() {
                            let value2;
                            let fulfilled3;

                            beforeEach(function() {
                                value2 = { name: 'Josh' };
                                fulfilled2.returns(value2);

                                fulfilled3 = sinon.stub();
                                result.then(fulfilled3);

                                flushFrame();
                            });

                            it('should call the new handler', function() {
                                expect(fulfilled2).to.have.been.calledWith(value);
                            });

                            it('should resolve the returned promise based on the return value of the handler', function() {
                                expect(fulfilled3).to.have.been.calledWith(value2);
                            });
                        });
                    });
                });
            });

            describe('when the promise is rejected', function() {
                let reason;

                beforeEach(function() {
                    reason = new Error('I have failed you, master.');
                    reject(reason);
                });

                it('should not call the rejection handler', function() {
                    expect(rejected).not.to.have.been.called;
                });

                describe('in the next animation frame', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should call the handler with the reason', function() {
                        expect(rejected).to.have.been.calledWith(reason);
                    });

                    describe('if another handler is added', function() {
                        let rejected2;
                        let result;

                        beforeEach(function() {
                            rejected2 = sinon.stub();

                            result = promise.then(null, rejected2);
                        });

                        it('should not call the handler', function() {
                            expect(rejected2).not.to.have.been.called;
                        });

                        describe('in the next animation frame', function() {
                            let fulfilled3;
                            let value2;

                            beforeEach(function() {
                                value2 = { data: 'Minzner' };
                                rejected2.returns(value2);

                                fulfilled3 = sinon.stub();
                                result.then(fulfilled3);

                                flushFrame();
                            });

                            it('should call the new handler', function() {
                                expect(rejected2).to.have.been.calledWith(reason);
                            });

                            it('should resolve the returned promise based on the return value of the handler', function() {
                                expect(fulfilled3).to.have.been.calledWith(value2);
                            });
                        });
                    });
                });
            });

            describe('when the promise is resolved with another promise', function() {
                let otherPromise;
                let otherResolve, otherReject;

                beforeEach(function() {
                    otherResolve = sinon.stub();
                    otherReject = sinon.stub();
                    otherPromise = new RAFPromise((resolve, reject) => {
                        otherResolve = resolve;
                        otherReject = reject;
                    });

                    fulfill(otherPromise);
                });

                describe('if the other promise is fulfilled', function() {
                    let data;

                    beforeEach(function() {
                        data = { data: 'data' };

                        otherResolve(data);
                        flushFrame();
                    });

                    it('should fulfill the promise', function() {
                        expect(fulfilled).to.have.been.calledWith(data);
                    });
                });

                describe('if the other promise is rejected', function() {
                    let error;

                    beforeEach(function() {
                        error = new Error('Everything is awful.');

                        otherReject(error);
                        flushFrame();
                    });

                    it('should reject the promise', function() {
                        expect(rejected).to.have.been.calledWith(error);
                    });
                });
            });
        });

        describe('catch(onRejection)', function() {
            let promise;
            let result;
            let onRejection;

            beforeEach(function() {
                promise = new RAFPromise(() => {});
                onRejection = sinon.stub();
                sinon.spy(promise, 'then');

                result = promise.catch(onRejection);
            });

            it('should call then(null, onRejection)', function() {
                expect(promise.then).to.have.been.calledWith(null, onRejection);
            });

            it('should return the promise returned by then()', function() {
                expect(result).to.equal(promise.then.returnValues[0]);
            });
        });

        describe('finally(handler)', function() {
            let promise;
            let handler;
            let resolve, reject;
            let success, failure;
            let value, reason;
            let finallyPromise;
            let resolveFinally, rejectFinally;

            beforeEach(function() {
                promise = new RAFPromise((_resolve_, _reject_) => {
                    resolve = _resolve_;
                    reject = _reject_;
                });

                handler = sinon.stub();
                success = sinon.stub();
                failure = sinon.stub();

                value = { value: 3 };
                reason = new Error('I failed you!');

                finallyPromise = new RAFPromise((_resolve_, _reject_) => {
                    resolveFinally = _resolve_;
                    rejectFinally = _reject_;
                });
                handler.returns(finallyPromise);

                promise.finally(handler).then(success, failure);
            });

            describe('if the handler returns a non-promise', function() {
                let number;

                beforeEach(function() {
                    number = 42;
                    handler.returns(number);
                });

                describe('and the promise is fulfilled', function() {
                    beforeEach(function() {
                        resolve(value);
                        flushFrame();
                    });

                    it('should call the handler', function() {
                        expect(handler).to.have.been.calledWith();
                    });

                    it('should fulfill the promise with the original value', function() {
                        expect(success).to.have.been.calledWith(value);
                    });
                });

                describe('and the promise is rejected', function() {
                    beforeEach(function() {
                        reject(reason);
                        flushFrame();
                    });

                    it('should call the handler', function() {
                        expect(handler).to.have.been.calledWith();
                    });

                    it('should reject the promise with the original reason', function() {
                        expect(failure.lastCall.args[0]).to.equal(reason);
                    });
                });
            });

            describe('if the promise is fulfilled', function() {
                beforeEach(function() {
                    resolve(value);
                });

                it('should do nothing', function() {
                    expect(handler).not.to.have.been.called;
                });

                describe('in the next RAF', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should call the handler with no args', function() {
                        expect(handler).to.have.been.calledWith();
                    });

                    describe('when the handler fulfills', function() {
                        beforeEach(function() {
                            resolveFinally({ foo: 'bar' });
                        });

                        it('should do nothing', function() {
                            expect(success).not.to.have.been.called;
                        });

                        describe('in the next RAF', function() {
                            beforeEach(function() {
                                flushFrame();
                            });

                            it('should fulfill the promise with the original value', function() {
                                expect(success).to.have.been.calledWith(value);
                            });
                        });
                    });

                    describe('when the handler rejects', function() {
                        beforeEach(function() {
                            rejectFinally(reason);
                        });

                        it('should do nothing', function() {
                            expect(failure).not.to.have.been.called;
                        });

                        describe('in the next RAF', function() {
                            beforeEach(function() {
                                flushFrame();
                            });

                            it('should reject the promise', function() {
                                expect(failure).to.have.been.calledWith(reason);
                            });
                        });
                    });
                });
            });

            describe('if the promise is rejected', function() {
                beforeEach(function() {
                    reject(reason);
                });

                it('should do nothing', function() {
                    expect(handler).not.to.have.been.called;
                });

                describe('in the next RAF', function() {
                    beforeEach(function() {
                        flushFrame();
                    });

                    it('should call the handler with no args', function() {
                        expect(handler).to.have.been.calledWith();
                    });

                    describe('when the handler fulfills', function() {
                        beforeEach(function() {
                            resolveFinally({ foo: 'bar' });
                        });

                        it('should do nothing', function() {
                            expect(failure).not.to.have.been.called;
                        });

                        describe('in the next RAF', function() {
                            beforeEach(function() {
                                flushFrame();
                            });

                            it('should reject the promise with the original reason', function() {
                                expect(failure).to.have.been.calledWith(reason);
                            });
                        });
                    });

                    describe('when the handler rejects', function() {
                        let differentReason;

                        beforeEach(function() {
                            differentReason = new Error('I\'m really messing up here!');

                            rejectFinally(differentReason);
                        });

                        it('should do nothing', function() {
                            expect(failure).not.to.have.been.called;
                        });

                        describe('in the next RAF', function() {
                            beforeEach(function() {
                                flushFrame();
                            });

                            it('should reject the promise with the new reason', function() {
                                expect(failure).to.have.been.calledWith(differentReason);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('class methods', function() {
        describe('resolve(data)', function() {
            let data;
            let result;
            let success, failure;

            beforeEach(function() {
                data = { foo: 'bar' };
                result = RAFPromise.resolve(data);

                success = sinon.stub();
                failure = sinon.stub();

                result.then(success, failure);
                flushFrame();
            });

            it('should return a promise that resolves with the provided data', function() {
                expect(success).to.have.been.calledWith(data);
            });
        });

        describe('reject(reason)', function() {
            let reason;
            let result;
            let success, failure;

            beforeEach(function() {
                reason = new Error('I am awful.');
                result = RAFPromise.reject(reason);

                success = sinon.stub();
                failure = sinon.stub();

                result.then(success, failure);
                flushFrame();
            });

            it('should return a promise that rejects with the provided reason', function() {
                expect(failure).to.have.been.calledWith(reason);
            });
        });

        describe('all(promises)', function() {
            let deferreds, promises;
            let success, failure;
            let result;

            function defer() {
                const deferred = {};

                deferred.promise = new RAFPromise((resolve, reject) => {
                    deferred.resolve = resolve;
                    deferred.reject = reject;
                });

                return deferred;
            }

            beforeEach(function() {
                deferreds = [defer(), defer(), defer()];
                promises = deferreds.map(deferred => deferred.promise);

                success = sinon.stub();
                failure = sinon.stub();

                result = RAFPromise.all(promises);

                result.then(success, failure);
            });

            it('should return an RAFPromise', function() {
                expect(result).to.be.instanceOf(RAFPromise);
            });

            describe('if called with an empty array', function() {
                beforeEach(function() {
                    result = RAFPromise.all([]);

                    result.then(success, failure);
                    flushFrame();
                });

                it('should fulfill with an empty array', function() {
                    expect(success).to.have.been.calledWith([]);
                });
            });

            describe('if called with non-promises', function() {
                let values;

                beforeEach(function() {
                    values = [{ name: 'Josh' }, { name: 'Scott' }, { name: 'Evan' }];
                    result = RAFPromise.all(values);

                    result.then(success, failure);
                    flushFrame();
                });

                it('should fulfill with those values', function() {
                    expect(success).to.have.been.calledWith(values);
                });
            });

            describe('if not all of the promises are fulfilled', function() {
                beforeEach(function() {
                    deferreds[0].resolve({ hello: 'world' });
                    flushFrame();

                    deferreds[2].resolve({ hello: 'world' });
                    flushFrame();
                });

                it('should not fulfill the promise', function() {
                    expect(success).not.to.have.been.called;
                });
            });

            describe('if one promise rejects', function() {
                let reason;

                beforeEach(function() {
                    reason = new Error('I suck...');

                    deferreds[2].resolve({ foo: 'bar' });
                    flushFrame();

                    deferreds[1].reject(reason);
                    flushFrame();
                });

                it('should reject the promise with the reason', function() {
                    expect(failure).to.have.been.calledWith(reason);
                });
            });

            describe('if all of the promises fulfill', function() {
                let values;

                beforeEach(function() {
                    values = [{ name: 'Josh' }, { name: 'Scott' }, { name: 'Evan' }];

                    deferreds[1].resolve(values[1]);
                    flushFrame();

                    deferreds[0].resolve(values[0]);
                    flushFrame();

                    deferreds[2].resolve(values[2]);
                    flushFrame();
                });

                it('should fulfill the promise with an array of values', function() {
                    expect(success).to.have.been.calledWith(values);
                });
            });
        });
    });

    describe('Promises/A+ Tests', function() {
        before(function() {
            global.requestAnimationFrame.autoflush(true);
        });

        after(function() {
            global.requestAnimationFrame.autoflush(false);
        });

        specTests.mocha({
            deferred() {
                let deferred = {};

                deferred.promise = new RAFPromise((fulfill, reject) => {
                    deferred.resolve = fulfill;
                    deferred.reject  = reject;
                });

                return deferred;
            }
        });
    });
});

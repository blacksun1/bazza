'use strict';

// Imports
const Code = require('code');
const Lab = require('lab');
const Sut = require('../src/index');
const TestClasses = require('./artifacts/test-classes');
const LoggerFactory = require('blacksun1-chalk-logger').loggerFactory;
const Assert = require('assert');


// Test helpers
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


// Internals
const internals = {};

internals.stringifyWithFunctionName = function stringifyWithFunctionName(key, value) {

    if (typeof value === 'function') {

        return `function ${value.name}()`;
    }

    return value;
};

internals.stringify = function stringify(value) {

    return JSON.stringify(value, internals.stringifyWithFunctionName, 2);
};

internals.logger = LoggerFactory();

internals.log = function log(message) {

    Assert(message, 'message must be defined');
    Assert(message.message, 'message.message must be defined');

    let data = '';
    if (typeof message.data !== 'undefined') {
        data = '\n' + internals.stringify(message.data);
    }
    const msg = message.message + data;

    if (message.tags) {
        if (message.tags.some((x) => x === 'fatal')) {
            return internals.logger.fatal(msg);
        }

        if (message.tags.some((x) => x === 'error')) {
            return internals.logger.error(msg);
        }

        if (message.tags.some((x) => x === 'warn')) {
            return internals.logger.warn(msg);
        }

        if (message.tags.some((x) => x === 'info')) {
            return internals.logger.info(msg);
        }

        if (message.tags.some((x) => x === 'debug')) {
            return internals.logger.debug(msg);
        }

        if (message.tags.some((x) => x === 'trace')) {
            return internals.logger.trace(msg);
        }
    }

    return internals.logger.log(msg);
};

internals.sutFactory = function sutFactory() {

    const sut = new Sut();
    sut.on('log', internals.log);

    return sut;
};


// Tests
describe('Bazza', () => {

    it('should export a function', (done) => {

        // Assert
        expect(Sut).to.be.a.function();

        return done();
    });

    it('should throw an error', (done) => {

        // Act
        const act = () => Sut();

        // Assert
        expect(act).to.throw(Error, /Class constructors cannot be invoked without 'new'/);

        return done();
    });

    // Constructor tests
    it('should allow constrution with valid arguments', (done) => {

        // Act
        const act = () => internals.sutFactory();

        // Assert
        expect(act).to.not.throw();
        expect(act()).to.be.an.instanceOf(Sut);

        return done();
    });


    // get tests
    it('get should expose a get method', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Assert
        expect(sut.get).to.be.a.function();

        return done();
    });

    it('get should support retrieving the container', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Act
        const actual = sut.get('container');

        // Assert
        expect(actual).to.be.an.instanceOf(Sut).and.shallow.equal(sut);

        return done();
    });

    it('get should return undefined for a non existing object', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Act
        const actual = sut.get('foo');

        // Assert
        expect(actual).to.be.undefined();

        return done();
    });

    it('get should return the object for an existing object', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = 'bar';
        sut.register('foo', foo);

        // Act
        const actual = sut.get('foo');

        // Assert
        expect(actual).to.not.be.undefined().and.to.shallow.equal(foo);

        return done();
    });

    it('get should return a new instance of a class', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('SimpleTestClass', TestClasses.SimpleTestClass);

        // Act
        const actual = sut.get('SimpleTestClass');

        // Assert
        expect(actual).to.not.be.undefined();
        expect(actual).to.not.shallow.equal(TestClasses.SimpleTestClass);
        expect(actual).to.be.an.instanceOf(TestClasses.SimpleTestClass);

        return done();
    });

    it('get should return a new instance of a class with injected arguments', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('TestClass', TestClasses.TestClass);
        sut.register('foo', 'food');

        // Act
        const actual = sut.get('TestClass');

        // Assert
        expect(actual).to.not.be.undefined();
        expect(actual).to.not.shallow.equal(TestClasses.TestClass);
        expect(actual).to.be.an.instanceOf(TestClasses.TestClass);
        expect(actual).to.include({ foo: 'food' });

        return done();
    });

    it('get should throw if a registration with a circular dependency is found', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('foo', TestClasses.TestClass);

        // Act
        const act = () => sut.get('foo');

        // Assert
        expect(act).to.throw(Error, /Circular dependency error in registration foo/);

        return done();
    });

    it('get should throw if a missing $inject value is found', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('TestClass', TestClasses.TestClass);

        // Act
        const act = () => sut.get('TestClass');

        // Assert
        expect(act).to.throw(Error, /Missing registration of foo/);

        return done();
    });

    it('get should not throw if a missing $inject value is found that is suffixed with ? Value should be injected with null', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        sut.register('TestClass', TestClasses.TestClass);
        sut.register('foo', 'foo');

        // Act
        const act = () => sut.get('TestClass');

        // Assert
        expect(act).to.not.throw();
        const actual = act();
        expect(actual).to.not.be.undefined().and.be.an.instanceOf(TestClasses.TestClass);
        expect(actual).to.include({ foo: 'foo', bar: null, extra: undefined });

        return done();
    });

    it('get should allow sending extra arguments to a service', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('TestClass', TestClasses.TestClass);
        sut.register('foo', 'foo');

        // Act
        const actual = sut.get('TestClass', 'extra');

        // Assert
        expect(actual).to.not.be.undefined().and.be.an.instanceOf(TestClasses.TestClass);
        expect(actual).to.include({ foo: 'foo', bar: null, extra: undefined });

        return done();
    });

    it('get should allow the construction of an array with values and services', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('foo[]', TestClasses.SimpleTestClass);
        sut.register('foo[]', 'Food');
        sut.register('foo[]', TestClasses.SimpleTestClass2);

        // Act
        const actual = sut.get('foo[]');

        // Assert
        expect(actual).to.not.be.undefined().and.be.an.array().and.have.a.length(3);
        expect(actual[0]).to.not.be.undefined().and.be.an.instanceOf(TestClasses.SimpleTestClass);
        expect(actual[1]).to.not.be.undefined().and.equal('Food');
        expect(actual[2]).to.not.be.undefined().and.be.an.instanceOf(TestClasses.SimpleTestClass2);

        return done();
    });

    it('get should allow the construction of an object as the value in an array', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('TestClassThatTakesArray', TestClasses.TestClassThatTakesArray);
        sut.register('foo[]', TestClasses.SimpleTestClass);
        sut.register('foo[]', TestClasses.SimpleTestClass2);
        sut.register('foo[]', 'Food');

        // Act
        const actual = sut.get('TestClassThatTakesArray');

        // Assert
        expect(actual).to.not.be.undefined().and.be.an.instanceOf(TestClasses.TestClassThatTakesArray);
        expect(actual.foo).to.not.be.undefined().be.an.array().and.have.a.length(3);
        expect(actual.foo[0]).to.not.be.undefined().and.be.an.instanceOf(TestClasses.SimpleTestClass);
        expect(actual.foo[1]).to.not.be.undefined().and.be.an.instanceOf(TestClasses.SimpleTestClass2);
        expect(actual.foo[2]).to.not.be.undefined().and.equal('Food');

        return done();
    });


    // dispose tests
    it.skip('should expose a dispose method', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Assert
        expect(sut.register).to.be.a.function();

        return done();
    });


    // register tests
    it('should expose a register method', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Assert
        expect(sut.register).to.be.a.function();

        return done();
    });

    it('register should take a name and an object', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Act
        const act = () => sut.register('foo', 'bar');

        // Assert
        expect(act).to.not.throw();

        return done();
    });

    it('should throw if registering with a name of container', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Act
        const act = () => sut.register('container', 'test');

        // Assert
        expect(act).to.throw(Error, /Name container is special and can\'t be redefined/);

        return done();
    });

    it('should throw error if invalid name is registered', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const invalidNames = [
            '1abc23', 'abc$', 'abc@', 'abc!', 'abc?', 'abc&', 'abc^', 'abc%',
            'abc(', 'abc)', 'abc{', 'abc}', 'abc;', 'abc:'
        ];

        // Act
        const act = (assertion) => sut.register(assertion, 'test');

        // Assert
        for (const assertion of invalidNames) {
            expect(act.bind(this, assertion), `assertion of ${assertion} failed`)
                .to.throw(Error, /Name must start with a letter and can only include letters, numbers, underscores \(_\), hyphens \(-\) or periods \(\.\)\. Optional services can be suffixed with a \?/);
        }

        return done();
    });

    it('register should overwrite an existing registration if name is registered again without suffix []', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = 'bar';
        const baz = 'food';

        sut.register('foo', foo);
        sut.register('foo', baz);

        // Act
        const actual = sut.get('foo');

        // Assert
        expect(actual).to.not.be.undefined().and.to.shallow.equal(baz);

        return done();
    });

    it('register should register an array item when the name is suffixed with [] which will return an array of items rather than the single item', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = 'bar';

        sut.register('foo[]', foo);

        // Act
        const actual = sut.get('foo[]');

        // Assert
        expect(actual).to.not.be.undefined().be.an.array().and.to.only.include(foo);

        return done();
    });

    it('register should register pushs to it\'s array any new items with the same name when the name is suffixed with []', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = 'bar';
        const baz = 'food';

        sut.register('foo[]', foo);
        sut.register('foo[]', baz);

        // Act
        const actual = sut.get('foo[]');

        // Assert
        expect(actual).to.not.be.undefined().and.be.an.array().and.to.only.include([foo, baz]);

        return done();
    });

    it('register should de-register an existing non-array registration when registering a new array entry', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = 'bar';

        sut.register('foo', foo);
        sut.register('foo[]', foo);

        // Act
        const actualVar = sut.get('foo');
        const actualArray = sut.get('foo[]');

        // Assert
        expect(actualVar).to.be.undefined();
        expect(actualArray).to.not.be.undefined().and.be.an.array().and.to.only.include(foo);

        return done();
    });

    it('register should de-register an existing array item when registering a new non-array entry', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('foo[]', 'bar');
        sut.register('foo', 'bar');

        // Act
        const actualArray = sut.get('foo[]');
        const actualVar = sut.get('foo');

        // Assert
        expect(actualArray, 'actualArray').to.be.undefined();
        expect(actualVar, 'actualVar').to.not.be.undefined().and.be.an.string().and.to.equal('bar');

        return done();
    });
});

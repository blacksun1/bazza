'use strict';

// Imports
const Assert = require('assert');
const Code = require('code');
const Lab = require('lab');
const Sut = require('../src/index');


// Test helpers
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


// Internals
const internals = {};

internals.sutFactory = function sutFactory() {

    return new Sut();
};

internals.TestClass = class TestClass {

    constructor(foo, bar, extra) {

        Assert(foo, 'bar is a required argument');
        Assert(typeof bar !== 'undefined', 'bar can not be undefined');
        this.foo = foo;
        this.bar = bar;
        this.extra = extra;
    }

    static get $inject() {

        return ['foo', 'bar?'];
    }
};

internals.SimpleTestClass = class SimpleTestClass {

    constructor() {
    }
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
        sut.register('SimpleTestClass', internals.SimpleTestClass);

        // Act
        const actual = sut.get('SimpleTestClass');

        // Assert
        expect(actual).to.not.be.undefined();
        expect(actual).to.not.shallow.equal(internals.SimpleTestClass);
        expect(actual).to.be.an.instanceOf(internals.SimpleTestClass);

        return done();
    });

    it('get should return a new instance of a class with injected arguments', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = 'food';

        sut.register('TestClass', internals.TestClass);
        sut.register('foo', foo);

        // Act
        const actual = sut.get('TestClass');

        // Assert
        expect(actual).to.not.be.undefined();
        expect(actual).to.not.shallow.equal(internals.TestClass);
        expect(actual).to.be.an.instanceOf(internals.TestClass);
        expect(actual).to.include({ foo });

        return done();
    });

    it('get should throw if a registration with a circular dependency is found', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('foo', internals.TestClass);

        // Act
        const act = () => sut.get('foo');

        // Assert
        expect(act).to.throw(Error, /Circular dependency error in registration foo/);

        return done();
    });

    it('get should throw if a missing $inject value is found', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('TestClass', internals.TestClass);

        // Act
        const act = () => sut.get('TestClass');

        // Assert
        expect(act).to.throw(Error, /Missing registration of foo/);

        return done();
    });

    it('get should not throw if a missing $inject value is found that is suffixed with ? Value should be injected with null', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        sut.register('TestClass', internals.TestClass);
        sut.register('foo', 'foo');

        // Act
        const act = () => sut.get('TestClass');

        // Assert
        expect(act).to.not.throw();
        const actual = act();
        expect(actual).to.not.be.undefined().and.be.an.instanceOf(internals.TestClass);
        expect(actual).to.include({ foo: 'foo', bar: null, extra: undefined });

        return done();
    });

    it('get should allow sending extra arguments to a service', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        sut.register('TestClass', internals.TestClass);
        sut.register('foo', 'foo');

        // Act
        const actual = sut.get('TestClass', 'extra');

        // Assert
        expect(actual).to.be.instanceOf(internals.TestClass);
        expect(actual).to.not.be.undefined().and.be.an.instanceOf(internals.TestClass);
        expect(actual).to.include({ foo: 'foo', bar: null, extra: undefined });

        return done();
    });


    // dispose tests
    it('should expose a dispose method', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        // Assert
        expect(sut.register).to.be.a.function();

        return done();
    });

    it('dispose should emit a preDispose method', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        const act = () => sut.dispose();

        // Assert
        sut.on('preDispose', done);
        act();
    });

    it('dispose should emit a postDispose method', (done) => {

        // Arrange
        const sut = internals.sutFactory();

        const act = () => sut.dispose();

        // Assert
        sut.on('postDispose', done);
        act();
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
        expect(act).to.throw(Error, 'Name container is special and can\'t be redefined');

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
                .to.throw(Error, 'Name must start with a letter and can only include letters, numbers, underscore (_) and hyphens (-)');
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
        const foo = 'bar';

        sut.register('foo[]', foo);
        sut.register('foo', foo);

        // Act
        const actualArray = sut.get('foo[]');
        const actualVar = sut.get('foo');

        // Assert
        expect(actualArray, 'actualArray').to.be.undefined();
        expect(actualVar, 'actualVar').to.not.be.undefined().and.be.an.string().and.to.equal(foo);

        return done();
    });
});

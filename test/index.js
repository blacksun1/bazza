'use strict';

// Imports
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

internals.mockLoggerFactory = function mockLoggerFactory() {

    return {};
};

internals.sutFactory = function sutFactory() {

    const logger = internals.mockLoggerFactory;

    return new Sut(logger);
};


// Tests
describe('Bazza', () => {

    it('should export a function', (done) => {

        expect(Sut).to.be.a.function();

        return done();
    });

    it('should throw an error', (done) => {

        const act = () => Sut();

        expect(act).to.throw(Error, /Class constructors cannot be invoked without 'new'/);

        return done();
    });

    it('should assert for missing constructor arguments', (done) => {

        const act = () => new Sut();

        expect(act).to.throw(Error, /Logger is a required argument/);

        return done();
    });

    // Constructor tests
    it('should allow constrution with valid arguments', (done) => {

        const act = () => internals.sutFactory();

        expect(act).to.not.throw();
        expect(act()).to.be.an.instanceOf(Sut);

        return done();
    });


    // get tests
    it('get should expose a get method', (done) => {

        const sut = internals.sutFactory();

        expect(sut.get).to.be.a.function();

        return done();
    });

    it('get should support retrieving the container', (done) => {

        const sut = internals.sutFactory();

        const actual = sut.get('container');

        expect(actual).to.be.an.instanceOf(Sut).and.shallow.equal(sut);

        return done();
    });

    it('get should return undefined for a non existing object', (done) => {

        const sut = internals.sutFactory();

        const actual = sut.get('foo');

        expect(actual).to.be.undefined();

        return done();
    });

    it('get should return the object for an existing object', (done) => {

        const sut = internals.sutFactory();
        const foo = 'bar';
        sut.register('foo', foo);

        const actual = sut.get('foo');

        expect(actual).to.not.be.undefined().and.to.shallow.equal(foo);

        return done();
    });

    it('get should return a new instance of a class', (done) => {

        const sut = internals.sutFactory();
        const foo = class {

        };
        sut.register('foo', foo);

        const actual = sut.get('foo');

        expect(actual).to.not.be.undefined();
        expect(actual).to.not.shallow.equal(foo);
        expect(actual).to.be.an.instanceOf(foo);

        return done();
    });

    it('get should return a new instance of a class with injected arguments', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = class {
            constructor(bar) {

                this.bar = bar;
            }
            static get $inject() {

                return ['bar'];
            }
        };
        const bar = 'food';

        sut.register('foo', foo);
        sut.register('bar', bar);

        // Act
        const actual = sut.get('foo');

        // Assert
        expect(actual).to.not.be.undefined();
        expect(actual).to.not.shallow.equal(foo);
        expect(actual).to.be.an.instanceOf(foo);
        expect(actual).to.include({ bar });

        return done();
    });

    it('get should throw if a registration with a circular dependency is found', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = class {
            constructor(bar) {

                this.bar = bar;
            }
            static get $inject() {

                return ['foo'];
            }
        };

        sut.register('foo', foo);

        // Act
        const act = () => sut.get('foo');

        // Assert
        expect(act).to.throw(Error, /Circular dependency error in registration foo/);

        return done();
    });

    it('get should throw if a missing $inject value is found', (done) => {

        // Arrange
        const sut = internals.sutFactory();
        const foo = class {
            constructor(bar) {

                this.bar = bar;
            }
            static get $inject() {

                return ['bar'];
            }
        };

        sut.register('foo', foo);

        // Act
        const act = () => sut.get('foo');

        // Assert
        expect(act).to.throw(Error, /Missing registration of foo/);

        return done();
    });


    // register tests
    it('should expose a register method', (done) => {

        const sut = internals.sutFactory();

        expect(sut.register).to.be.a.function();

        return done();
    });

    it('register should take a name and an object', (done) => {

        const sut = internals.sutFactory();

        const act = () => sut.register('foo', 'bar');

        expect(act).to.not.throw();

        return done();
    });

    it('should throw if registering with a name of container', (done) => {

        const sut = internals.sutFactory();

        const act = () => sut.register('container', 'test');

        expect(act).to.throw(Error, 'Name container is special and can\'t be redefined');

        return done();
    });

    it('should throw error if invalid name is registered', (done) => {

        const sut = internals.sutFactory();
        const invalidNames = [
            '1abc23', 'abc$', 'abc@', 'abc!', 'abc?', 'abc&', 'abc^', 'abc%',
            'abc(', 'abc)', 'abc{', 'abc}', 'abc;', 'abc:'
        ];

        const act = (assertion) => sut.register(assertion, 'test');

        for (const assertion of invalidNames) {
            expect(act.bind(this, assertion), `assertion of ${assertion} failed`)
                .to.throw(Error, 'Name must start with a letter and can only include letters, numbers, underscore (_) and hyphens (-)');
        }

        return done();
    });

    it('register should overwrite an existing registration if name is registered again without suffix []', (done) => {

        const sut = internals.sutFactory();
        const foo = 'bar';
        const baz = 'food';

        sut.register('foo', foo);
        sut.register('foo', baz);

        const actual = sut.get('foo');

        expect(actual).to.not.be.undefined().and.to.shallow.equal(baz);

        return done();
    });

    it('register should register an array item when the name is suffixed with [] which will return an array of items rather than the single item', (done) => {

        const sut = internals.sutFactory();
        const foo = 'bar';

        sut.register('foo[]', foo);

        const actual = sut.get('foo[]');

        expect(actual).to.not.be.undefined().be.an.array().and.to.only.include(foo);

        return done();
    });

    it('register should register pushs to it\'s array any new items with the same name when the name is suffixed with []', (done) => {

        const sut = internals.sutFactory();
        const foo = 'bar';
        const baz = 'food';

        sut.register('foo[]', foo);
        sut.register('foo[]', baz);

        const actual = sut.get('foo[]');

        expect(actual).to.not.be.undefined().and.be.an.array().and.to.only.include([foo, baz]);

        return done();
    });

    it('register should de-register an existing non-array registration when registering a new array entry', (done) => {

        const sut = internals.sutFactory();
        const foo = 'bar';

        sut.register('foo', foo);
        sut.register('foo[]', foo);

        const actualVar = sut.get('foo');
        const actualArray = sut.get('foo[]');

        expect(actualVar).to.be.undefined();
        expect(actualArray).to.not.be.undefined().and.be.an.array().and.to.only.include(foo);

        return done();
    });

    it('register should de-register an existing array item when registering a new non-array entry', (done) => {

        const sut = internals.sutFactory();
        const foo = 'bar';

        sut.register('foo[]', foo);
        sut.register('foo', foo);

        const actualArray = sut.get('foo[]');
        const actualVar = sut.get('foo');

        expect(actualArray, 'actualArray').to.be.undefined();
        expect(actualVar, 'actualVar').to.not.be.undefined().and.be.an.string().and.to.equal(foo);

        return done();
    });
});

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
describe('Start testing', () => {

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
    it('should expose a get method', (done) => {

        const sut = internals.sutFactory();

        expect(sut.get).to.be.a.function();

        return done();
    });

    it('should support retrieving the container', (done) => {

        const sut = internals.sutFactory();

        const actual = sut.get('container');

        expect(actual).to.be.an.instanceOf(Sut).and.shallow.equal(sut);

        return done();
    });

    it('register should return undefined for a non existing object', (done) => {

        const sut = internals.sutFactory();

        const actual = sut.get('foo');

        expect(actual).to.be.undefined();

        return done();
    });

    it('register should return the object for an existing object', (done) => {

        const sut = internals.sutFactory();
        const foo = 'bar';
        sut.register('foo', foo);

        const actual = sut.get('foo');

        expect(actual).to.not.be.undefined().and.to.shallow.equal(foo);

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
        const assertions = [
            '1abc23',
            'abc$',
            'abc@',
            'abc!',
            'abc?',
            'abc&',
            'abc^',
            'abc%',
            'abc(',
            'abc)',
            'abc{',
            'abc}',
            'abc;',
            'abc:'
        ];

        for (const assertion of assertions) {
            const act = () => sut.register(assertion, 'test');
            expect(act, 'assertion of assertion failed').to.throw(Error, 'Name must start with a letter and can only include letters, numbers, underscore (_) and hyphens (-)');
        }

        return done();
    });
});

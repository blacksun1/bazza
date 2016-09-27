'use strict';

// Imports
const Code = require('code');
const Lab = require('lab');
const Sut = require('../src/registration');


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

internals.testValidClass = function TestValidClass() {};
internals.testValidClass.$inject = ['a', 'b?', 'c'];

internals.testInvalidClass = function TestInvalidClass() {};
internals.testInvalidClass.$inject = ['a '];


// Tests
describe('registration', () => {

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

    it('constructor should throw if arguments are missing', (done) => {

        // Arrange
        const testName = 'dingo';
        const testValue = '8mybaby';

        // Assert
        expect(() => new Sut(testName, testValue)).to.not.throw();
        expect(() => new Sut(undefined, testValue)).to.throw(Error, /name is required/);
        expect(() => new Sut(testName, undefined)).to.throw(Error, /value is required/);

        return done();
    });

    it('constructor should create registration object with reference constant', (done) => {

        // Arrange
        const testName = 'dingo';
        const testValue = '8mybaby';

        // Act
        const actual = new Sut(testName, testValue);

        // Assert
        expect(actual).includes({
            name: testName,
            value: testValue,
            isFunction: false,
            injectables: []
        });

        return done();
    });

    it('constructor should create registration object with reference object', (done) => {

        // Arrange
        const testName = 'TestValidClass';
        const testValue = internals.testValidClass;

        // Act
        const actual = new Sut(testName, testValue);

        // Assert
        expect(actual).includes({
            name: testName,
            value: testValue,
            isFunction: true,
            injectables: [
                { name: 'a', required: true },
                { name: 'b',required: false },
                { name: 'c', required: true }
            ]
        });

        return done();
    });

    it('constructor should throw if an injectable name does not validate', (done) => {

        // Arrange
        const testName = 'TestInvalidClass';
        const testValue = internals.testInvalidClass;

        // Act
        const act = () => new Sut(testName, testValue);

        // Assert
        expect(act).to.throw(Error, /Name must start with a letter and can only include letters, numbers, underscores \(_\), hyphens \(-\) or periods \(\.\)\. Optional services can be suffixed with a \?/);

        return done();
    });
});

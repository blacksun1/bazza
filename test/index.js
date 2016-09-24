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


// Tests
describe('Start testing', () => {

    it('should export a function', (done) => {

        expect(Sut).to.be.a.function();

        return done();
    });

    it('should throw an error', (done) => {

        const act = () => Sut();

        expect(act).to.throw(Error, /Not implemented Error/);

        return done();
    });
});

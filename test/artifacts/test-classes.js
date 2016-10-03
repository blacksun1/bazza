'use strict';

// Imports
const Assert = require('assert');


// Exports
exports.TestClass = class TestClass {

    constructor(foo, bar, extra) {

        Assert(typeof foo !== 'undefined', 'foo is a required argument');
        Assert(foo !== null, 'foo is not nullable');
        this.foo = foo;

        Assert(typeof bar !== 'undefined', 'bar is a required argument');
        this.bar = bar;

        this.extra = extra;
    }

    static get $inject() {

        return ['foo', 'bar?'];
    }
};

exports.SimpleTestClass = class SimpleTestClass {

    constructor() {
    }
};

exports.SimpleTestClass2 = class SimpleTestClass2 {

    constructor() {
    }
};

exports.TestClassThatTakesArray = class TestClassThatTakesArray {

    constructor(foo) {

        Assert(typeof foo !== 'undefined', 'foo is a required argument');
        Assert(foo !== null, 'foo is not nullable');
        Assert(Array.isArray(foo), 'foo should be an array');
        this.foo = foo;
    }

    static get $inject() {

        return ['foo[]'];
    }
};

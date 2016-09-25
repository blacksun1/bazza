'use strict';

// Imports
const Assert = require('assert');


// Internals
const internals = {};

// Starts with a letter (A-Za-z) and then can use
// Digits, numbers, underscore (_) or hyphen (-)
internals.nameRegex = /^([A-Za-z]{1}[\w-_]*)(\[\])?$/;
internals.containerName = 'container';
// Use this function instead of new
internals.newCall = function newCall(cls) {

    return new (Function.prototype.bind.apply(cls, arguments));
};

// Implementation
exports = module.exports = class {

    constructor(logger) {

        Assert(logger, 'Logger is a required argument');
        this._logger = logger;
        this._registrations = new Map();
        this.set_(internals.containerName, this);
    }

    get(name) {

        // Registration does not exist. Return undefined
        if (!this._registrations.has(name)) {
            return;
        }

        const value = this._registrations.get(name);

        // Value is not a function. Return the value
        if (typeof value !== 'function') {
            return value;
        }

        // Function does not have a $inject property. Just new it.
        if (!value.$inject) {
            return new value();
        }

        // Function does have an $inject property.
        // 1. Attempt to resolve it's dependencies
        // 2. Attempt to construct it
        Assert(Array.isArray(value.$inject), '$inject is expected to be an array');
        const args = value.$inject.map((argName) => {

            if (argName === name) {
                throw new Error(`Circular dependency error in registration ${argName}`);
            }

            const newArgument = this.get(argName);
            Assert(newArgument, 'Missing registration of foo');

            return newArgument;
        });

        return internals.newCall.apply(this, [value].concat(args));
    }

    register(name, reference) {

        this.validateName_(name);
        const preArrayName = this.preArrayName(name);

        if (preArrayName) {
            // Can't have array/non arry with same name
            this.unset_(preArrayName);
            const newArray = this.get(name) || [];
            Assert(Array.isArray(newArray));
            newArray.push(reference);
            this.set_(name, newArray);

            return;
        }

        // Can't have array/non arry with same name
        this.unset_(`${name}[]`);
        this.set_(name, reference);
    }

    set_(name, reference) {

        this._registrations.set(name, reference);
    }

    unset_(name) {

        this._registrations.delete(name);
    }

    validateName_(name) {

        Assert(name !== internals.containerName, `Name ${internals.containerName} is special and can't be redefined`);
        Assert(internals.nameRegex.test(name), 'Name must start with a letter and can only include letters, numbers, underscore (_) and hyphens (-)');
    }

    preArrayName(name) {

        const re = internals.nameRegex;
        const match = re.exec(name);

        if (match[2]) {
            return match[1];
        }

        return;
    }
};

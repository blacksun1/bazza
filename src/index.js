'use strict';

// Imports
const Assert = require('assert');
const EventEmitter = require('events');


// Internals
const internals = {};

// Starts with a letter (A-Za-z) and then can use
// Digits, numbers, underscore (_) or hyphen (-)
internals.nameRegex = /^([A-Za-z]{1}[\w-_]*)(\[\])?$/;

internals.containerServiceName = 'container';

// Use this function instead of new
internals.newCall = function newCall(cls) {

    return new (Function.prototype.bind.apply(cls, arguments));
};

// Implementation

exports = module.exports = class extends EventEmitter {

    constructor() {

        super();

        this._registrations = new Map();
        this.set_(internals.containerServiceName, this);
    }

    get(name) {

        // Registration does not exist. Return undefined
        if (!this._registrations.has(name)) {
            return;
        }

        // Get the value
        const value = this._registrations.get(name);

        // Value is not a function so just return it
        if (typeof value !== 'function') {
            return value;
        }

        // Value is a Function

        // Value does not have an $inject property. Just attemot to new it.
        if (!value.$inject) {
            return new value();
        }

        // Function does have an $inject property.
        // 1. Attempt to resolve it's dependencies
        Assert(Array.isArray(value.$inject), '$inject is expected to be an array');
        const args = value.$inject.map((argName) => {

            const isDefaultable = argName.substring(argName.length - 1) === '?';
            const nonNulledArgName = isDefaultable ? argName.substring(0, argName.length - 1) : argName;

            if (nonNulledArgName === name) {
                throw new Error(`Circular dependency error in registration ${argName}`);
            }

            const newArgument = this.get(nonNulledArgName);
            Assert(isDefaultable || newArgument, `Missing registration of ${nonNulledArgName}`);
            if (isDefaultable && !newArgument) {
                return null;
            }

            return newArgument;
        });

        // 2. Attempt to construct and return it
        return internals.newCall.apply(this, [value].concat(args));
    }

    dispose() {

        this.emit('preDispose');
        this.emit('postDispose');
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

        Assert(name !== internals.containerServiceName, `Name ${internals.containerServiceName} is special and can't be redefined`);
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

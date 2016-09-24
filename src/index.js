'use strict';

// Imports
const Assert = require('assert');


// Implementation
exports = module.exports = class {

    constructor(logger) {

        Assert(logger, 'Logger is a required argument');
        this._logger = logger;
        this._registrations = new Map();
    }

    get(name) {

        if (this._registrations.has(name)) {
            return this._registrations.get(name);
        }
    }

    register(name, reference) {

        this._registrations.set(name, reference);
    }
};

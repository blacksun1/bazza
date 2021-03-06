'use strict';

// Imports
const Assert = require('assert');


// Internals
const internals = {};

// Starts with a letter (A-Za-z) and then can use
// Digits, numbers, underscore (_), hyphen (-) or dot (.)
internals.nameRegex = /^([A-Za-z]{1}[\w-_.]*)(\[\])?$/;
internals.injectableNameRegex = /^([A-Za-z][\w-_.]*(?:\[\])?)([?])?$/;
internals.validNameDescription = 'Name must start with a letter and can only include letters, numbers, underscores (_), hyphens (-) or periods (.). Optional services can be suffixed with a ?';

exports = module.exports = class Registration {

    constructor(name, value) {

        Assert(name, 'name is required');
        Assert(typeof value !== 'undefined', 'value is required');

        const nameMatch = internals.nameRegex.exec(name);
        Assert(nameMatch !== null, internals.validNameDescription);

        this.fullName = name;
        this.name = nameMatch[1];
        this.isArray = (typeof nameMatch[2] !== 'undefined' && nameMatch[2] === '[]');
        this.isFunction = false;
        this.injectables = [];

        if (this.isArray) {
            this.value = [new Registration(this.name, value)];

            return;
        }

        this.value = value;
        this.isFunction = (typeof value === 'function');

        if (!this.isFunction || !value.$inject) {

            return;
        }

        const inject = value.$inject;
        Assert(Array.isArray(inject));

        for (const injectableName of inject) {
            const match = internals.injectableNameRegex.exec(injectableName);
            Assert(match !== null, internals.validNameDescription);

            const isRequired = match[2] !== '?';

            this.injectables.push({
                name: match[1],
                required: isRequired
            });
        }
    }

    push(value) {

        this.value.push(value);

        return this;
    }
};

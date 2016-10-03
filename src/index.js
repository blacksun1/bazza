'use strict';

// Imports
const Assert = require('assert');
const Registration = require('./registration');
const EventEmitter = require('events');


// Internals
const internals = {};

internals.containerServiceName = 'container';

// Starts with a letter (A-Za-z) and then can use
// Digits, numbers, underscore (_), hyphen (-)
// internals.nameRegex = /^([A-Za-z]{1}[\w-_\.]*)(\[\])?$/;
internals.injectableNameRegex = /^([A-Za-z]{1}[\w-_\.]*)(?:\[\])?\??$/;

// Use this function instead of new
// internals.;

// Implementation
exports = module.exports = class extends EventEmitter {

    constructor() {

        super();

        this.registrations_ = new Map();
        this.set_(new Registration(internals.containerServiceName, this));
    }

    get(name) {

        this.log_(['trace'], `get on '${name}'`);
        const testRegistration = new Registration(name, '');

        // Registration does not exist. Return undefined
        if (!this.registrations_.has(testRegistration.fullName)) {

            this.log_(['trace'], `No registration for ${name}`);
            return;
        }

        // Get the registration
        const registration = this.registrations_.get(testRegistration.fullName);
        this.log_(['trace'], `get ${name}`, { registration });

        if (registration.isArray) {

            return registration.value.map((item) => this.construct_(item));
        }

        if (registration.isFunction) {

            return this.construct_(registration);
        }

        return registration.value;
    }

    register(name, reference) {

        this.log_(['trace'], 'register', { name, reference });
        Assert(name, 'name is a required parameter');
        Assert(reference, 'reference is a required parameter');

        let newRegistration = new Registration(name, reference);
        Assert(newRegistration.name !== internals.containerServiceName, 'Name container is special and can\'t be redefined');

        const prevRegistration = this.registrations_.get(newRegistration.fullName);

        this.log_(['trace'], `Registered ${name}`, { newRegistration, prevRegistration });

        // New registration
        if (!prevRegistration) {
            this.set_(newRegistration);

            return;
        }

        // Both old and new have same name and are an array so push
        // a new reference value to it
        if (newRegistration.isArray && prevRegistration.isArray) {
            this.log_(['trace'], 'Pushed new reference');
            newRegistration = prevRegistration.push(newRegistration.value[0]);
        }

        // Remove the old registration
        this.unset_(prevRegistration);

        // Add the new registration
        this.set_(newRegistration);

        return;
    }

    construct_(registration) {

        this.log_(['trace'], `construct_ on registration '${registration.fullName}'`, { registration });

        if (!registration.isFunction && !registration.isArray) {
            return registration.value;
        }

        const args = registration.injectables.map((injectable, index) => {

            this.log_(['trace'], `argument ${index}`, { injectable });

            if (injectable.name === registration.name) {
                this.log_(['fatal'], `Circular dependency error in registration ${injectable.name}`, { registration, injectable });
                throw new Error(`Circular dependency error in registration ${injectable.name}`);
            }

            if (this.registrations_.has(injectable.name)) {
                this.log_(['trace'], `Found ${injectable.name}`);
                const newArg = this.registrations_.get(injectable.name);

                if (newArg.isArray) {
                    this.log_(['trace'], 'Looping through array of argItems');

                    return newArg.value.map((argItem) => this.construct_(argItem));
                }

                return this.construct_(newArg);
            }

            if (!injectable.required) {
                this.log_(['trace'], `Returned default value for ${injectable.name}`);
                return null;
            }

            this.log_(['fatal'], `Missing registration of ${injectable.name}`, {
                registration,
                injectable,
                index
            });
            throw new Error(`Missing registration of ${injectable.name}`);
        });

        // 2. Attempt to construct and return it
        return this.newCall_.apply(this, [registration.value].concat(args));
    }

    log_(tags, message, data) {

        this.emit('log', {
            tags,
            message,
            data
        });
    }

    newCall_(cls) {

        Assert(typeof cls === 'function', 'Can only call new on a function');
        this.log_(['trace'], `Calling new on the class '${cls.name}' class`, { class: cls, arguments });

        return new (Function.prototype.bind.apply(cls, arguments))();
    }

    set_(registration) {

        this.log_(['trace'], `set_ on registration '${registration.fullName}'`, { registration });
        this.unset_(registration.name);
        this.registrations_.set(registration.fullName, registration);
    }

    unset_(name) {

        this.log_(['trace'], `unset_ on '${name}'`);
        if (this.registrations_.has(name)) {
            this.registrations_.delete(name);
        }

        if (this.registrations_.has(`${name}[]`)) {
            this.registrations_.delete(`${name}[]`);
        }
    }
};

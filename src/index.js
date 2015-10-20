"use strict";

const owe = require("owe-core");

// Extend core with basic helper functions:

// Generates router and closer for object tree exposal:
owe.serve = require("./serve");

// Reroutes API nodes to other API nodes:
owe.reroute = require("./reroute");

// Chains multiple router and/or closer functions to one fallthrough function:
owe.chain = require("./chain");

// Switches between multiple given router and/or closer functions:
owe.switch = require("./switch");

// Sets exposal value for objects, contains exposed aliases for the default errors, exposes object subsets by keys:
owe.exposed = owe.expose = require("./exposed");

owe.isExposed = owe.exposed.is;

module.exports = owe;

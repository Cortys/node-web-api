"use strict";

const owe = require("owe-core");

// Extend core with basic helper functions:

// Generates router and closer for object tree exposal:
owe.serve = require("./serve");

// Reroutes API nodes to other API nodes:
owe.reroute = require("./reroute");

// Chains multiple router and/or closer functions to one fallthrough function:
owe.chain = require("./chain");

module.exports = owe;

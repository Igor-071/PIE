#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var generatePrd_js_1 = require("./cli/commands/generatePrd.js");
var program = new commander_1.Command();
program
    .name("pie")
    .description("Product Intelligence Engine - Converts ZIP repositories into structured PRDs")
    .version("0.1.0");
(0, generatePrd_js_1.registerGeneratePrdCommand)(program);
program.parse();

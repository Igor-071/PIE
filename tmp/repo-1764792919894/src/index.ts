#!/usr/bin/env node

import { Command } from "commander";
import { registerGeneratePrdCommand } from "./cli/commands/generatePrd.js";

const program = new Command();

program
  .name("pie")
  .description("Product Intelligence Engine - Converts ZIP repositories into structured PRDs")
  .version("0.1.0");

registerGeneratePrdCommand(program);

program.parse();

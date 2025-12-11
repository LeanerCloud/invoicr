#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { findClients, buildClientListOutput } from './list-utils.js';

const cwd = process.cwd();

function main() {
  // Check if provider.json exists
  const providerPath = path.join(cwd, 'provider.json');
  if (!fs.existsSync(providerPath)) {
    console.log('No provider.json found in current directory.');
    console.log('Run "invoicr-init" to set up your invoicing workspace.');
    process.exit(1);
  }

  const clients = findClients(cwd);
  console.log(buildClientListOutput(clients));
}

main();

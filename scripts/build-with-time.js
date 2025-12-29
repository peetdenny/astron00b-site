#!/usr/bin/env node
/**
 * Build script that sets BUILD_TIME environment variable
 */

import { spawn } from 'child_process';

process.env.BUILD_TIME = new Date().toISOString();

const child = spawn('astro', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BUILD_TIME: process.env.BUILD_TIME }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});



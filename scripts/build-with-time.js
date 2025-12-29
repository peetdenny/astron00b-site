#!/usr/bin/env node
/**
 * Build script that sets BUILD_TIME environment variable
 */

process.env.BUILD_TIME = new Date().toISOString();

const { spawn } = require('child_process');

const child = spawn('astro', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BUILD_TIME: process.env.BUILD_TIME }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});



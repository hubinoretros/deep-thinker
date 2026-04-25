#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const mcpProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

mcpProcess.stdout.on('data', (data) => {
  console.log('MCP Output:', data.toString());
});

mcpProcess.stderr.on('data', (data) => {
  console.error('MCP Error:', data.toString());
});

// Send a listTools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

console.log('Sending listTools request...');
mcpProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

setTimeout(() => {
  // Send a think request
  const thinkRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'think',
      arguments: {
        content: 'Test thought for MCP testing',
        type: 'question',
        strategy: 'sequential',
        confidence: 0.7
      }
    }
  };
  
  console.log('Sending think request...');
  mcpProcess.stdin.write(JSON.stringify(thinkRequest) + '\n');
  
  setTimeout(() => {
    // Send evaluate request
    const evaluateRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'evaluate',
        arguments: {}
      }
    };
    
    console.log('Sending evaluate request...');
    mcpProcess.stdin.write(JSON.stringify(evaluateRequest) + '\n');
    
    setTimeout(() => {
      mcpProcess.kill();
      process.exit(0);
    }, 1000);
  }, 1000);
}, 1000);
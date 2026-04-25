#!/usr/bin/env node

import { spawn } from 'child_process';

const mcpProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Buffer for stdout data
let stdoutBuffer = '';

mcpProcess.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  
  // Try to parse complete JSON objects
  const lines = stdoutBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        console.log('📦 MCP Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('📝 MCP Output:', line);
      }
    }
  }
  
  // Keep last incomplete line
  stdoutBuffer = lines[lines.length - 1];
});

mcpProcess.stderr.on('data', (data) => {
  console.error('🔴 MCP Error:', data.toString());
});

setTimeout(() => {
  console.log('\n=== Test 1: List Tools ===');
  mcpProcess.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  }) + '\n');
  
  setTimeout(() => {
    console.log('\n=== Test 2: Add Thought ===');
    mcpProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'think',
        arguments: {
          content: 'Test: Should we prioritize performance or features?',
          type: 'question',
          strategy: 'sequential',
          confidence: 0.8
        }
      }
    }) + '\n');
    
    setTimeout(() => {
      console.log('\n=== Test 3: Emotional Intelligence Analysis ===');
      mcpProcess.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'emotional_intelligence_analysis',
          arguments: {
            text: 'Our users are expressing frustration with slow loading times. We need to address performance issues to show we value their time and experience.',
            context: 'customer feedback session',
            perspectiveTaking: 0.9
          }
        }
      }) + '\n');
      
      setTimeout(() => {
        console.log('\n=== Test 4: Cross-Disciplinary Synthesis ===');
        mcpProcess.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'cross_disciplinary_synthesis',
            arguments: {
              sourceDomains: ['biology', 'computer_science'],
              targetProblem: 'Optimizing system performance',
              maxAnalogies: 2
            }
          }
        }) + '\n');
        
        setTimeout(() => {
          console.log('\n=== Test 5: Evaluate Graph ===');
          mcpProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
              name: 'evaluate',
              arguments: {}
            }
          }) + '\n');
          
          setTimeout(() => {
            mcpProcess.kill();
            console.log('\n✅ Tests completed');
            process.exit(0);
          }, 2000);
        }, 2000);
      }, 2000);
    }, 2000);
  }, 2000);
}, 500);
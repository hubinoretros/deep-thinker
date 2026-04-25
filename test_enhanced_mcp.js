#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const mcpProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestId = 1;

function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  
  console.log(`\n=== Sending ${method} request ===`);
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
  return request.id;
}

mcpProcess.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString().trim());
  } catch {
    // Not JSON, just log it
    console.log('MCP Output:', data.toString());
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.error('MCP Error:', data.toString());
});

setTimeout(() => {
  // 1. List tools
  sendRequest('tools/list', {});
  
  setTimeout(() => {
    // 2. Add initial thoughts
    sendRequest('tools/call', {
      name: 'think',
      arguments: {
        content: 'Should we implement dark mode in our app?',
        type: 'question',
        strategy: 'sequential',
        confidence: 0.8
      }
    });
    
    setTimeout(() => {
      sendRequest('tools/call', {
        name: 'think',
        arguments: {
          content: 'Users request dark mode for better nighttime readability',
          type: 'evidence',
          strategy: 'sequential',
          confidence: 0.9
        }
      });
      
      setTimeout(() => {
        sendRequest('tools/call', {
          name: 'think',
          arguments: {
            content: 'Dark mode could reduce eye strain and improve accessibility',
            type: 'analysis',
            strategy: 'sequential',
            confidence: 0.85
          }
        });
        
        setTimeout(() => {
          // 3. Test new enhanced tools
          
          // Get node ID from previous responses (we'll use thought_1 as example)
          const testNodeId = 'thought_1';
          
          // Test visualize_thought_graph
          sendRequest('tools/call', {
            name: 'visualize_thought_graph',
            arguments: {
              format: 'ascii',
              showConfidence: true
            }
          });
          
          setTimeout(() => {
            // Test simulate_devils_advocate
            sendRequest('tools/call', {
              name: 'simulate_devils_advocate',
              arguments: {
                nodeId: testNodeId,
                depth: 2,
                intensity: 'moderate'
              }
            });
            
            setTimeout(() => {
              // Test cross_disciplinary_synthesis
              sendRequest('tools/call', {
                name: 'cross_disciplinary_synthesis',
                arguments: {
                  sourceDomains: ['biology', 'economics'],
                  targetProblem: 'Implementing dark mode feature',
                  maxAnalogies: 2
                }
              });
              
              setTimeout(() => {
                // Test emotional_intelligence_analysis
                sendRequest('tools/call', {
                  name: 'emotional_intelligence_analysis',
                  arguments: {
                    text: 'Users are frustrated with the current bright interface, especially at night. We should prioritize dark mode to show we care about user comfort.',
                    context: 'customer feedback',
                    perspectiveTaking: 0.8
                  }
                });
                
                setTimeout(() => {
                  // Test evaluate to see graph state
                  sendRequest('tools/call', {
                    name: 'evaluate',
                    arguments: {}
                  });
                  
                  setTimeout(() => {
                    mcpProcess.kill();
                    process.exit(0);
                  }, 1000);
                }, 1000);
              }, 1000);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}, 500);
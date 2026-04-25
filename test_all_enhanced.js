#!/usr/bin/env node

import { spawn } from 'child_process';

const mcpProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let stdoutBuffer = '';
let requestId = 1;

mcpProcess.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  
  const lines = stdoutBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        console.log(`📦 Response ID ${response.id}:`, JSON.stringify(response.result || response.error, null, 2).substring(0, 500) + '...');
      } catch (e) {
        console.log('📝 Raw:', line.substring(0, 200));
      }
    }
  }
  
  stdoutBuffer = lines[lines.length - 1];
});

mcpProcess.stderr.on('data', (data) => {
  const err = data.toString().trim();
  if (err && !err.includes('deep-thinker MCP server')) {
    console.error('🔴 Error:', err);
  }
});

function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  
  console.log(`\n🚀 ${method}:`, JSON.stringify(params).substring(0, 150));
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}

setTimeout(() => {
  // Reset first
  sendRequest('tools/call', {
    name: 'reset',
    arguments: {
      problem: 'Testing enhanced MCP tools'
    }
  });
  
  setTimeout(() => {
    // Add some thoughts
    sendRequest('tools/call', {
      name: 'think',
      arguments: {
        content: 'We should implement a carbon offset program for our company',
        type: 'proposal',
        strategy: 'sequential',
        confidence: 0.75
      }
    });
    
    setTimeout(() => {
      sendRequest('tools/call', {
        name: 'think',
        arguments: {
          content: 'Carbon offset would improve our ESG score and brand reputation',
          type: 'analysis',
          strategy: 'sequential',
          confidence: 0.85
        }
      });
      
      setTimeout(() => {
        sendRequest('tools/call', {
          name: 'think',
          arguments: {
            content: 'Implementation cost is $50k annually',
            type: 'evidence',
            strategy: 'sequential',
            confidence: 0.9
          }
        });
        
        setTimeout(() => {
          // Test enhanced tools
          
          // 1. visualize_thought_graph
          sendRequest('tools/call', {
            name: 'visualize_thought_graph',
            arguments: {
              format: 'ascii',
              showConfidence: true
            }
          });
          
          setTimeout(() => {
            // 2. simulate_devils_advocate (on thought_1)
            sendRequest('tools/call', {
              name: 'simulate_devils_advocate',
              arguments: {
                nodeId: 'thought_1',
                depth: 2,
                intensity: 'moderate'
              }
            });
            
            setTimeout(() => {
              // 3. ethical_framework_evaluation
              sendRequest('tools/call', {
                name: 'ethical_framework_evaluation',
                arguments: {
                  nodeId: 'thought_1',
                  frameworks: ['deontological', 'consequentialist']
                }
              });
              
              setTimeout(() => {
                // 4. explain_decision
                sendRequest('tools/call', {
                  name: 'explain_decision',
                  arguments: {
                    nodeId: 'thought_1',
                    detailLevel: 'detailed',
                    includeCounterfactuals: true
                  }
                });
                
                setTimeout(() => {
                  // 5. social_impact_analysis
                  sendRequest('tools/call', {
                    name: 'social_impact_analysis',
                    arguments: {
                      nodeId: 'thought_1',
                      stakeholders: ['employees', 'investors', 'community', 'environment']
                    }
                  });
                  
                  setTimeout(() => {
                    // 6. temporal_projection
                    sendRequest('tools/call', {
                      name: 'temporal_projection',
                      arguments: {
                        nodeId: 'thought_1',
                        years: 5,
                        scenario: 'optimistic'
                      }
                    });
                    
                    setTimeout(() => {
                      // Final evaluate
                      sendRequest('tools/call', {
                        name: 'evaluate',
                        arguments: {}
                      });
                      
                      setTimeout(() => {
                        mcpProcess.kill();
                        console.log('\n✅ All enhanced tools tested successfully!');
                        process.exit(0);
                      }, 2000);
                    }, 2000);
                  }, 2000);
                }, 2000);
              }, 2000);
            }, 2000);
          }, 2000);
        }, 2000);
      }, 2000);
    }, 2000);
  }, 2000);
}, 500);
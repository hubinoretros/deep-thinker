import { ThoughtGraph } from "../core/graph.js";
import { ThoughtNode } from "../core/types.js";

export function visualizeAsSVG(
  graph: ThoughtGraph,
  options: {
    highlightPath?: { from: string; to: string };
    showConfidence?: boolean;
    width?: number;
    height?: number;
  } = {}
): string {
  const nodes = graph.getAllNodes();
  const stats = graph.getStats();

  const width = options.width || 800;
  const height = options.height || 600;
  const nodeRadius = 20;
  const levelSpacing = 100;
  const nodeSpacing = 80;

  // Simple layout: level-based positioning
  const levels = new Map<number, ThoughtNode[]>();
  // For now, use simple depth calculation (0 for roots, increment for children)
  // This is a simplified approach
  const depthMap = new Map<string, number>();
  
  // Find roots (nodes with no parent or parent not in graph)
  const roots = nodes.filter(n => !n.parentId || !graph.getNode(n.parentId));
  roots.forEach((node, i) => depthMap.set(node.id, 0));
  
  // Assign depth 1 to children of roots, etc. (simplified)
  for (const node of nodes) {
    if (!depthMap.has(node.id)) {
      const parentDepth = node.parentId ? depthMap.get(node.parentId) : -1;
      depthMap.set(node.id, (parentDepth !== undefined ? parentDepth + 1 : 0));
    }
    
    const depth = depthMap.get(node.id) || 0;
    if (!levels.has(depth)) levels.set(depth, []);
    levels.get(depth)!.push(node);
  }

  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#2196F3;stop-opacity:0.8" />
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  
  <rect width="100%" height="100%" fill="#f8f9fa" />
  <text x="20" y="30" font-family="Arial" font-size="14" fill="#333">
    Deep Thinker Graph: ${stats.totalNodes} nodes, ${stats.totalEdges} edges
  </text>
`;

  // Draw edges first
  for (const node of nodes) {
    for (const edge of node.edges) {
      const targetNode = graph.getNode(edge.targetId);
      if (!targetNode) continue;

      const sourceDepth = depthMap.get(node.id) || 0;
      const targetDepth = depthMap.get(edge.targetId) || 0;
      const sourceIndex = levels.get(sourceDepth)?.indexOf(node) || 0;
      const targetIndex = levels.get(targetDepth)?.indexOf(targetNode) || 0;

      const x1 = 100 + sourceDepth * levelSpacing;
      const y1 = 100 + sourceIndex * nodeSpacing;
      const x2 = 100 + targetDepth * levelSpacing;
      const y2 = 100 + targetIndex * nodeSpacing;

      const color = edge.type === "contradicts" ? "#ff6b6b" :
                   edge.type === "supports" ? "#51cf66" :
                   edge.type === "derives_from" ? "#339af0" : "#868e96";

      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" stroke-opacity="0.6" />`;
    }
  }

  // Draw nodes
  for (const [depth, depthNodes] of levels) {
    for (let i = 0; i < depthNodes.length; i++) {
      const node = depthNodes[i];
      const x = 100 + depth * levelSpacing;
      const y = 100 + i * nodeSpacing;

      const confidenceColor = `rgb(${Math.round(255 * (1 - node.confidence))}, ${Math.round(255 * node.confidence)}, 100)`;
      const fillColor = options.showConfidence ? confidenceColor : "#4dabf7";

      svg += `<circle cx="${x}" cy="${y}" r="${nodeRadius}" fill="${fillColor}" stroke="#333" stroke-width="2" filter="url(#glow)" />`;
      
      svg += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Arial" font-size="12" fill="#333">${node.id.substring(0, 4)}</text>`;
      
      if (options.showConfidence) {
        svg += `<text x="${x}" y="${y - 25}" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">${(node.confidence * 100).toFixed(0)}%</text>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

export function visualizeAsASCII(graph: ThoughtGraph): string {
  const nodes = graph.getAllNodes();
  const stats = graph.getStats();

  let output = `Deep Thinker Graph (${stats.totalNodes} nodes, ${stats.totalEdges} edges)\n`;
  output += "=".repeat(60) + "\n\n";

  const roots = graph.getRoots();
  for (const root of roots) {
    output += buildASCIITree(graph, root.id, "", true);
  }

  return output;
}

function buildASCIITree(graph: ThoughtGraph, nodeId: string, prefix: string, isLast: boolean): string {
  const node = graph.getNode(nodeId);
  if (!node) return "";

  let result = prefix + (isLast ? "└── " : "├── ");
  result += `[${node.id}] ${node.type}: ${node.content.substring(0, 40)}`;
  if (node.confidence !== undefined) {
    result += ` (${(node.confidence * 100).toFixed(0)}%)`;
  }
  result += "\n";

  const children = node.childIds.map(id => graph.getNode(id)).filter(Boolean);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childPrefix = prefix + (isLast ? "    " : "│   ");
    result += buildASCIITree(graph, child!.id, childPrefix, i === children.length - 1);
  }

  return result;
}

export function visualizeAsTree(graph: ThoughtGraph): string {
  return visualizeAsASCII(graph); // Alias for now
}
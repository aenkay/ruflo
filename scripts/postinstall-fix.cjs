#!/usr/bin/env node
/**
 * Post-install fix for ruflo/claude-flow packaging issues.
 * Creates symlinks for packages that have incorrect paths in the dist output.
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Fix 1: AgentDB controller path
// dist/controllers/index.js should resolve to dist/src/controllers/index.js
// Multiple copies of agentdb may exist in the tree
const agentdbPaths = [
  path.join(rootDir, 'node_modules', 'agentdb', 'dist'),
  path.join(rootDir, 'node_modules', 'agentic-flow', 'node_modules', 'agentdb', 'dist'),
  path.join(rootDir, 'v3', 'node_modules', 'agentdb', 'dist'),
  path.join(rootDir, 'v3', '@claude-flow', 'memory', 'node_modules', 'agentdb', 'dist'),
  path.join(rootDir, 'v3', '@claude-flow', 'neural', 'node_modules', 'agentdb', 'dist'),
];

for (const agentdbDist of agentdbPaths) {
  const controllersTarget = path.join(agentdbDist, 'controllers');
  const controllersSource = path.join(agentdbDist, 'src', 'controllers');
  if (fs.existsSync(controllersSource) && !fs.existsSync(controllersTarget)) {
    try {
      fs.symlinkSync('src/controllers', controllersTarget);
      console.log('[postinstall] Fixed AgentDB controller path in ' + agentdbDist);
    } catch (e) {
      // Ignore if symlink already exists or permissions issue
    }
  }
}

// Fix 2: Guidance package resolution
// @claude-flow/guidance needs to be accessible from node_modules
const guidanceSource = path.join(rootDir, 'v3', '@claude-flow', 'guidance');
const cfDir = path.join(rootDir, 'node_modules', '@claude-flow');
const guidanceTarget = path.join(cfDir, 'guidance');

if (fs.existsSync(guidanceSource) && !fs.existsSync(guidanceTarget)) {
  try {
    if (!fs.existsSync(cfDir)) {
      fs.mkdirSync(cfDir, { recursive: true });
    }
    const relativePath = path.relative(cfDir, guidanceSource);
    fs.symlinkSync(relativePath, guidanceTarget);
    console.log('[postinstall] Fixed guidance package resolution');
  } catch (e) {
    // Ignore if symlink already exists
  }
}

console.log('[postinstall] Ruflo fixes applied');

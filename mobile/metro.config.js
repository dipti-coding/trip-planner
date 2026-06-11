const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// In a git worktree the workspace root (.git file, not dir) differs from the
// main repo root (.git directory). Walk up to find the real repo root so
// node_modules resolves correctly regardless of worktree nesting depth.
function findRepoRoot(dir) {
  let d = dir;
  while (d !== path.parse(d).root) {
    try {
      if (fs.statSync(path.join(d, '.git')).isDirectory()) return d;
    } catch {}
    d = path.dirname(d);
  }
  return dir;
}
const repoRoot = findRepoRoot(root);

const config = {
  watchFolders: [root, repoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(root, 'node_modules'),
      path.resolve(repoRoot, 'node_modules'),
      path.resolve(repoRoot, 'mobile', 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

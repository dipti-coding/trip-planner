# Troubleshooting

A running log of issues encountered during development and how they were resolved.

---

## Docker Desktop fails to start — permission denied on Docker.raw

**Error:**
```
starting engine: engine linux/virtualization-framework failed to start: ensuring disk:
cannot resize "...Docker.raw" to 122147MiB: truncate ...Docker.raw: permission denied
```

**Cause:** `Docker.raw` was owned by `root` instead of the current user.

**Fix:**
```bash
sudo chown dipti "/Users/dipti/Library/Containers/com.docker.docker/Data/vms/0/data/Docker.raw"
open -a Docker
```

---

## `just` command not found

**Error:** `command not found: just`

**Fix:**
```bash
brew install just
```

---

## `xcodebuild` requires Xcode, not Command Line Tools

**Error:**
```
xcode-select: error: tool 'xcodebuild' requires Xcode,
but active developer directory '/Library/Developer/CommandLineTools'
is a command line tools instance
```

**Cause:** `xcode-select` was pointing at the CLI tools instead of the full Xcode.app install.

**Fix:**
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Verify:
```bash
xcode-select -p
# /Applications/Xcode.app/Contents/Developer
```

---

## CocoaPods — Ruby version conflict (Homebrew vs RVM)

**Error:**
```
Could not find 'bigdecimal' (>= 0) among 220 total gem(s) (Gem::MissingSpecError)
```

**Cause:** Homebrew installed CocoaPods against Ruby 4.0.4, but RVM was managing Ruby 3.4.2. The two Ruby environments conflicted.

**Fix:** Use Bundler to manage CocoaPods from the mobile project's `Gemfile`, which bypasses the system Ruby conflict:
```bash
cd mobile
bundle install
cd ios && bundle exec pod install
```

---

## Metro bundler — port 8081 already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8081
```

**Cause:** A previous Metro bundler instance was still running.

**Fix:**
```bash
kill $(lsof -ti:8081)
cd mobile && npx react-native start --reset-cache
```

---

## Metro — unable to resolve `@babel/runtime`

**Error:**
```
Unable to resolve module @babel/runtime/helpers/interopRequireDefault
from /Users/dipti/dev/trip-planner/mobile/index.js
```

**Cause:** npm workspaces hoisted `@babel/runtime` to the root `node_modules/`, but Metro only resolved modules relative to `mobile/`.

**Fix:** Update `mobile/metro.config.js` to include the root `node_modules` in the resolver:
```js
const path = require('path');
const root = path.resolve(__dirname, '..');

const config = {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(root, 'node_modules'),
    ],
  },
};
```

Then clear Metro cache and restart:
```bash
kill $(lsof -ti:8081)
cd mobile && npx react-native start --reset-cache
```

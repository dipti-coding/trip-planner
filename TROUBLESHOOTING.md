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

## `python` command not found after activating Hermit

**Error:** `zsh: command not found: python`

**Cause:** Hermit was initialized but the Python package was never installed into the environment. The `bin/hermit.hcl` config had no packages listed.

**Fix:**
```bash
hermit install python3@3.12 node@20 terraform@1.7
```

Hermit tracks packages as `.pkg` symlinks in `bin/` — after installing, `python`, `python3`, `node`, and `terraform` are all available when the Hermit env is active.

---

## `source bin/activate-hermit` fails

**Error:** `bin/activate-hermit: no such file` or the script exits immediately with an error.

**Cause:** Hermit wasn't initialized in the repo.

**Fix:**
```bash
hermit init
source bin/activate-hermit
```

Better long-term: install shell hooks so Hermit auto-activates on `cd`:
```bash
hermit shell-hooks --zsh   # or --bash / --fish
```

---

## Port 5432 or 8000 already in use (shared machine)

**Error:**
```
ports are not available: exposing port TCP 0.0.0.0:5432 -> 127.0.0.1:0: bind: address already in use
```
or
```
ERROR: [Errno 48] Address already in use
```

**Cause:** Another user or process on the machine is holding the port. Common on shared dev machines.

**Fix:** Override the ports in your local `.env` (not `.env.example`):
```
POSTGRES_PORT=5433
API_PORT=8001
DATABASE_URL=postgresql://trip_planner:secret@localhost:5433/trip_planner_dev
```

`docker-compose.yml` and the Justfile both read from `.env` automatically.

---

## `just seed` / `just dev` — ModuleNotFoundError

**Error:** `ModuleNotFoundError: No module named 'dotenv'` (or similar)

**Cause:** The Python venv isn't set up or `pip install -r requirements.txt` hasn't been run.

**Fix:**
```bash
python -m venv .venv
pip install -r requirements.txt
```

`just` commands pick up the venv automatically via the `PATH` set in the Justfile — no need to `source .venv/bin/activate`.

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

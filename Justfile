set dotenv-load
export PATH := ".venv/bin:" + env_var('PATH')

# Start Postgres + API in Docker (builds image if needed)
up:
    docker compose up -d --build
    @echo "Waiting for Postgres to be ready..."
    @until docker compose exec postgres pg_isready -U trip_planner > /dev/null 2>&1; do sleep 1; done
    @echo "Postgres is ready."
    @echo "Waiting for API to be ready..."
    @until curl -s http://localhost:${API_PORT:-8000}/ping > /dev/null 2>&1; do sleep 1; done
    @echo "API is ready."

# Stop and remove Docker containers
down:
    docker compose down

# Start FastAPI with hot reload
dev:
    uvicorn app.main:app --reload --host 0.0.0.0 --port ${API_PORT:-8000}

# Run DB migrations
migrate:
    alembic upgrade head

# Run tests
test:
    pytest

# Tail Docker logs
logs:
    docker compose logs -f

# Seed the database with test users, trips, and plans
seed:
    python scripts/seed.py

# Test OCR + parsing on a screenshot: just test-ocr <image_path>
test-ocr image:
    PYTHONPATH=. python scripts/test_ocr.py {{image}}

# Verify the ping endpoint is responding
ping:
    curl -s http://localhost:${API_PORT:-8000}/ping | python3 -m json.tool

# List available iPhone simulators with index numbers for use with `just ios <n>`
ios-list:
    #!/usr/bin/env bash
    i=1
    while IFS= read -r line; do
        name=$(echo "$line" | sed 's/^[[:space:]]*//' | sed -E 's/ \([0-9A-F-]+\).*//')
        printf "  [%d] %s\n" "$i" "$name"
        i=$((i+1))
    done < <(xcrun simctl list devices available | grep -E 'iPhone')

# Run iOS app on iPhone 16 Pro by default; pass index from `just ios-list` to pick another
ios sim="":
    #!/usr/bin/env bash
    set -euo pipefail
    if ! diff -q mobile/ios/Podfile.lock mobile/ios/Pods/Manifest.lock > /dev/null 2>&1; then
        echo "Pods out of sync. Running pod install..."
        cd mobile/ios && bundle exec pod install
        cd ../..
    fi
    BOOTED=$(xcrun simctl list devices booted | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' | head -1 || true)
    if [ -n "$BOOTED" ]; then
        cd mobile && npm run ios -- --udid "$BOOTED"
        exit 0
    fi
    NAMES=()
    UDIDS=()
    while IFS= read -r line; do
        name=$(echo "$line" | sed 's/^[[:space:]]*//' | sed -E 's/ \([0-9A-F-]+\).*$//')
        udid=$(echo "$line" | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' || true)
        [ -n "$udid" ] && NAMES+=("$name") && UDIDS+=("$udid")
    done < <(xcrun simctl list devices available | grep -E 'iPhone')
    if [ ${#NAMES[@]} -eq 0 ]; then
        echo "No iPhone simulators found. Install one via Xcode > Settings > Platforms."
        exit 1
    fi
    SIM_ARG="{{sim}}"
    if [ -n "$SIM_ARG" ]; then
        IDX=$((SIM_ARG-1))
        if [ "$IDX" -lt 0 ] || [ "$IDX" -ge "${#NAMES[@]}" ]; then
            echo "Invalid selection. Run 'just ios-list' to see options."
            exit 1
        fi
        UDID="${UDIDS[$IDX]}"
        SIM_NAME="${NAMES[$IDX]}"
    else
        UDID=""
        SIM_NAME="iPhone 16 Pro"
        for i in "${!NAMES[@]}"; do
            if [ "${NAMES[$i]}" = "iPhone 16 Pro" ]; then
                UDID="${UDIDS[$i]}"
                break
            fi
        done
        if [ -z "$UDID" ]; then
            echo "iPhone 16 Pro not found. Run 'just ios-list' to see available simulators."
            exit 1
        fi
    fi
    echo "Booting $SIM_NAME..."
    xcrun simctl boot "$UDID"
    open -a Simulator
    echo "Waiting for simulator to boot..."
    until xcrun simctl list devices booted | grep -q "$UDID"; do sleep 1; done
    cd mobile && npm run ios -- --udid "$UDID"

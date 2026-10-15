#!/bin/sh
set -eu

timeout_seconds="${BELL_TIME_SYNC_TIMEOUT:-900}"
elapsed=0
while [ "$elapsed" -lt "$timeout_seconds" ]; do
    synchronized="$(timedatectl show -p NTPSynchronized --value 2>/dev/null || true)"
    if [ "$synchronized" = "yes" ]; then
        exit 0
    fi
    sleep 5
    elapsed=$((elapsed + 5))
done

echo "System clock did not synchronize with NTP within ${timeout_seconds} seconds." >&2
exit 1

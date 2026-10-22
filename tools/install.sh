#!/usr/bin/env bash
set -euo pipefail
sdk=$(cd "${1:?Usage: install.sh SDK_PATH PROFILE TV_IP}" && pwd)
profile=${2:?Specify your Samsung signing profile}
tv=${3:?Specify your TV IP address}
root=$(cd "$(dirname "$0")/.." && pwd)
test -f "$root/dist/index.html" || { echo 'Build first: pnpm build' >&2; exit 1; }
build="$root/build"
# A new source directory prevents stale files from earlier signed builds.
mkdir -p "$build"
src=$(mktemp -d "$build/src.XXXXXX")
cp -R "$root/dist/." "$src/"
"$sdk/tools/ide/bin/tizen" package -t wgt -s "$profile" -o "$build" -- "$src"
"$sdk/tools/sdb" connect "$tv:26101"
"$sdk/tools/ide/bin/tizen" install -n 'Home OS.wgt' -s "$tv:26101" -- "$build"
"$sdk/tools/ide/bin/tizen" run -p TvHomeLnch.Home -s "$tv:26101"

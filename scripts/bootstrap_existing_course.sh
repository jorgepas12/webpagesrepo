#!/usr/bin/env bash
# Bootstrap: instructor/admin needs only a checkout of the course repository.
# This fetches webpagesrepo into a temporary folder, runs the adopter, and
# removes the temporary clone. Dry-run unless --apply is explicitly passed.
set -euo pipefail

if [[ ! -d .git || ! -d labs ]]; then
  echo "ERROR: Run from the root of a Git course repository with a labs directory" >&2
  exit 1
fi

temp_root="$(mktemp -d)"
trap 'rm -rf "$temp_root"' EXIT

git clone --depth 1 \
  --branch main \
  https://github.com/jorgepas12/webpagesrepo.git \
  "$temp_root/webpagesrepo" >&2

node "$temp_root/webpagesrepo/scripts/adopt_course_complete.mjs" \
  --target "$PWD" "$@"

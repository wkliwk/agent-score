#!/bin/sh
# Run once after cloning: sh scripts/install-hooks.sh
set -e
HOOK=.git/hooks/pre-push
cp scripts/pre-push.sh "$HOOK"
chmod +x "$HOOK"
echo "pre-push hook installed."

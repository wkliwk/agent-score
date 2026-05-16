#!/bin/sh
# Runs before every git push. Blocks push if next build fails.
echo "Running build check before push..."
npm run build:check
STATUS=$?
if [ $STATUS -ne 0 ]; then
  echo ""
  echo "Build check failed. Fix the errors above before pushing."
  exit 1
fi
echo "Build check passed."

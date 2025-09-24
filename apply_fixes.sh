#!/bin/bash
set -e
echo "--- Applying all fixes ---"
rm -f public/js/preview.js
rm -rf public/js/utils
mkdir -p public/js/ui
curl -s -o public/js/ui/previews.js https://gist.githubusercontent.com/donnachab/12345/raw/previews.js
curl -s -o public/js/main.js https://gist.githubusercontent.com/donnachab/12345/raw/main.js
curl -s -o public/js/admin/admin-mode.js https://gist.githubusercontent.com/donnachab/12345/raw/admin-mode.js
# (and so on for all other files)
echo "--- All fixes have been applied ---"

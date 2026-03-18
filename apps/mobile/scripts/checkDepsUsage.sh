#!/bin/bash

mv src/package.json src/ignore.json
bun run depcheck
result_status=$?
mv src/ignore.json src/package.json

exit $result_status

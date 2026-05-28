#!/bin/sh
# Note: Not using 'set -e' because we want to handle errors gracefully

# Fix invalid paths for --entry-file and --assets-dest params,
# needed for react-native/scripts/bundle.js script.
export ENTRY_FILE="apps/mobile/index.js"
export DEST="ios/Uniswap.app"

# Store the starting directory, and if we're in an `ios` dir, move up to parent
START_DIR=$(pwd)
BASENAME=$(basename "$START_DIR")
if [ "$BASENAME" = "ios" ]; then
  cd ..
fi

DATADOG_XCODE="../../node_modules/.bin/datadog-ci react-native xcode"
REACT_NATIVE_XCODE="../../node_modules/react-native/scripts/react-native-xcode.sh"

# Create a temporary file for capturing output.
TEMP_LOG=$(mktemp)

# As Xcode doesn't show echo messages by default, we enforce printing logs with the warning label.
echo "warning: Starting Datadog source map generation and upload..."
echo "warning:  Command: $DATADOG_XCODE $REACT_NATIVE_XCODE"
echo "warning:  SOURCEMAP_FILE: $SOURCEMAP_FILE"
echo "warning:  Configuration: $CONFIGURATION"
echo ""

# Run the datadog-ci command and capture both stdout and stderr
# Use pipefail to catch the exit code of the datadog command, not tee
set -o pipefail
if /bin/sh -c "$DATADOG_XCODE $REACT_NATIVE_XCODE" 2>&1 | tee "$TEMP_LOG"; then
  set +o pipefail
  echo "warning: Datadog source map upload completed successfully"
  rm -f "$TEMP_LOG"
  exit 0
else
  set +o pipefail
  EXIT_CODE=$?
  echo "error: "
  echo "error: Datadog Source Map Upload Failed"
  echo "error: Exit Code: $EXIT_CODE"
  echo "error: "
  echo "error: Full Error Output:"
  echo "error: ---"
  echo "error: $(cat "$TEMP_LOG")"
  echo "error: ---"
  echo "error: "
  echo "error: Debug Information:"
  echo "error:   - datadog-ci version: $(../../../node_modules/.bin/datadog-ci version 2>&1 || echo 'Failed to get version')"
  echo "error:   - Node version: $(node --version 2>&1 || echo 'Node not found')"
  echo "error:   - React Native CLI: $(../../../node_modules/.bin/react-native --version 2>&1 || echo 'RN CLI not found')"
  echo "error:   - Working directory: $(pwd)"
  echo "error:   - DATADOG_API_KEY set: $([ -n "$DATADOG_API_KEY" ] && echo 'Yes' || echo 'No')"
  echo "error:   - Bundle file exists: $([ -f "$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle" ] && echo 'Yes' || echo 'No')"
  echo "error:   - Source map exists: $([ -f "$SOURCEMAP_FILE" ] && echo "Yes ($SOURCEMAP_FILE)" || echo "No ($SOURCEMAP_FILE)")"
  echo "error: "
  echo "error: This is non-critical. Build will continue."
  echo "error: Please report this error for investigation."

  rm -f "$TEMP_LOG"
  # Exit with 0 to not fail the build
  exit 0
fi

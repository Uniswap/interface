#!/usr/bin/env bash
# Build and install a *release-signed* Android variant on a locally-attached
# device. This is the local-dev path; CI signs via Fastlane and does not use
# this script.
#
# What it does:
#   1. Ensures keystore.properties + keystore.jks exist (downloads from 1Password
#      via the existing keystore script if missing).
#   2. Reads the four signing values out of keystore.properties.
#   3. Re-exports them under the names build.gradle reads from the environment
#      (ANDROID_KEYSTORE_FILE / ANDROID_STORE_PASSWORD / ANDROID_KEYSTORE_ALIAS /
#      ANDROID_KEY_PASSWORD).
#   4. Invokes `bunx expo run:android` with the right variant flags.
#
# Why this exists as a separate wrapper instead of patching the shared targets:
# CI already wires the ANDROID_* env vars via Fastlane and does not source
# keystore.properties. Putting env bridging into the shared `android:*:release`
# Nx targets would either be a no-op on CI or risk shadowing Fastlane's values.
# Local-dev wrapping keeps the shared release pipeline 1:1 with what CI runs.
#
# Stale-code defenses (release variants embed JS in the APK, so a stale build
# silently tests old code). Both layers are handled here; see the
# argent-react-native-app-workflow skill for symptom/detection details:
#   1. Exports EXPO_LOCAL_NO_BUILD_CACHE so app.config.ts drops the EAS build
#      cache and `expo run:android` does a real build instead of reinstalling a
#      fingerprint-matched APK.
#   2. Deletes the gradle createBundle<Variant>JsAndAssets outputs (on by
#      default) so gradle re-bundles instead of reusing a stale, UP-TO-DATE
#      index.android.bundle. Pass --no-clean-js to skip for native-only rebuilds.
#
# Usage:
#   bash apps/mobile/scripts/runAndroidLocal.sh           # defaults to beta
#   bash apps/mobile/scripts/runAndroidLocal.sh beta
#   bash apps/mobile/scripts/runAndroidLocal.sh dev
#   bash apps/mobile/scripts/runAndroidLocal.sh prod
#   bash apps/mobile/scripts/runAndroidLocal.sh dev --no-clean-js
#
# Or via the bun shortcuts:
#   bun mobile android:beta:release:local
#   bun mobile android:dev:release:local
#   bun mobile android:prod:release:local

set -uo pipefail

VARIANT="beta"
CLEAN_JS=1
for arg in "$@"; do
  case "$arg" in
    --clean-js)    CLEAN_JS=1 ;;
    --no-clean-js) CLEAN_JS=0 ;;
    dev|beta|prod) VARIANT="$arg" ;;
    *)
      echo "ERROR: Unknown argument '$arg'. Valid: dev|beta|prod, --clean-js, --no-clean-js." >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$MOBILE_DIR/android"
PROPERTIES_PATH="$ANDROID_DIR/keystore.properties"
KEYSTORE_PATH="$ANDROID_DIR/app/keystore.jks"
KEYSTORE_SCRIPT="$SCRIPT_DIR/downloadAndroidKeystore.sh"

case "$VARIANT" in
  dev)
    EXPO_VARIANT="devRelease"
    APP_ID="com.uniswap.mobile.dev"
    ;;
  beta)
    EXPO_VARIANT="betaRelease"
    APP_ID="com.uniswap.mobile.beta"
    ;;
  prod)
    EXPO_VARIANT="prodRelease"
    APP_ID="com.uniswap.mobile"
    ;;
  *)
    echo "ERROR: Unknown variant '$VARIANT'. Valid: dev, beta, prod." >&2
    exit 1
    ;;
esac

# Ensure the keystore files exist. If they don't, fetch them.
if [ ! -f "$PROPERTIES_PATH" ] || [ ! -f "$KEYSTORE_PATH" ]; then
  echo "→ keystore.properties or keystore.jks missing; running download script..."
  bash "$KEYSTORE_SCRIPT" "$VARIANT" || exit $?
fi

# Translate the unprefixed names in keystore.properties to the ANDROID_*
# names that android/app/build.gradle reads from System.getenv(). The
# properties file is owned by the keystore download script; build.gradle's
# expected env var names are a separate contract maintained by CI's Fastlane
# setup. We bridge here so neither has to change.
#
# Note on ANDROID_KEYSTORE_FILE: we deliberately ignore the KEYSTORE_FILE value
# from keystore.properties. That value is a 1Password metadata field for CI's
# Fastlane pipeline (which fetches the keystore to a different filename), and
# doesn't match where downloadAndroidKeystore.sh writes the file locally. The
# download script always writes to `app/keystore.jks`, so we point gradle there.
STORE_PASSWORD_VAL=$(grep '^STORE_PASSWORD=' "$PROPERTIES_PATH" | cut -d= -f2-)
KEYSTORE_ALIAS_VAL=$(grep '^KEYSTORE_ALIAS=' "$PROPERTIES_PATH" | cut -d= -f2-)
KEY_PASSWORD_VAL=$(grep   '^KEY_PASSWORD='   "$PROPERTIES_PATH" | cut -d= -f2-)

if [ -z "$STORE_PASSWORD_VAL" ] || [ -z "$KEY_PASSWORD_VAL" ] || [ -z "$KEYSTORE_ALIAS_VAL" ]; then
  cat <<EOF >&2
ERROR: keystore.properties is missing one or more required values for variant '$VARIANT'.

Expected non-empty: STORE_PASSWORD, KEYSTORE_ALIAS, KEY_PASSWORD.

Try re-fetching:
  bun mobile env:android:keystore:download:$VARIANT
EOF
  exit 1
fi

export ANDROID_KEYSTORE_FILE="keystore.jks"
export ANDROID_STORE_PASSWORD="$STORE_PASSWORD_VAL"
export ANDROID_KEYSTORE_ALIAS="$KEYSTORE_ALIAS_VAL"
export ANDROID_KEY_PASSWORD="$KEY_PASSWORD_VAL"

export EXPO_ANDROID_LAUNCH_ACTIVITY="$APP_ID/com.uniswap.MainActivity"

# Force a real build instead of an EAS cache reinstall (see header note 1).
export EXPO_LOCAL_NO_BUILD_CACHE=1

# Force a JS re-bundle (see header note 2). gradle's createBundle<Variant>JsAndAssets
# misses monorepo JS edits and stays UP-TO-DATE, so the APK keeps a stale bundle.
# The bundle/assets land under .../react/<variant> (the task NAME is not the dir),
# so the clear must target the variant dir or it silently misses and reuses old JS.
if [ "$CLEAN_JS" -eq 1 ]; then
  echo "→ Clearing stale JS bundle outputs for $EXPO_VARIANT (pass --no-clean-js to skip)"
  rm -rf \
    "$ANDROID_DIR/app/build/generated/assets/react/$EXPO_VARIANT" \
    "$ANDROID_DIR/app/build/generated/res/react/$EXPO_VARIANT" \
    "$ANDROID_DIR/app/build/generated/sourcemaps/react/$EXPO_VARIANT" \
    "$ANDROID_DIR/app/build/intermediates/assets/$EXPO_VARIANT"
fi

echo "→ Building $EXPO_VARIANT (app id: $APP_ID)"
echo

cd "$MOBILE_DIR"
exec bunx expo run:android --variant="$EXPO_VARIANT" --app-id="$APP_ID"

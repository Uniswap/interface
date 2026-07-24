#!/bin/bash

# Fails when a react-native patch in patches/ modifies native (compiled) sources while
# iOS consumes React Native core as prebuilt XCFrameworks.
#
# Why: with ios.buildReactNativeFromSource != "true" (and newArchEnabled != "false"), the
# Podfile sets RCT_USE_PREBUILT_RNCORE=1 / RCT_USE_RN_DEP=1 and RN core is downloaded from
# Maven Central instead of being compiled from node_modules — so any patched C++/ObjC in the
# RN package is silently never built into the app. This exact silent drop lost the INFRA-2390
# yoga ghost-view fix (facebook/react-native#52349) within hours of it landing: #35868 patched
# ReactCommon/.../YogaLayoutableShadowNode.cpp while #35347 had just switched iOS to prebuilt
# core, and e2e tests started failing on invisible views.

set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
REPO_ROOT="${SCRIPT_DIR}/.."
PODFILE_PROPERTIES="${REPO_ROOT}/apps/mobile/ios/Podfile.properties.json"

get_property() {
    grep -o "\"$1\": *\"[^\"]*\"" "$PODFILE_PROPERTIES" | sed 's/.*: *"\(.*\)"/\1/'
}

if [ ! -f "$PODFILE_PROPERTIES" ]; then
    echo "Error: $PODFILE_PROPERTIES not found."
    exit 1
fi

build_from_source=$(get_property "ios.buildReactNativeFromSource" || true)
new_arch_enabled=$(get_property "newArchEnabled" || true)

# Mirrors apps/mobile/ios/Podfile: prebuilt RN core is active unless the flag is exactly "true"
# (RN 0.85 treats unset/other values as prebuilt) while new arch is enabled.
# Hand-mirrored from the RCT_USE_PREBUILT_RNCORE / RCT_USE_RN_DEP assignments in
# apps/mobile/ios/Podfile (lines 27-31) — update this check if that condition changes.
if [ "$build_from_source" == "true" ] || [ "$new_arch_enabled" == "false" ]; then
    exit 0
fi

# Native sources compiled only when RN core is built from source. Podspec/ruby/JS changes still
# apply with prebuilt core, so only compiled-source extensions are flagged.
native_hunks=$(grep -h '^diff --git ' "${REPO_ROOT}/patches/react-native@"*.patch 2>/dev/null \
    | awk '{print $NF}' \
    | sed 's|^b/||; s|^node_modules/react-native/||' \
    | grep -E '^(ReactCommon|React|Libraries)/.*\.(c|cc|cpp|cxx|m|mm|h|hpp|S)$' \
    || true)

if [ -n "$native_hunks" ]; then
    echo "Error: patches/react-native@*.patch modifies native RN sources, but iOS uses prebuilt RN core"
    echo "(ios.buildReactNativeFromSource is \"${build_from_source:-unset}\" in apps/mobile/ios/Podfile.properties.json)."
    echo ""
    echo "Prebuilt XCFrameworks from Maven Central replace the RN core source pods, so these patched"
    echo "files are never compiled into the app — the patch is silently dropped from every iOS build"
    echo "(this is how the INFRA-2390 yoga ghost-view fix was lost; see facebook/react-native#52349):"
    echo ""
    echo "$native_hunks" | sed 's/^/  - /'
    echo ""
    echo "Fix one side of the conflict:"
    echo "  - set \"ios.buildReactNativeFromSource\": \"true\" (and mirror it in apps/mobile/app.config.ts), or"
    echo "  - drop the native hunk from the patch once the fix ships in the prebuilt RN artifacts."
    exit 1
fi

exit 0

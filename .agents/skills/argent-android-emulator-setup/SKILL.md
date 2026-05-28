---
name: argent-android-emulator-setup
description: Set up and connect to an Android emulator using argent MCP tools. Use when starting a new session on Android, booting an emulator, getting a device serial, or before any UI interaction task.
---

## 1. Prerequisites

- **Android SDK Platform Tools** on PATH — provides `adb`.
- **Android Emulator** on PATH — needed to boot AVDs. If you will only use an already-running emulator or a physical device, adb alone is sufficient.
- An AVD created via Android Studio or `avdmanager create avd`.

Verify with `adb version` and `emulator -list-avds`.

## 2. Setup

1. **Find a ready device** — call `list-devices`. Filter for entries with `platform: "android"`. Ready devices (`state: "device"`) come first. Pick the first `serial` (e.g. `emulator-5554`) unless the user specified one.
2. **Boot if needed** — if nothing Android is ready, call `boot-device` with `avdName: <name>` from the same call's `avds` list. The tool transparently picks hot vs cold boot: it probes the AVD's `default_boot` snapshot, restores it under a tight deadline when usable, and falls back to a full cold boot otherwise. Hot path is typically ~30s; cold path takes 2–10 min. On any stage failure the tool kills the emulator process it started so your next call starts from a clean state.
3. **Metro (for React Native)** — once a device is up, run `adb -s <serial> reverse tcp:8081 tcp:8081` so the device can reach Metro on your host. Repeat if the device restarts. See the `argent-metro-debugger` skill.

## 3. Using the device

Pass the Android serial as `udid` to the unified interaction tools — `gesture-tap`, `gesture-swipe`, `describe`, `screenshot`, `launch-app`, `keyboard`, etc. Dispatch is automatic based on the id shape. See `argent-device-interact` for platform-neutral interaction tooling and the Android-specific gotchas section at the bottom of that skill.

## 4. Notes

- Serials are the adb device id. iOS UDIDs and Android serials are not interchangeable, but you do NOT need to tell the tools which platform — dispatch is automatic.
- `describe` on Android returns a shallower tree than iOS (no accessibility-service equivalent), but covers most tap-target discovery.
- `reinstall-app` on Android always installs with `-g` so first-launch runtime permissions are pre-granted.
- To kill the emulator when you're done, run `adb -s <serial> emu kill` from a shell.

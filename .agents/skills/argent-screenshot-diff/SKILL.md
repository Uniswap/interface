---
name: argent-screenshot-diff
description: Capture stable before/after screenshots on an iOS simulator or Android emulator and pixel-diff them into evidence. Use when asked for a visual regression check, a screenshot diff, a before/after visual comparison, or when a visible mobile UI change needs pixel proof — including the executed screenshot-diff that a component migration batch requires.
---

## 1. Use the first-party `screenshot-diff` tool

`screenshot-diff` is a real first-party argent MCP tool, and it is the preferred path for every diff in this skill. Hand-rolling a pixel diff is the fallback (§ 5), not the default.

| Parameter | Required | Notes |
| --- | --- | --- |
| `udid` | **yes** | iOS UUID or Android adb serial, same as every other argent tool |
| `outputDir` | **yes** | Where the diff artifacts are written |
| `baselinePath`, `currentPath` | mode A | Two PNGs you already saved to disk |
| `captureBaseline`, `captureCurrent` | mode B | The tool captures live from the device instead |
| `rotation` | no | The same rotation parameter `screenshot` takes |

Supply **either** the saved-PNG pair **or** the live-capture flags — the two modes are alternatives, not additions.

Returns `{ summary, diffPath, contextDiffPath }`: the comparison summary plus two written artifacts, the diff image and a context diff.

**It excludes the fixed status-bar band from both the pixel and the OCR comparison.** That alone is reason to prefer it over anything hand-rolled. The clock, battery percentage and signal indicators differ between any two captures taken seconds apart, and on a full-screen mobile capture they are the single most common source of false positives. With this tool you neither crop them out nor explain them away in review.

**Load the schema before your first call** — deferred tools in this environment expose only their name until you load them. ToolSearch for `screenshot-diff`, read the parameter names and return shape off the schema, and use those. The table above was transcribed from a session with the argent server connected rather than verified in the session that wrote this skill, so treat the loaded schema as the authority wherever the two disagree.

**Never invent a tool signature.** If ToolSearch cannot load it, the tool is not available to your session — take the § 5 fallback and say so in your report.

---

## 2. Prerequisites and their limits

From `apps/mobile/CLAUDE.md`:

```bash
bun add -g @swmansion/argent   # one-time per machine; puts `argent` on PATH
```

- **Argent does not build or install the app for you** — it drives whatever is already on the sim. Get the build you intend to compare installed and running first via `argent-react-native-app-workflow`.
- **Argent owns the simulator.** Do not mix `xcrun simctl install/launch/terminate` with argent calls — sim state corruption is real, and a corrupted sim silently poisons a diff.
- **Do not run `argent init`** — skills and config are already committed. `argent update` only when intentionally refreshing.
- **Android**: run `adb -s <serial> reverse tcp:8081 tcp:8081` before the app starts, or Metro is unreachable and you will capture a red screen.
- **At session end**: call `stop-all-simulator-servers`.

Get a `udid` per `argent-ios-simulator-setup` (iOS, UUID-shaped) or `argent-android-emulator-setup` (Android, adb serial). Tool names are identical on both platforms.

---

## 3. The headless constraint — state it, do not paper over it

**A headless or CI agent session cannot drive a local simulator or emulator.** There is no sim to attach to, no Xcode/`xctrace`, no emulator, and no display. This was the blocking finding on INFRA-3096 and it has not changed.

Everything below is the **argent-driven local-device path**, and that path needs a **locally attached simulator, emulator, or device** in a session running on a developer machine: argent's MCP server drives a local sim/emulator or an attached device, and a headless session has no argent binary, no argent MCP server, and no device.

If you are headless, do **not** stage a diff and imply it ran. A staged-but-unrun diff is not evidence. Instead do one of:

1. **Hand off.** Stage the comparison surface (§ 4), commit it, and write the exact runnable steps — udid selection, story names, `scale: 1.0`, the `screenshot-diff` call and its `outputDir`, and the state matrix — into the Linear issue and PR body so a human-run session executes it verbatim.
2. **Record the obligation.** Comment on the issue that the executed diff is outstanding, with the commit the diff must be run against. An unmet obligation on the record beats a fabricated verdict.
3. **Substitute, with sign-off.** If no legacy twin exists there is nothing to diff at all — substitute self-contained behavioral tests plus **explicit requester sign-off**.

### Remote devices — the blockers above are narrower than "you need a developer machine"

Those blockers are about driving **argent**. They are not a claim that on-device visual evidence is impossible without a local simulator. **AWS Device Farm runs real remote devices and needs no local sim and no macOS host**, so it is a plausible route to the underlying evidence goal — before/after captures from a real device, taken to a pixel diff. What that route carries:

- **Whether argent can target a Device Farm device is untested.** Do not claim it can and do not claim it cannot; if you need argent specifically, treat it as an open question to verify.
- **The build must embed a dev-mode bundle**, because Storybook is `__DEV__`-only (§ 8) — a bundled production build cannot show the staged stories at all.
- **Android-only absent a macOS host**, since an iOS build needs one.

**The INFRA-3096 "declined" note is narrower than it reads.** A Device Farm pass was declined there — but on a batch with **zero converted files**, where the objection was to diffing a batch in which nothing had changed ("staged evidence with extra steps"), not to Device Farm as a capture mechanism. That is a reading of INFRA-3096 comment `fe4db9f3`; check it yourself before citing it either way. Whichever capture route you use, "executed, never staged" is unchanged — the diff must actually run, against changed code.

---

## 4. Staging the comparison — the canonical pattern

The repo practice this skill formalizes: put both sides in **one Storybook file** rendering the **identical state matrix at identical screen positions**, so a diff of the two stories measures nothing but the component.

Pattern files:

- `apps/mobile/src/components/mycelium/SegmentedControlMigration.stories.tsx` (#37202) — the template. `Legacy` and `Rebuilt` stories render the exact same matrix at the exact same positions; `SideBySide` stacks both per state for eyeballing.
- `apps/mobile/src/components/mycelium/ShimmerMigration.stories.tsx` — carries a hard-won caveat.

Rules that fall out of those two files:

| Case | Stage it as | Why |
| --- | --- | --- |
| Static states | Standalone `Legacy` + `Rebuilt` stories, identical positions | Diffable pair, nothing else varies |
| **Animated** states | `SideBySide`, both mounts **simultaneous** | Separate mounts start their animation clocks at different times — an out-of-phase row looks frozen or broken when both implementations are correct. Phase-lock or do not diff. |
| No legacy twin | Not diffable at all | Behavioral tests + requester sign-off instead |

Identical positions is not a nicety. Any offset makes the whole panel differ and the diff is worthless.

---

## 5. Capture and diff — the procedure

Get a `udid` from `list-devices`, stage both sides per § 4, and settle per § 6. Then:

1. Navigate to the `Legacy` story. Settle, then `screenshot` with **`scale: 1.0`**, persisted to disk.
2. Navigate to `Rebuilt` — same route, same scroll offset, no device rotation between captures.
3. Settle, then `screenshot` with `scale: 1.0`, persisted to disk.
4. Call `screenshot-diff` with `udid`, an `outputDir`, and the two files as `baselinePath` / `currentPath`.
5. Read `summary`, then open `diffPath` and `contextDiffPath` and actually look at them (§ 7).

### `scale: 1.0` is mandatory for anything you feed to a diff

`screenshot` **downscales to 30% of native resolution by default** to save context (`argent-device-interact` § 7). `scale` accepts `0.01`–`1.0`.

> A 30% capture has thrown away the pixels you are measuring: it invents resampling differences that read as regressions, and it hides real one-pixel border and anti-aliasing shifts. A diff run at the default scale is not evidence.

```json
{ "udid": "<UDID>", "scale": 1.0 }
```

If `screenshot` returns an inline image rather than a file path, you need the bytes on disk before `baselinePath` / `currentPath` will accept them. **Load the tool's schema with ToolSearch and read its actual return shape** — do not assume either form.

### The live-capture mode

`captureBaseline` / `captureCurrent` (§ 1) let `screenshot-diff` take the shots itself instead of you saving PNGs. Read the schema for how the two are sequenced before relying on it: the staged-story pattern in § 4 requires **navigating between the two captures**, and a before/after across a code change requires a rebuild between them. Prefer the saved-PNG pair whenever anything has to happen in between.

### Fallback — only when `screenshot-diff` will not load

For a session with no argent MCP server connected, or an argent version predating the tool. Capture the pair exactly as above, then diff the PNGs yourself: `labs/workbench` already carries the engine as devDeps (`pixelmatch` 7.2.0, `pngjs` 7.0.0), and `labs/workbench/scripts/visual/compare.ts` is a working reference for the pixelmatch call, padding, and flag arithmetic — reuse it rather than reaching for a new dependency. You then own the two jobs the first-party tool does for you: masking the status-bar band, and picking thresholds (§ 7).

---

## 6. Determinism — eliminate false positives before you diff

A flaky diff is worse than no diff: it trains reviewers to ignore the artifact. Fix all of these before capturing.

- **Kill animation.** Disable animations in the app, or use a `SideBySide` phase-locked mount for anything that moves. Never diff a mid-transition frame.
- **Pin the device.** Same simulator model **and** same OS version for before and after. A different sim is a different renderer.
- **Pin the position.** Identical scroll offset, orientation, and safe-area insets. Do not rotate between captures.
- **Settle before capture.** Wait for the screen to be static — no spinner, no skeleton, no in-flight image load. If the returned screenshot shows a transitional frame, retake with `screenshot` (the `argent-test-ui-flow` recovery pattern).
- **Same content.** No live data, no timestamps, no randomized ordering, no avatar that loads from the network.
- **Same theme.** Diff light against light and dark against dark, as separate pairs.

---

## 7. Reading the result

### With `screenshot-diff` (the primary path)

`summary` is the judgement surface; `diffPath` and `contextDiffPath` are the artifacts.

- **Read `summary`, then corroborate it against the images.** A summary you did not check against the diff image is a claim, not a verdict.
- **The contract in § 1 exposes no threshold, sensitivity, or flagging parameter** — so there is nothing to tune, and this skill will not recommend a number for it. Do not invent one. If the schema you load exposes a knob § 1 does not list, use it and record the value you passed.
- **Calibrate with a no-change control pair.** Capture the same story twice with nothing changed and diff it. Whatever the tool reports on that pair is the floor for this device, this OS version, this screen — a real pair must clear it visibly. With no tunable threshold, this control is the calibration.
- **Status-bar drift is already excluded** (§ 1), so anything reported is real content, not a clock tick.

**How the harness numbers below translate: they mostly do not.** Stated plainly so nobody tries to reconcile them:

| Harness concept | Counterpart in `screenshot-diff` |
| --- | --- |
| `--pixel-threshold` (per-pixel color sensitivity) | **None exposed.** The tool decides its own sensitivity |
| `--flag-ratio` (`diffPixels / totalPixels`) | **None exposed.** The tool does not take a flagging rule from you |
| `--min-diff-pixels` (absolute floor) | **None exposed** |
| Manual status-bar masking | **Built in** — excluded from pixel *and* OCR comparison |
| Diff PNG output | `diffPath`, plus `contextDiffPath` |
| Flag verdict computed by you | `summary`, computed by the tool |

Three of the harness's four knobs have no counterpart. That is not a gap to paper over with an invented mapping — it means the judgement moves from *choosing numbers* to *reading `summary` against a control pair and looking at the diff image*.

### Fallback thresholds — hand-rolled `pixelmatch` only

Everything below applies to the § 5 fallback, not to `screenshot-diff`.

**Established precedent** — `labs/workbench/scripts/visual/README.md`, the web harness. A pair is flagged when **both** conditions hold:

```
diffPixels / totalPixels > 0.005     # relative ratio (--flag-ratio)
AND diffPixels > 250                 # absolute floor (--min-diff-pixels)
```

with a per-pixel color sensitivity of `0.1` (`--pixel-threshold`, passed to pixelmatch).

**Why two conditions, so you can adapt rather than cargo-cult:** the ratio alone over-fires on small panels. On a ~6–10k-pixel panel, sub-perceptual anti-aliasing noise (the harness's documented case: translucent-token compositing rendering text a few 8-bit steps apart) is ~120–180 px — under 250 absolute, but *over* 0.005 relative. The absolute floor absorbs exactly that. Meanwhile a genuinely broken color repaints most of a panel at high delta and trips both conditions comfortably. The two-condition rule buys you a wide, empty band between noise and real breakage.

**Starting recommendations for mobile** (mine, not established — tune and record what you used):

- Keep `pixel-threshold` at `0.1`. It is the sensitivity that was validated against real token-compositing noise, and it is platform-independent.
- Keep the `0.005` ratio.
- **Raise the absolute floor** above 250. Mobile captures at `scale: 1.0` are far larger than a workbench panel, and native text rasterization is noisier than Chromium's — 250 px will fire on nothing. Scale the floor with panel area: the web value is ~2.5–4% of a 6–10k-px panel, so start there and calibrate against a **no-change control pair** (capture the same story twice, unchanged; that number is your noise floor, and your threshold goes above it).
- Any pair you had to raise a threshold to pass is **not** green — investigate it.

Record what you ran alongside the verdict — `screenshot-diff` and which mode, or the fallback and its thresholds. A verdict without its mechanism is unreproducible.

---

## 8. The Storybook tension — real, and reconcilable

This diff practice needs **Storybook**. But `apps/mobile/CLAUDE.md` mandates `NODE_ENV=production` for agent/CLI Metro precisely *because* dev-mode bundles Storybook and the app boots into Storybook UI, "breaking agent-driven interaction flows":

```bash
bun nx run mobile:start:production   # the normal agent default — Storybook OFF
```

Both are correct; they are different jobs. Reconcile by **choosing the mode for the task, deliberately and out loud**:

| Task | Metro mode | Storybook |
| --- | --- | --- |
| Driving real app screens, flows, QA, profiling | `mobile:start:production` | off (required) |
| **Screenshot-diffing a staged story matrix** | dev Metro (`NODE_ENV` unset) | on (required) |

So: a screenshot-diff session runs dev Metro *on purpose*, and booting into Storybook UI is the desired outcome, not the failure the CLAUDE.md rule warns about. Consequences to hold onto:

- **Do not do both in one Metro session.** Finish the diff, then restart Metro in production mode before any app-flow work — and say in your report which mode each artifact came from.
- `NODE_ENV` applies at **JS-bundle time**. For a device build with no Metro dev server the flag goes on the build command, so a bundled production build cannot show Storybook at all — what you need is a **dev-mode bundle**, and how you get one depends on the route (§ 3): dev Metro against a local simulator, or a dev-mode-bundled build on a remote device.
- A reviewer seeing Storybook chrome in your evidence should not read it as a broken setup. Label the captures as Storybook stories.

---

## 9. Recording the evidence

An executed diff is only evidence once it is **on the record**. Post to both the Linear issue and the PR:

1. **Before/after images** per state — legacy, rebuilt, and the diff PNG. Never commit the images into the repo (the web harness's rule: report JSON is committed, images are gitignored); attach them to the issue/PR instead.
2. **Video for motion.** Static screenshots cannot prove an animation. Channel convention is before/after screenshots **plus video for anything animated**.
3. **Provenance**: device model, OS version, platform, Metro mode, and the **commit SHA** the diff ran against. A diff against uncommitted work is not reproducible — the web harness refuses a dirty tree for exactly this reason.
4. **The diff mechanism** (§ 7) — `screenshot-diff` and its mode, or the fallback with the thresholds you used and any deviation from the defaults and why.
5. **A verdict per state**, not one aggregate. `pass` / `flagged` / `known drift (reason)`. Enumerate the full matrix so a reviewer can see nothing was quietly skipped.
6. **Captured from where.** Visual evidence must come from a deployed preview or the workbench — never local dev — for web. For mobile the equivalent is the installed build at a named commit, stated explicitly.

Say plainly whether the diff **ran**. "Staged" and "executed" are different claims and reviewers rely on the difference.

---

## Related Skills

| Skill | When to use |
| --- | --- |
| `argent-device-interact` | The `screenshot` tool itself, `scale`, rotation, gestures, troubleshooting (§ 7 is the screenshot reference) |
| `argent-test-ui-flow` | Navigating to the staged stories; the settle/retake recovery pattern before capture |
| `argent-ios-simulator-setup` | Booting an iOS simulator, getting a UDID |
| `argent-android-emulator-setup` | Booting an Android emulator, getting an adb serial, `adb reverse` |
| `argent-create-flow` | Record the navigate-and-capture sequence as a flow so before/after captures are byte-for-byte reproducible via `flow-execute` — this removes interaction variance, the largest source of diff noise |
| `argent-react-native-app-workflow` | Getting the build installed and Metro running before any capture |

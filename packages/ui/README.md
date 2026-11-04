# `ui` Package (soft-deprecated)

Don't add new components here. Shared components for web, mobile and extension now live in [`@universe/mycelium`](../mycelium/README.md), and this package is being emptied into it. The end state is deleting `ui`.

Most of what `ui` used to provide — `Flex`, `Text`, `Button`, `TouchableArea`, icons, the theme, tokens and hooks such as `useSporeColors` — is imported from `@universe/mycelium` now.

## What's left

`src/index.ts` lists what `ui` still exports. These are components mycelium doesn't cover yet, mostly built on mycelium primitives:

- `Popover`, `AdaptiveWebPopoverContent`, `Coachmark`
- Modal internals: `WebBottomSheet`, `EffectiveModalOrSheetZIndexContext`, `RemoveScroll`
- `Slider`, `QRCodeDisplay`, `SwipeableCardStack`, `OverKeyboardContent`
- Loaders (`PulseRipple`, `WaveLoader`), `animations`, text helpers, `Image`, `useDynamicFontSizing`

## Moving a component out

1. Add the component to `@universe/mycelium` (see its `CLAUDE.md` for the platform-split conventions).
2. Swap every consumer to the mycelium import.
3. Delete the `ui` copy, its export from `src/index.ts`, and its path from the `ui/src` lists in the root `dangerfile.ts`.

// Logo barrel for @universe/mycelium (INFRA-3469), mirroring the legacy
// icons/logos split: `ui/src/components/logos` is a separate hand-written
// barrel from `ui/src/components/icons`, and the icons parity suite
// (packages/tailwind/src/parity/icons/icons.parity.test.tsx) pins the mycelium
// ICON barrel exactly equal to the legacy ICON barrel — so logos without a
// legacy-icon counterpart live here, outside both the pinned set and the
// `build:icons` generator's re-export sweep of components/icons.
//
// Hand-written multicolor artwork only (the generator rewrites every hex fill
// to `currentColor`, which destroys brand palettes) — same rationale as
// GoogleLogoGradient in components/icons.

export { AnimatedGoogleChromeLogo, GoogleChromeLogo } from './GoogleChromeLogo'
export { AcrossLogo, AnimatedAcrossLogo } from './AcrossLogo'

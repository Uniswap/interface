/**
 * Platform-specific Tamagui animations configuration.
 *
 * - Web: Uses CSS animations (@tamagui/animations-css) - index.web.ts
 * - Native: Uses moti/reanimated (@tamagui/animations-moti) - index.native.ts
 *
 * This base file exports CSS animations for compatibility with:
 * 1. Tamagui extractor (runs in Node.js at build time)
 * 2. Any other build-time tooling that doesn't understand platform extensions
 *
 * At runtime, platform-specific bundlers (Metro, Vite, Webpack) will resolve
 * to the appropriate .native.ts or .web.ts file.
 */
import { createAnimations } from '@tamagui/animations-css'

// CSS equivalents for the moti/reanimated spring and timing animations
// Spring animations are approximated using CSS cubic-bezier timing functions
export const animations = createAnimations({
  '100ms': '100ms ease-in-out',
  '125ms': '125ms ease-in-out',
  '125msDelayed': '125ms ease-in-out 250ms',
  '125msDelayedLong': '125ms ease-in-out 2000ms',
  '200ms': '200ms ease-in-out',
  // Delay animations (matching delay200ms.ts pattern)
  '200msDelayed1ms': '200ms ease-out 1ms',
  '200msDelayed40ms': '200ms ease-out 40ms',
  '200msDelayed80ms': '200ms ease-out 80ms',
  '200msDelayed120ms': '200ms ease-out 120ms',
  '200msDelayed160ms': '200ms ease-out 160ms',
  '200msDelayed200ms': '200ms ease-out 200ms',
  '200msDelayed240ms': '200ms ease-out 240ms',
  '300ms': '300ms ease-in-out',
  '300msDelayed': '300ms ease-in-out 150ms',
  '80ms-ease-in-out': '80ms ease-in-out',
  // Spring approximations using cubic-bezier
  // stiff: high stiffness (400), high damping (200) - very snappy
  stiff: '150ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  // bouncy: low damping (10), medium stiffness (100) - bounces a lot
  bouncy: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  // semiBouncy: slightly more damping than bouncy
  semiBouncy: '350ms cubic-bezier(0.25, 1.25, 0.5, 1)',
  // lazy: low stiffness (60), medium damping (20) - slow and smooth
  lazy: '500ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  // quick: medium-high stiffness (250), medium damping (20)
  quick: '200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  // quicker: high stiffness (390), slightly less damping
  quicker: '180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  // quickishDelayed: like quicker but with delay
  quickishDelayed: '200ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 70ms',
  // fast: very high stiffness (1000), high damping (75) - instant feel
  fast: '100ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  // fastHeavy: like fast but heavier mass
  fastHeavy: '120ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  // fastExit: very fast exit animation
  fastExit: '80ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  // fastExitHeavy: like fastExit but heavier
  fastExitHeavy: '100ms cubic-bezier(0.17, 0.67, 0.45, 1)',
  // simple: basic timing
  simple: '80ms ease-in-out',
})

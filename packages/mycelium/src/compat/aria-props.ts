/**
 * The aria-* leg of the compat pass-through surface, split out of props.ts so
 * that growing it doesn't push that file past its line budget.
 *
 * Forwarded verbatim to the DOM element on web; the native allow-list
 * (compat/native-props.ts) carries its own, deliberately narrower set.
 * Boolean fields also accept `'true' | 'false'` (React's own `Booleanish`) so
 * that call sites typed as raw `HTMLAttributes` stay assignable.
 *
 * Every key here must also appear in `ARIA_PROP_KEYS` (compat/dom.tsx):
 * forwarding is an allow-list, JSX spreads are not excess-property-checked, so
 * a key typed but unlisted compiles and then renders without the attribute.
 * `dom.test.tsx` pins the two together.
 */
export interface CompatAriaProps {
  'aria-busy'?: boolean | 'true' | 'false'
  'aria-checked'?: boolean | 'true' | 'false' | 'mixed'
  'aria-controls'?: string
  'aria-describedby'?: string
  'aria-disabled'?: boolean | 'true' | 'false'
  'aria-expanded'?: boolean | 'true' | 'false'
  'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-hidden'?: boolean | 'true' | 'false'
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-modal'?: boolean | 'true' | 'false'
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed'
  'aria-selected'?: boolean | 'true' | 'false'
  'aria-valuemax'?: number
  'aria-valuemin'?: number
  'aria-valuenow'?: number
  'aria-valuetext'?: string
}
